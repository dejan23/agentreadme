import type { Category, Check, Report } from "../grade/types";
import { colorFor } from "./badge";
import { SITE, attr, esc, layout } from "./layout";

function dial(score: number, grade: string): string {
  const R = 52;
  const C = 2 * Math.PI * R;
  const filled = (Math.max(0, Math.min(100, score)) / 100) * C;
  const color = colorFor(score);
  return `<div class="dial">
  <svg width="118" height="118" viewBox="0 0 118 118" aria-hidden="true">
    <circle cx="59" cy="59" r="${R}" fill="none" stroke="#232830" stroke-width="9"/>
    <circle cx="59" cy="59" r="${R}" fill="none" stroke="${color}" stroke-width="9"
      stroke-linecap="round" stroke-dasharray="${filled.toFixed(1)} ${C.toFixed(1)}"/>
  </svg>
  <div class="num"><div class="n">${score}</div><div class="g">${esc(grade)}</div></div>
</div>`;
}

function checkRow(c: Check): string {
  const mark = c.na ? `<span class="mark skip">–</span>` :
    c.score === c.max ? `<span class="mark pass">✓</span>` :
    c.score === 0 ? `<span class="mark fail">✗</span>` :
    `<span class="mark part">~</span>`;
  const pts = c.na ? "n/a" : `${c.score}/${c.max}`;
  return `<div class="chk" id="${attr(c.id)}">
  <div class="row">${mark}<span class="lbl">${esc(c.label)}</span><span class="sc">${pts}</span></div>
  <div class="verdict">${esc(c.verdict)}</div>
  ${c.fix ? `<div class="fix">${esc(c.fix)}</div>` : ""}
  ${c.evidence?.length ? `<div class="ev">${c.evidence.map((e) => `<div>${esc(e)}</div>`).join("")}</div>` : ""}
</div>`;
}

function categoryBlock(cat: Category, open: boolean): string {
  const pct = cat.max ? Math.round((cat.score / cat.max) * 100) : 0;
  return `<details class="cat"${open ? " open" : ""}>
  <summary>
    <span class="name">${esc(cat.label)}</span>
    <span class="pts">${cat.score}/${cat.max}</span>
    <span class="bar"><i style="width:${pct}%;background:${colorFor(pct)}"></i></span>
    <span class="blurb">${esc(cat.blurb)}</span>
  </summary>
  <div class="checks">${cat.checks.map(checkRow).join("")}</div>
</details>`;
}

function headline(r: Report): string {
  if (r.score >= 85) return "This repo is ready for agents to work in.";
  if (r.score >= 70) return "Solid foundations, with a few gaps worth closing.";
  if (r.score >= 55) return "An agent can work here, but it will waste turns figuring things out.";
  if (r.score >= 40) return "An agent will struggle here, mostly for fixable reasons.";
  return "An agent is close to flying blind in this repo.";
}

export function searchForm(value = ""): string {
  return `<form class="search" action="/analyze" method="get">
  <input name="repo" value="${attr(value)}" placeholder="owner/repo or a GitHub URL"
    aria-label="GitHub repository" spellcheck="false" autocapitalize="off" required>
  <button type="submit">Grade it</button>
</form>`;
}

export function reportPage(r: Report): string {
  const slug = `${r.owner}/${r.repo}`;
  const md = `[![agent ready](https://${SITE}/badge/${slug}.svg)](https://${SITE}/${slug})`;

  const facts = [
    r.language,
    `${r.stars.toLocaleString()} stars`,
    `${r.fileCount.toLocaleString()} files`,
    r.sizeKb >= 1000 ? `${(r.sizeKb / 1000).toFixed(1)} MB` : `${r.sizeKb} KB`,
  ].filter(Boolean) as string[];

  const notSoftware = !r.isSoftware
    ? `<div style="background:#1d2530;border:1px solid #2b3a4d;border-left:3px solid var(--accent);
      border-radius:0 8px 8px 0;padding:14px 18px;margin:0 0 16px;color:var(--ink-2);font-size:14.5px">
      <b style="color:var(--ink)">This doesn't look like a software project.</b>
      We found ${esc(r.shapeReason)}. The rubric assumes something an agent installs, changes, and tests,
      so most of these checks don't really apply here and the score below is not very meaningful.
      Repositories like this are kept off the <a href="/leaderboard">leaderboard</a>.</div>`
    : "";

  const body = `
${searchForm(slug)}
${notSoftware}
<p class="note">Graded from the default branch, <code>${esc(r.defaultBranch)}</code>.</p>

<section class="head">
  ${dial(r.score, r.grade)}
  <div style="flex:1;min-width:260px">
    <h1><span class="owner">${esc(r.owner)}/</span>${esc(r.repo)}</h1>
    <p class="desc">${esc(headline(r))}</p>
    <div class="facts">${facts.map((f) => `<span>${esc(f)}</span>`).join("")}</div>
  </div>
</section>

${
  r.topFixes.length
    ? `<section class="fixes">
  <h2>Fix these first</h2>
  <ol>${r.topFixes
    .map(
      (f) =>
        `<li><b>${esc(f.label)}</b>${f.severity ? `<span class="sev sev-${f.severity}">${f.severity}</span>` : ""}<br>${esc(f.fix ?? "")}</li>`,
    )
    .join("")}</ol>
</section>`
    : `<section class="fixes"><h2>Nothing urgent</h2><p style="color:var(--ink-2)">Every check that applies to this repo is passing or close to it.</p></section>`
}

<h2 style="margin:0 0 14px;font-size:19px">The full scorecard</h2>
${r.categories.map((c, i) => categoryBlock(c, i === 0)).join("")}

<section class="badge-box">
  <h2>Put the badge in your README</h2>
  <p>It re-grades on every request, so the score stays honest as the repo changes.</p>
  <img src="/badge/${esc(slug)}.svg" alt="agent ready ${r.score}/100" width="140" height="20">
  <pre><code>${esc(md)}</code></pre>
</section>

${r.truncatedTree ? `<p class="note">This repo is large enough that GitHub truncated the file listing, so file-level checks were run on a sample.</p>` : ""}
`;

  return layout({
    title: `${slug} scores ${r.score}/100 for AI agents · ${SITE}`,
    description: `${slug} scores ${r.score}/100 (${r.grade}) on agent readiness. ${headline(r)} See the full breakdown across instructions, setup, verification, context, and navigability.`,
    canonical: `/${slug}`,
    body,
    noindex: !r.isSoftware,
  });
}

export function errorPage(message: string, status: number, tried?: string): string {
  return layout({
    title: `Couldn't grade that repo · ${SITE}`,
    description: message,
    body: `${searchForm(tried ?? "")}
<section class="head"><div style="flex:1">
  <h1 style="font-size:21px">Couldn't grade that one</h1>
  <p class="desc">${esc(message)}</p>
</div></section>
<p class="note">Only public repositories can be graded. Try <a href="/openai/codex">openai/codex</a> or <a href="/honojs/hono">honojs/hono</a>.</p>`,
  });
}
