import { Hono } from "hono";
import { GitHubError, snapshot } from "./github";
import { grade } from "./grade";
import type { Report } from "./grade/types";
import { errorBadge, gradeBadge } from "./render/badge";
import { errorPage, reportPage } from "./render/page";
import { reportText } from "./render/text";
import { aboutPage, agentsMdPage, homePage, notFoundPage } from "./render/static-pages";
import { leaderboardPage } from "./render/leaderboard";
import { feedbackPage } from "./render/feedback";
import { findingsPage } from "./render/findings";
import { GUIDES, guideBySlug } from "./render/guides-data";
import { guidePage, guidesIndex } from "./render/guides";
import { privacyPage, termsPage } from "./render/legal";
import { type Row, type Sort, allSlugs, languageMedians, languages, leaderboard, leaderboardStats, relatedRepos, saveReport, storedReport } from "./db";

export interface Env {
  GITHUB_TOKEN?: string;
  DB?: D1Database;
  /** Commit this build came from. Injected by the deploy workflow. */
  GIT_SHA?: string;
  /** Pre-rendered Open Graph cards. */
  ASSETS?: Fetcher;
  /** Throttles live grading. See the note in wrangler.jsonc. */
  GRADE_LIMIT?: { limit(opts: { key: string }): Promise<{ success: boolean }> };
}

const app = new Hono<{ Bindings: Env }>();

/**
 * Stamps every response with the commit it was built from.
 *
 * Without this there is no way to tell which source produced what is running:
 * a Worker version id says nothing about a commit, so "what is deployed?"
 * becomes a question only the person who ran deploy can answer.
 */
app.use("*", async (c, next) => {
  await next();
  c.header("x-agentreadme-version", c.env.GIT_SHA ?? "dev");
});

/** Machine-readable build and health check. */
app.get("/version", (c) =>
  c.json(
    { commit: c.env.GIT_SHA ?? "dev", source: "https://github.com/dejan23/agentreadme" },
    200,
    { "Cache-Control": "no-store" },
  ),
);

/** Paths that are pages of ours, not GitHub owners. */
const RESERVED = new Set([
  "about", "leaderboard", "analyze", "badge", "og", "favicon.svg", "robots.txt",
  "sitemap.xml", "what-is-agents-md", "api", "static", "_", "assets", "privacy", "terms", "version", "og",
  "draft", "findings", "feedback", "llms.txt", "guides",
]);

// GitHub's own rules: an owner is alphanumeric with single hyphens, a repo may
// also carry dots and underscores. Keeping these tight stops "a/b/c/d" and
// "../../etc/passwd" from ever reaching the API.
const OWNER = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/;
const REPO = /^(?!\.\.?$)[A-Za-z0-9._-]{1,100}$/;

/**
 * Accepts what people actually paste.
 *
 * The common case is a URL copied from the browser while looking at a repo,
 * which carries a branch path and often a query string: .../tree/main,
 * .../blob/main/README.md, ?tab=readme-ov-file. Rejecting those rejected the
 * single most likely way anyone arrives here.
 *
 * A host is what makes extra path segments safe to ignore. A bare "a/b/c/d"
 * with no host is still refused, because that is garbage rather than a URL.
 */
export function parseRepo(input: string): { owner: string; repo: string } | null {
  let s = input.trim();
  if (!s) return null;

  // Strip a query string or fragment first: ?tab=readme-ov-file, #readme.
  s = s.split("?")[0].split("#")[0];

  let hadHost = false;
  const ssh = s.match(/^git@github\.com:(.+)$/i);
  if (ssh) {
    s = ssh[1];
    hadHost = true;
  } else {
    // With or without a scheme. "github.com/owner/repo" is pasted constantly.
    const web = s.match(/^(?:https?:\/\/)?(?:www\.)?github\.com\/(.*)$/i);
    if (web) {
      s = web[1];
      hadHost = true;
    }
  }

  s = s.replace(/\.git$/i, "").replace(/^\/+|\/+$/g, "");
  const parts = s.split("/").filter(Boolean);

  // From a URL, everything past owner/repo is a branch or file path.
  if (parts.length < 2) return null;
  if (!hadHost && parts.length !== 2) return null;

  const [owner, repo] = parts;
  if (!OWNER.test(owner) || !REPO.test(repo)) return null;
  if (RESERVED.has(owner.toLowerCase())) return null;
  return { owner, repo };
}

async function cached(
  c: { req: { raw: Request } },
  ttl: number,
  build: () => Promise<Response>,
): Promise<Response> {
  const cache = caches.default;
  const key = new Request(new URL(c.req.raw.url).toString(), { method: "GET" });
  if (ttl > 0) {
    const hit = await cache.match(key);
    if (hit) return hit;
  }

  const res = await build();
  if (ttl > 0 && res.status === 200) {
    const copy = res.clone();
    copy.headers.set("Cache-Control", `public, max-age=${Math.min(ttl, 300)}, s-maxage=${ttl}`);
    const store = new Response(copy.body, { status: 200, headers: copy.headers });
    await cache.put(key, store.clone());
    return store;
  }
  return res;
}

/**
 * How long a stored report is served without asking GitHub again.
 *
 * Every distinct repo we grade spends from one 5,000/hour token shared by every
 * visitor, so a loop over random repo names could take grading down for
 * everyone. Serving from D1 makes a repeat request cost nothing, and the stale
 * fallback below turns an exhausted token into a slightly old page rather than
 * an error.
 */
const FRESH_MS = 24 * 60 * 60 * 1000;

/**
 * Allowed to mark a repository we have not seen before?
 *
 * Deliberately checked only on the path that calls GitHub, never on cached or
 * stored responses. Two reasons: ordinary reading should never be throttled,
 * and badge traffic arrives through GitHub's image proxy from a small set of
 * addresses, so limiting those by IP would break badges for everyone at once.
 */
/** ?refresh=1 forces a re-mark. Still rate limited, so it is not a free lever. */
function wantsRefresh(url: string): boolean {
  return new URL(url).searchParams.get("refresh") === "1";
}

/** Drops the cached copy of a URL so a refresh is not undone by the edge. */
async function dropCached(url: string): Promise<void> {
  try {
    await caches.default.delete(new Request(url, { method: "GET" }));
  } catch {
    /* best effort */
  }
}

async function mayGradeLive(c: {
  env: Env;
  req: { header(name: string): string | undefined };
}): Promise<boolean> {
  if (!c.env.GRADE_LIMIT) return true;
  const ip = c.req.header("cf-connecting-ip") ?? "unknown";
  try {
    const { success } = await c.env.GRADE_LIMIT.limit({ key: `grade:${ip}` });
    return success;
  } catch {
    return true; // never let the limiter itself take the site down
  }
}

const HTML = { "Content-Type": "text/html; charset=utf-8" };
const SVG = {
  "Content-Type": "image/svg+xml; charset=utf-8",
  "Cache-Control": "public, max-age=1800, s-maxage=1800",
};

app.get("/", async (c) => {
  // Show real recent grades when we have them, and fall back to a measured
  // sample so the page is never empty on a cold database.
  let recent: Awaited<ReturnType<typeof leaderboard>> | undefined;
  let stats: Awaited<ReturnType<typeof leaderboardStats>> | undefined;
  let langs: Awaited<ReturnType<typeof languageMedians>> | undefined;
  if (c.env.DB) {
    [recent, stats, langs] = await Promise.all([
      leaderboard(c.env.DB, { sort: "popular", limit: 8 }).catch(() => undefined),
      leaderboardStats(c.env.DB).catch(() => undefined),
      languageMedians(c.env.DB).catch(() => undefined),
    ]);
  }
  return c.html(homePage(recent, stats, langs), 200, {
    "Cache-Control": "public, max-age=120, s-maxage=900",
  });
});
app.get("/about", (c) => c.html(aboutPage()));

app.get("/leaderboard", async (c) => {
  if (!c.env.DB) return c.html(notFoundPage(), 404);
  const raw = c.req.query("sort");
  const sort: Sort = raw === "worst" || raw === "popular" ? raw : "best";
  const language = c.req.query("lang") || undefined;

  const [rows, stats, langs] = await Promise.all([
    leaderboard(c.env.DB, { sort, language, limit: 100 }).catch(() => []),
    leaderboardStats(c.env.DB).catch(() => ({
      total: 0,
      median: 0,
      withAgentsMd: 0,
      withAnyAgentDoc: 0,
      withTestCommand: 0,
    })),
    languages(c.env.DB).catch(() => []),
  ]);
  return c.html(leaderboardPage({ rows, stats, sort, language, langs }), 200, {
    "Cache-Control": "public, max-age=120, s-maxage=900",
  });
});
app.get("/what-is-agents-md", (c) => c.html(agentsMdPage()));
app.get("/findings", (c) => c.html(findingsPage()));
app.get("/feedback", (c) => c.html(feedbackPage()));
app.get("/guides", (c) => c.html(guidesIndex()));
app.get("/guides/:slug", (c) => {
  const g = guideBySlug(c.req.param("slug"));
  return g ? c.html(guidePage(g)) : c.html(notFoundPage(), 404);
});
app.get("/privacy", (c) => c.html(privacyPage()));
app.get("/terms", (c) => c.html(termsPage()));

app.get("/favicon.svg", (c) =>
  c.body(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#0A0A0A"/><rect x="10" y="14" width="30" height="7" fill="#fff"/><rect x="10" y="28" width="44" height="7" fill="#fff"/><rect x="10" y="42" width="18" height="7" fill="#FF3D00"/></svg>`,
    200,
    SVG,
  ),
);

/**
 * robots.txt advertises this, so it has to exist. Without it the marked
 * repositories past the first hundred are orphans that nothing links to and
 * no crawler ever finds.
 */
/** The card for a repo, falling back to the finding card for anything unrendered. */
/** The drafted AGENTS.md as raw markdown, ready to save straight into a repo. */
app.get("/draft/:owner/:repo", async (c) => {
  const parsed = parseRepo(`${c.req.param("owner")}/${c.req.param("repo").replace(/\.md$/i, "")}`);
  if (!parsed) return c.text("Not a GitHub repository.\n", 400);

  return cached(c, 21600, async () => {
    const db = c.env.DB;
    const md = (report: Report) =>
      new Response(report.draft, {
        status: 200,
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Content-Disposition": `inline; filename="AGENTS.md"`,
        },
      });

    const stored = db ? await storedReport(db, parsed.owner, parsed.repo).catch(() => null) : null;
    if (stored?.report.draft && stored.ageMs < FRESH_MS) return md(stored.report);

    if (!(await mayGradeLive(c))) {
      if (stored?.report.draft) return md(stored.report);
      return new Response("Too many new repositories from this address. Try again in a minute.\n", { status: 429 });
    }
    try {
      const report = grade(await snapshot(parsed.owner, parsed.repo, c.env.GITHUB_TOKEN));
      if (db) c.executionCtx.waitUntil(saveReport(db, report).catch(() => {}));
      return md(report);
    } catch (e) {
      const err = e instanceof GitHubError ? e : null;
      if (stored?.report.draft) return md(stored.report);
      return new Response(`${err?.message ?? "Could not mark that repository."}\n`, { status: err?.status ?? 500 });
    }
  });
});

app.get("/og/:owner/:repo", async (c) => {
  if (!c.env.ASSETS) return c.notFound();
  const repo = c.req.param("repo").replace(/\.png$/, "");
  const parsed = parseRepo(`${c.req.param("owner")}/${repo}`);

  const url = new URL(c.req.url);
  const name = parsed
    ? `${parsed.owner}__${parsed.repo}`.toLowerCase().replace(/[^a-z0-9._-]/g, "-")
    : null;

  if (name) {
    const hit = await c.env.ASSETS.fetch(new URL(`/og/${name}.png`, url));
    if (hit.ok) {
      return new Response(hit.body, {
        status: 200,
        headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=86400, s-maxage=86400" },
      });
    }
  }

  const fallback = await c.env.ASSETS.fetch(new URL("/og/default.png", url));
  return new Response(fallback.body, {
    status: fallback.ok ? 200 : 404,
    headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=3600, s-maxage=3600" },
  });
});

app.get("/sitemap.xml", async (c) => {
  const base = "https://agentreadme.com";
  const statics = [
    "/", "/findings", "/leaderboard", "/about", "/what-is-agents-md", "/guides",
    ...GUIDES.map((g) => `/guides/${g.slug}`),
    "/feedback", "/privacy", "/terms",
  ];
  const langs = c.env.DB ? await languages(c.env.DB).catch(() => []) : [];
  const repos = c.env.DB ? await allSlugs(c.env.DB).catch(() => []) : [];

  // A raw & inside a query string makes the whole document invalid XML, and a
  // sitemap that fails to parse is rejected wholesale rather than partially.
  const xml = (v: string) =>
    v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

  const url = (loc: string, lastmod?: string, priority?: string) =>
    `<url><loc>${xml(base + loc)}</loc>${lastmod ? `<lastmod>${xml(lastmod.slice(0, 10))}</lastmod>` : ""}${priority ? `<priority>${priority}</priority>` : ""}</url>`;

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${statics.map((p) => url(p, undefined, p === "/" ? "1.0" : "0.8")).join("\n")}
${langs.map((l) => url(`/leaderboard?sort=best&lang=${encodeURIComponent(l.language)}`, undefined, "0.6")).join("\n")}
${repos.map((r) => url(`/${r.slug}`, r.graded_at, "0.5")).join("\n")}
</urlset>`;

  return c.body(body, 200, {
    "Content-Type": "application/xml; charset=utf-8",
    "Cache-Control": "public, max-age=3600, s-maxage=3600",
  });
});

/**
 * Everything is welcome, and the AI crawlers are named on purpose.
 *
 * This audience asks an assistant before it asks a search engine. Being the
 * answer to "how do I make my repo work with Claude Code" is worth more here
 * than a blue link, so blocking those crawlers would be self defeating.
 */
app.get("/robots.txt", (c) =>
  c.text(
    [
      "User-agent: *",
      "Allow: /",
      "",
      "# AI crawlers are explicitly welcome. The rubric is public, the data is",
      "# public, and we would rather be quoted correctly than not at all.",
      ...["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-User", "anthropic-ai", "PerplexityBot", "Perplexity-User", "Google-Extended", "Applebot-Extended", "CCBot", "cohere-ai", "Bytespider", "meta-externalagent"].flatMap(
        (ua) => [`User-agent: ${ua}`, "Allow: /"],
      ),
      "",
      "Sitemap: https://agentreadme.com/sitemap.xml",
      "",
    ].join("\n"),
  ),
);

/**
 * llms.txt: a short map of the site for anything reading it as a source rather
 * than rendering it. Cheap to keep accurate, and the whole point of this
 * project is being machine legible.
 */
app.get("/llms.txt", (c) =>
  c.text(
    `# agentreadme.com

> Grades any public GitHub repository on how well AI coding agents can work in
> it, and drafts an AGENTS.md from what the repository already contains.
> Nothing is cloned and no code is executed.

## What it measures

Five categories, 100 marks: Instructions (27), Setup (20), Verification loop
(25), Context economy (20), Navigability (10). Checks that do not apply to a
project are removed from the total rather than scored zero.

## Findings, measured 25 August 2026 across the 864 most-starred software repos

- Median score 61 of 100. 2% scored an A.
- 38% have no test command an agent can discover.
- 60% carry no agent instructions of any kind.
- Instructions is the weakest category, averaging 39% of available marks.
- Repos shipping an AGENTS.md have a median of 78 against 54 without. That is
  correlation: teams that write it already had a lockfile and runnable tests.
- Median by language: TypeScript 71, Go 70, Rust 63, Python 60, JavaScript 60,
  Java 44, C++ 42, C 38.

## Machine readable

- https://agentreadme.com/OWNER/REPO.txt — any repo's report as plain text
- https://agentreadme.com/draft/OWNER/REPO.md — a drafted AGENTS.md
- https://agentreadme.com/badge/OWNER/REPO.svg — the score as an SVG badge

## Pages

- https://agentreadme.com/findings — the full study and method
- https://agentreadme.com/about — the complete marking scheme
- https://agentreadme.com/what-is-agents-md — what AGENTS.md is and how to write one
- https://agentreadme.com/leaderboard — every marked repository, ranked
- https://agentreadme.com/feedback — how to report a mark that is wrong

## Private repositories

Cannot be graded by this site, by design. \`npx agentreadme\` runs the same rubric
locally and makes no network calls at all.

## Source

https://github.com/dejan23/agentreadme (MIT)
`,
    200,
    { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  ),
);

/** Search box target. Normalises whatever was pasted, then redirects to the canonical URL. */
app.get("/analyze", (c) => {
  const parsed = parseRepo(c.req.query("repo") ?? "");
  if (!parsed) return c.html(errorPage("That doesn't look like a GitHub repository.", 400, c.req.query("repo")), 400);
  return c.redirect(`/${parsed.owner}/${parsed.repo}`, 302);
});

app.get("/badge/:owner/:repo", async (c) => {
  const repoParam = c.req.param("repo").replace(/\.svg$/, "");
  const parsed = parseRepo(`${c.req.param("owner")}/${repoParam}`);
  if (!parsed) return c.body(errorBadge("invalid"), 200, SVG);

  const refreshBadge = wantsRefresh(c.req.url);
  return cached(c, refreshBadge ? 0 : 1800, async () => {
    const db = c.env.DB;
    // Badges are the highest-volume endpoint once READMEs adopt them, so they
    // lean hardest on the stored copy.
    const stored = db ? await storedReport(db, parsed.owner, parsed.repo).catch(() => null) : null;
    if (!refreshBadge && stored && stored.ageMs < FRESH_MS) {
      return new Response(gradeBadge(stored.report.score, stored.report.grade), { status: 200, headers: SVG });
    }
    if (!(await mayGradeLive(c))) return new Response(errorBadge("rate limited"), { status: 200, headers: SVG });
    try {
      const r = grade(await snapshot(parsed.owner, parsed.repo, c.env.GITHUB_TOKEN));
      if (db) c.executionCtx.waitUntil(saveReport(db, r).catch(() => {}));
      return new Response(gradeBadge(r.score, r.grade), { status: 200, headers: SVG });
    } catch {
      if (stored) return new Response(gradeBadge(stored.report.score, stored.report.grade), { status: 200, headers: SVG });
      return new Response(errorBadge(), { status: 200, headers: SVG });
    }
  });
});

app.get("/:owner/:repo", async (c) => {
  const raw = c.req.param("repo");
  // "owner/repo.txt" serves the plain text report, so an agent can read its own
  // scorecard with one curl. Hono will not split the suffix, so do it here.
  const wantsText = raw.endsWith(".txt");
  const parsed = parseRepo(`${c.req.param("owner")}/${wantsText ? raw.slice(0, -4) : raw}`);
  if (!parsed) return wantsText ? c.text("Not a GitHub repository.\n", 400) : c.html(notFoundPage(), 404);

  const render = (report: Report, rel: Row[] = []) =>
    wantsText
      ? new Response(reportText(report), {
          status: 200,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        })
      : new Response(reportPage(report, rel), { status: 200, headers: HTML });

  const refresh = wantsRefresh(c.req.url);
  if (refresh) {
    const clean = new URL(c.req.url);
    clean.search = "";
    await dropCached(clean.toString());
  }

  return cached(c, refresh ? 0 : 21600, async () => {
    const db = c.env.DB;

    const related = async (r: Report): Promise<Row[]> =>
      db && !wantsText ? await relatedRepos(db, r.owner, r.repo, r.language).catch(() => []) : [];

    // 1. A recent stored report costs no GitHub call at all.
    const stored = db ? await storedReport(db, parsed.owner, parsed.repo).catch(() => null) : null;
    if (!refresh && stored && stored.ageMs < FRESH_MS) {
      return render(stored.report, await related(stored.report));
    }

    // 2. Otherwise mark it live, if this caller has budget left.
    if (!(await mayGradeLive(c))) {
      if (stored) return render(stored.report, await related(stored.report));
      const msg = "Too many new repositories from this address. Try again in a minute.";
      if (wantsText) {
        return new Response(`${msg}\n`, { status: 429, headers: { "Content-Type": "text/plain; charset=utf-8" } });
      }
      return new Response(errorPage(msg, 429, `${parsed.owner}/${parsed.repo}`), { status: 429, headers: HTML });
    }

    try {
      const report = grade(await snapshot(parsed.owner, parsed.repo, c.env.GITHUB_TOKEN));
      if (db) {
        c.executionCtx.waitUntil(
          saveReport(db, report).catch(() => {
            /* a failed write must never break the page */
          }),
        );
      }
      return render(report, await related(report));
    } catch (e) {
      const err = e instanceof GitHubError ? e : null;

      // 3. If GitHub refused us, a stale report beats an error page.
      if (stored && err && (err.status === 429 || err.status >= 500)) {
        return render(stored.report, await related(stored.report));
      }

      const msg = err?.message ?? "Something went wrong marking that repository.";
      const status = err?.status === 404 ? 404 : err?.status === 429 ? 429 : 500;
      if (wantsText) {
        return new Response(`${msg}\n`, { status, headers: { "Content-Type": "text/plain; charset=utf-8" } });
      }
      return new Response(errorPage(msg, status, `${parsed.owner}/${parsed.repo}`), {
        status,
        headers: HTML,
      });
    }
  });
});

app.notFound((c) => c.html(notFoundPage(), 404));

export default app;
