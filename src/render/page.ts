import type { Category, Check, Report } from "../grade/types";
import { INDEX_MIN_STARS, type Row } from "../db";
import { disputeUrl } from "./feedback";
import { SITE, attr, barRow, esc, figure, layout } from "./layout";

/** Category letter from its percentage. Same curve as the overall grade. */
export function letterFor(pct: number): string {
  if (pct >= 93) return "A+";
  if (pct >= 85) return "A";
  if (pct >= 78) return "A-";
  if (pct >= 70) return "B+";
  if (pct >= 62) return "B";
  if (pct >= 55) return "B-";
  if (pct >= 48) return "C+";
  if (pct >= 40) return "C";
  if (pct >= 30) return "D";
  return "F";
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function markedOn(iso: string): string {
  const d = new Date(iso);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function headline(r: Report): string {
  if (r.score >= 85) return "Ready for an agent to work in without hand-holding.";
  if (r.score >= 70) return "Solid foundations, held back in a few specific places.";
  if (r.score >= 55) return "An agent can work here, but it will waste turns finding its footing.";
  if (r.score >= 40) return "An agent will struggle here, mostly for fixable reasons.";
  return "An agent is close to flying blind in this repository.";
}

export function searchForm(value = ""): string {
  return `<form class="search" action="/analyze" method="get">
  <input name="repo" value="${attr(value)}" placeholder="owner/repo, or paste a GitHub URL"
    aria-label="GitHub repository" spellcheck="false" autocapitalize="off" autocorrect="off" required>
  <button type="submit">Mark it</button>
</form>`;
}

function checkRow(c: Check): string {
  const mark = c.na
    ? `<span class="mark skip">–</span>`
    : c.score === c.max
      ? `<span class="mark pass">✓</span>`
      : `<span class="mark fail">✗</span>`;
  return `<div class="chk">
  <div class="row">${mark}<span class="lbl">${esc(c.label)}</span>
    <span class="sc">${c.na ? "n/a" : `${c.score}/${c.max}`}</span></div>
  <div class="verdict">${esc(c.verdict)}</div>
  ${c.fix ? `<div class="fix">${esc(c.fix)}</div>` : ""}
  ${c.evidence?.length ? `<div class="ev">${c.evidence.map((e) => `<div>${esc(e)}</div>`).join("")}</div>` : ""}
</div>`;
}

function categoryBlock(cat: Category, open: boolean): string {
  const pct = cat.max ? Math.round((cat.score / cat.max) * 100) : 0;
  const g = letterFor(pct);
  return `<details class="cat" id="${attr(cat.id)}"${open ? " open" : ""}>
  <summary>
    <span class="cname">${esc(cat.label)}</span>
    <span class="cpts">${cat.score}/${cat.max}</span>
    <span class="cgr${pct < 55 ? " bad" : ""}">${esc(g)}</span>
  </summary>
  <p class="cblurb">${esc(cat.blurb)}</p>
  <div class="checks">${cat.checks.map(checkRow).join("")}</div>
</details>`;
}

export function reportPage(r: Report, related: Row[] = []): string {
  const slug = `${r.owner}/${r.repo}`;
  const md = `[![agent ready](https://${SITE}/badge/${slug}.svg)](https://${SITE}/${slug})`;

  const facts = [r.language, `${r.stars.toLocaleString()} stars`, `${r.fileCount.toLocaleString()} files`, `branch ${r.defaultBranch}`]
    .filter(Boolean)
    .join(" · ");

  const bars = r.categories
    .map((c, i) => {
      const pct = c.max ? Math.round((c.score / c.max) * 100) : 0;
      // What the category measures, plus what this repo actually lost, so the
      // tooltip says something specific rather than repeating the label.
      const missed = c.checks.filter((x) => !x.na && x.score < x.max);
      // Accent marks only what is costing you, per DESIGN.md. Full marks is the
      // opposite of a warning, and colouring it also made it read as a link
      // inside a tooltip that cannot be clicked.
      const lost = missed.length
        ? ` <b>Losing marks on ${missed
            .slice(0, 2)
            .map((x) => x.label.toLowerCase())
            .join(" and ")}.</b>`
        : ` <em>Full marks.</em>`;
      return barRow(c.label, pct, `${c.score}/${c.max}`, pct < 55, i, {
        tip: `${esc(c.blurb)}${lost}`,
        href: `#${c.id}`,
      });
    })
    .join("");

  // The lowest-scoring category, so the pre-filled issue points at the argument.
  const weakest = [...r.categories]
    .filter((c) => c.max > 0)
    .sort((a, b) => a.score / a.max - b.score / b.max)[0];

  const notSoftware = !r.isSoftware
    ? `<p class="note" style="border-left:3px solid var(--acc);padding-left:14px;margin:0 0 24px;max-width:70ch">
      <b style="color:var(--ink)">Marked, but kept off the class list.</b> We found ${esc(r.shapeReason)}.
      The scheme assumes something an agent installs, changes, and tests, so most of these
      checks do not really apply and the mark below means little.</p>`
    : "";

  const body = `
<div class="hero">
  <div>
    <p class="kicker">Report · marked ${esc(markedOn(r.gradedAt))}</p>
    <h1>${esc(r.owner)}/<wbr>${esc(r.repo)}</h1>
    <p class="lede" style="margin:18px 0 20px">${esc(headline(r))}</p>
    <p class="note" style="font-family:var(--mono);margin:0 0 24px">${esc(facts)}</p>
    ${searchForm(slug)}
  </div>
  <div class="panel">
    <div style="display:flex;align-items:baseline;gap:12px;margin-bottom:20px">
      <span style="font-size:64px;font-weight:800;letter-spacing:-.045em;line-height:.9;
        color:${r.score < 55 ? "var(--acc)" : "var(--ink)"}">${figure(r.score)}</span>
      <span style="font-size:17px;color:var(--ink-3);font-family:var(--mono)">/100</span>
      <span style="margin-left:auto;font-size:34px;font-weight:800;letter-spacing:-.03em;
        color:${r.score < 55 ? "var(--acc)" : "var(--ink)"}">${esc(r.grade)}</span>
    </div>
    ${bars}
    <p class="foot">Higher is better. Accent marks what is costing you most.</p>
  </div>
</div>

${notSoftware}

${
  r.topFixes.length
    ? `<section class="band" style="padding-top:48px;padding-bottom:44px"><div>
  <p class="kicker">Fix these first</p>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:30px">
    ${r.topFixes
      .slice(0, 3)
      .map(
        (f, i) => `<div>
      <div style="font-family:var(--mono);font-size:13px;color:var(--acc);margin-bottom:8px">0${i + 1}</div>
      <div style="font-size:19px;font-weight:700;letter-spacing:-.015em;margin-bottom:7px">${esc(f.label)}</div>
      <div style="font-size:15px;color:#A3A3A3;line-height:1.5">${esc(f.fix ?? "")}</div>
    </div>`,
      )
      .join("")}
  </div>
</div></section>`
    : ""
}

<section>
  <h2>The full marking</h2>
  <p class="lede" style="margin:14px 0 26px">Every deduction below names the file or setting it came from.</p>
  ${r.categories.map((c, i) => categoryBlock(c, i === 0)).join("")}
</section>

<section>
  <h2>Here is your <i>AGENTS.md</i></h2>
  <p class="lede" style="margin:16px 0 20px">Drafted from what is actually in this repository: the install
    command from your lockfile, the commands you already declare, your real directory layout. Anything
    marked TODO needs a person. Save it at the root as <code>AGENTS.md</code>.</p>
  <div class="term">
    <div class="bar">
      <span class="dot"></span><span class="dot"></span><span class="dot"></span>
      <span class="name">AGENTS.md \u2014 drafted for ${esc(slug)}</span>
    </div>
    <div class="body"><pre>${esc(r.draft)}</pre></div>
  </div>
  <p style="margin-top:16px"><a href="/draft/${esc(slug)}.md">Open the raw markdown</a>
    <span class="note">&nbsp;or&nbsp;</span>
    <code>curl -o AGENTS.md ${SITE}/draft/${esc(slug)}.md</code></p>
</section>

<section class="two">
  <div>
    <h2>Show the <i>mark</i></h2>
    <p class="lede" style="margin:14px 0 18px">The badge re-checks daily, so it keeps up as the repository
      changes. Use <a href="/${esc(slug)}?refresh=1">mark again</a> to force it now.</p>
    <p><img src="/badge/${esc(slug)}.svg" alt="agent ready ${r.score} out of 100" width="150" height="20"></p>
  </div>
  <div><pre><code>${esc(md)}</code></pre></div>
</section>

${
  related.length
    ? `<section>
  <p class="kicker">Other ${esc(r.language ?? "")} repositories, marked</p>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:0 30px">
    ${related
      .map(
        (x) => `<a href="/${x.owner}/${x.repo}" style="display:flex;align-items:baseline;gap:10px;
      padding:11px 0;border-bottom:1px solid var(--rule);text-decoration:none">
      <span style="font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(x.owner)}/${esc(x.repo)}</span>
      <span style="margin-left:auto;font-family:var(--mono);font-size:13px;color:var(--ink-3)">${x.score}</span>
      <span style="font-weight:700;font-family:var(--mono);font-size:14px;${x.score < 55 ? "color:var(--acc-t)" : ""}">${esc(x.grade)}</span>
    </a>`,
      )
      .join("")}
  </div>
  <p style="margin-top:16px"><a href="/leaderboard?sort=best&lang=${encodeURIComponent(r.language ?? "")}">All ${esc(r.language ?? "")} repositories</a></p>
</section>`
    : ""
}

<section class="center" style="border-top:1px solid var(--rule)">
  <p class="kicker" style="margin-bottom:12px">Think this mark is wrong?</p>
  <p class="lede" style="margin-bottom:20px">Every deduction above names the file it came from, so this
    can be settled by looking. If a check missed something, that is a rule worth fixing.</p>
  <p><a href="${attr(disputeUrl(slug, r.score, r.grade, weakest?.label))}" rel="noopener">Open an issue,
    already filled in</a></p>
</section>

${r.truncatedTree ? `<p class="note">This repository is large enough that GitHub truncated the file listing, so the file-level checks ran on a sample.</p>` : ""}
`;

  return layout({
    title: `${slug} scores ${r.score}/100 for AI agents · ${SITE}`,
    description: `${slug} scores ${r.score}/100 (${r.grade}) for AI coding agents. ${headline(r)} See the full breakdown and what to fix first.`,
    canonical: `/${slug}`,
    body,
    ogImage: `/og/${slug}.png`,
    // Not indexed when it is not software, or when the repository is obscure
    // enough that its owner did not ask for a public page in search results.
    // The page still works for anyone holding the link.
    noindex: !r.isSoftware || r.stars < INDEX_MIN_STARS,
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Class list", item: `https://${SITE}/leaderboard` },
            { "@type": "ListItem", position: 2, name: slug, item: `https://${SITE}/${slug}` },
          ],
        },
        {
          "@type": "SoftwareSourceCode",
          name: slug,
          codeRepository: `https://github.com/${slug}`,
          ...(r.language ? { programmingLanguage: r.language } : {}),
          ...(r.description ? { description: r.description } : {}),
        },
      ],
    },
  });
}

export function errorPage(message: string, status: number, tried?: string): string {
  // A 404 here usually means the repository is private, because GitHub returns
  // the same status for both rather than confirm a private repo exists. That
  // person is the most motivated visitor this site gets, so the page offers the
  // way forward instead of turning them away.
  const maybePrivate = status === 404;

  return layout({
    title: `Couldn't mark that repository · ${SITE}`,
    description: message,
    noindex: true,
    body: `<section style="padding-top:60px">
  <p class="kicker">Not marked</p>
  <h1>${esc(message)}</h1>
  <p class="lede" style="margin:20px 0 24px">${
    maybePrivate
      ? "This site can only read public code, so a private repository looks exactly like one that does not exist."
      : "Only public repositories can be marked."
  }</p>
  ${searchForm(tried ?? "")}
  <p class="note">Try <a href="/openai/codex">openai/codex</a> or <a href="/honojs/hono">honojs/hono</a>.</p>
</section>

${
  maybePrivate
    ? `<section class="two" style="border-top:1px solid var(--rule)">
  <div>
    <h2>Private? Run it <i>locally</i>.</h2>
    <p class="lede" style="margin:16px 0 18px">The same rubric, on your machine. Nothing is uploaded,
      no account, no token, and no network call at all.</p>
    <p style="color:var(--ink-2);font-size:16.5px">It grades what git tracks, so the result matches
      what this site would have given you. <code>--write-agents</code> drafts the AGENTS.md too.</p>
    <p style="margin-top:16px"><a href="https://www.npmjs.com/package/agentreadme">The package on npm</a>
      · <a href="/#private">how it works</a></p>
  </div>
  <div>
    <div class="term">
      <div class="bar">
        <span class="dot"></span><span class="dot"></span><span class="dot"></span>
        <span class="name">bash — ~/${esc((tried ?? "your-repo").split("/").pop() ?? "your-repo")}</span>
      </div>
      <div class="body"><pre><span class="prompt">$</span> <span class="cmd">npx agentreadme</span>

<span class="dim">the same five categories, in your terminal</span>

<span class="prompt">$</span> <span class="cursor"></span></pre></div>
    </div>
  </div>
</section>`
    : ""
}`,
  });
}
