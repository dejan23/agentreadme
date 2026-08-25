import { Hono } from "hono";
import { GitHubError, snapshot } from "./github";
import { grade } from "./grade";
import { errorBadge, gradeBadge } from "./render/badge";
import { errorPage, reportPage } from "./render/page";
import { aboutPage, agentsMdPage, homePage, notFoundPage } from "./render/static-pages";
import { leaderboardPage } from "./render/leaderboard";
import { type Sort, languages, leaderboard, leaderboardStats, saveReport } from "./db";

export interface Env {
  GITHUB_TOKEN?: string;
  DB?: D1Database;
}

const app = new Hono<{ Bindings: Env }>();

/** Paths that are pages of ours, not GitHub owners. */
const RESERVED = new Set([
  "about", "leaderboard", "analyze", "badge", "og", "favicon.svg", "robots.txt",
  "sitemap.xml", "what-is-agents-md", "api", "static", "_", "assets",
]);

const NAME = /^[A-Za-z0-9_.-]{1,100}$/;

/** Accepts "owner/repo", a full GitHub URL, or a git remote. */
export function parseRepo(input: string): { owner: string; repo: string } | null {
  let s = input.trim();
  if (!s) return null;
  s = s.replace(/^git@github\.com:/, "").replace(/^https?:\/\/(www\.)?github\.com\//i, "");
  s = s.replace(/\.git$/, "").replace(/^\/+|\/+$/g, "");
  const [owner, repo] = s.split("/");
  if (!owner || !repo) return null;
  if (!NAME.test(owner) || !NAME.test(repo)) return null;
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
  const hit = await cache.match(key);
  if (hit) return hit;

  const res = await build();
  if (res.status === 200) {
    const copy = res.clone();
    copy.headers.set("Cache-Control", `public, max-age=${ttl}, s-maxage=${ttl}`);
    const store = new Response(copy.body, { status: 200, headers: copy.headers });
    await cache.put(key, store.clone());
    return store;
  }
  return res;
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
  if (c.env.DB) {
    [recent, stats] = await Promise.all([
      leaderboard(c.env.DB, { sort: "popular", limit: 7 }).catch(() => undefined),
      leaderboardStats(c.env.DB).catch(() => undefined),
    ]);
  }
  return c.html(homePage(recent, stats), 200, { "Cache-Control": "public, max-age=300" });
});
app.get("/about", (c) => c.html(aboutPage()));

app.get("/leaderboard", async (c) => {
  if (!c.env.DB) return c.html(notFoundPage(), 404);
  const raw = c.req.query("sort");
  const sort: Sort = raw === "worst" || raw === "popular" ? raw : "best";
  const language = c.req.query("lang") || undefined;

  const [rows, stats, langs] = await Promise.all([
    leaderboard(c.env.DB, { sort, language, limit: 100 }),
    leaderboardStats(c.env.DB),
    languages(c.env.DB),
  ]);
  return c.html(leaderboardPage({ rows, stats, sort, language, langs }), 200, {
    "Cache-Control": "public, max-age=900, s-maxage=900",
  });
});
app.get("/what-is-agents-md", (c) => c.html(agentsMdPage()));

app.get("/favicon.svg", (c) =>
  c.body(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#f8f4ea"/><rect x="4.5" y="4.5" width="55" height="55" fill="none" stroke="#221e18" stroke-width="3"/><text x="32" y="45" font-family="Georgia,serif" font-size="34" font-weight="600" fill="#ab2a1e" text-anchor="middle">A</text></svg>`,
    200,
    SVG,
  ),
);

app.get("/robots.txt", (c) =>
  c.text(`User-agent: *\nAllow: /\nSitemap: https://agentreadme.com/sitemap.xml\n`),
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

  return cached(c, 1800, async () => {
    try {
      const r = grade(await snapshot(parsed.owner, parsed.repo, c.env.GITHUB_TOKEN));
      return new Response(gradeBadge(r.score, r.grade), { status: 200, headers: SVG });
    } catch {
      return new Response(errorBadge(), { status: 200, headers: SVG });
    }
  });
});

app.get("/:owner/:repo", async (c) => {
  const parsed = parseRepo(`${c.req.param("owner")}/${c.req.param("repo")}`);
  if (!parsed) return c.html(notFoundPage(), 404);

  return cached(c, 21600, async () => {
    try {
      const report = grade(await snapshot(parsed.owner, parsed.repo, c.env.GITHUB_TOKEN));
      // The leaderboard grows from real traffic, not just the seed crawl.
      if (c.env.DB) {
        c.executionCtx.waitUntil(
          saveReport(c.env.DB, report).catch(() => {
            /* a failed write must never break the page */
          }),
        );
      }
      return new Response(reportPage(report), { status: 200, headers: HTML });
    } catch (e) {
      const err = e instanceof GitHubError ? e : null;
      const msg = err?.message ?? "Something went wrong grading that repository.";
      const status = err?.status === 404 ? 404 : err?.status === 429 ? 429 : 500;
      return new Response(errorPage(msg, status, `${parsed.owner}/${parsed.repo}`), {
        status,
        headers: HTML,
      });
    }
  });
});

app.notFound((c) => c.html(notFoundPage(), 404));

export default app;
