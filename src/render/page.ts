import type { Category, Check, Report } from "../grade/types";
import { SITE, attr, esc, layout } from "./layout";

/** Category letter, from its percentage. Same curve as the overall grade. */
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
    aria-label="GitHub repository" spellcheck="false" autocapitalize="off"
    autocorrect="off" required>
  <button type="submit">Mark it</button>
</form>`;
}

function leaderRow(cat: Category): string {
  const pct = cat.max ? Math.round((cat.score / cat.max) * 100) : 0;
  return `<div class="leader">
  <span class="lbl"><a href="#${attr(cat.id)}" style="text-decoration:none">${esc(cat.label)}</a></span>
  <span class="dots"></span>
  <span class="val">${cat.score}/${cat.max}</span>
  <span class="gr">${esc(letterFor(pct))}</span>
</div>`;
}

function checkRow(c: Check): string {
  const mark = c.na
    ? `<span class="mark skip">–</span>`
    : c.score === c.max
      ? `<span class="mark pass">✓</span>`
      : c.score === 0
        ? `<span class="mark fail">✗</span>`
        : `<span class="mark part">~</span>`;
  return `<div class="chk">
  <div class="row">${mark}<span class="lbl2">${esc(c.label)}</span>
    <span class="sc">${c.na ? "n/a" : `${c.score}/${c.max}`}</span></div>
  <div class="verdict">${esc(c.verdict)}</div>
  ${c.fix ? `<div class="fix">${esc(c.fix)}</div>` : ""}
  ${c.evidence?.length ? `<div class="ev">${c.evidence.map((e) => `<div>${esc(e)}</div>`).join("")}</div>` : ""}
</div>`;
}

function categoryBlock(cat: Category, open: boolean): string {
  const pct = cat.max ? Math.round((cat.score / cat.max) * 100) : 0;
  return `<details class="cat" id="${attr(cat.id)}"${open ? " open" : ""}>
  <summary>
    <span class="cname">${esc(cat.label)}</span>
    <span class="cpts" style="margin-left:auto">${cat.score}/${cat.max}</span>
    <span class="cgr">${esc(letterFor(pct))}</span>
  </summary>
  <p class="cblurb">${esc(cat.blurb)}</p>
  <div class="checks">${cat.checks.map(checkRow).join("")}</div>
</details>`;
}

export function reportPage(r: Report): string {
  const slug = `${r.owner}/${r.repo}`;
  const md = `[![agent ready](https://${SITE}/badge/${slug}.svg)](https://${SITE}/${slug})`;

  const meta = [
    r.language,
    `${r.stars.toLocaleString()} stars`,
    `${r.fileCount.toLocaleString()} files`,
  ]
    .filter(Boolean)
    .join(" · ");

  const notSoftware = !r.isSoftware
    ? `<p class="note" style="border-left:2px solid var(--red);padding-left:14px;margin-bottom:20px">
      <b>Marked, but off the class list.</b> We found ${esc(r.shapeReason)}. The scheme assumes
      something an agent installs, changes, and tests, so most of these checks do not really
      apply and the mark below means little.</p>`
    : "";

  const body = `
${searchForm(slug)}
<p class="note" style="margin-bottom:26px">Marked from the default branch, <code>${esc(r.defaultBranch)}</code>.</p>
${notSoftware}

<article class="sheet">
  <div class="sheet-head">
    <div style="flex:1;min-width:220px">
      <div class="sheet-title">Report Card</div>
      <h1 class="subject"><span class="o">${esc(r.owner)}/</span>${esc(r.repo)}</h1>
      <p class="subject-note">${esc(headline(r))}</p>
    </div>
    <div class="sheet-meta">${esc(meta)}<br>Marked ${esc(markedOn(r.gradedAt))}</div>
  </div>

  ${r.categories.map(leaderRow).join("")}

  <div class="overall">
    <span class="word">Overall mark</span>
    <div class="circle"><div class="g">${esc(r.grade)}</div><div class="n">${r.score}/100</div></div>
  </div>

  ${
    r.topFixes.length
      ? `<div class="remarks">
    <h3>Remarks</h3>
    <ol>${r.topFixes
      .map(
        (f) =>
          `<li><b>${esc(f.label)}</b>${f.severity ? `<span class="sev sev-${f.severity}">${f.severity}</span>` : ""}<br>${esc(f.fix ?? "")}</li>`,
      )
      .join("")}</ol>
  </div>`
      : `<div class="remarks"><h3>Remarks</h3>
    <p style="color:var(--ink-2);font-style:italic">Every check that applies here is passing or close to it. Little to add.</p></div>`
  }
</article>

<h2 style="font-size:23px;margin:34px 0 6px">Full marks breakdown</h2>
<p class="note" style="margin-bottom:18px">Every deduction below names the file or setting it came from.</p>
${r.categories.map((c, i) => categoryBlock(c, i === 0)).join("")}

<section class="sheet" style="margin-top:34px">
  <div class="sheet-title" style="margin-bottom:12px">Show the mark</div>
  <p style="margin-bottom:14px;color:var(--ink-2)">The badge re-marks on every request, so it stays
  honest as the repository changes.</p>
  <p><img src="/badge/${esc(slug)}.svg" alt="agent ready ${r.score} out of 100" width="150" height="20"></p>
  <pre><code>${esc(md)}</code></pre>
</section>

${r.truncatedTree ? `<p class="note" style="margin-top:20px">This repository is large enough that GitHub truncated the file listing, so the file-level checks were run on a sample.</p>` : ""}
`;

  return layout({
    title: `${slug} scores ${r.score}/100 for AI agents · ${SITE}`,
    description: `${slug} was marked ${r.score}/100 (${r.grade}) on agent readiness. ${headline(r)} Full breakdown across instructions, setup, verification, context economy, and navigability.`,
    canonical: `/${slug}`,
    body,
    noindex: !r.isSoftware,
  });
}

export function errorPage(message: string, status: number, tried?: string): string {
  return layout({
    title: `Couldn't mark that repository · ${SITE}`,
    description: message,
    noindex: true,
    body: `${searchForm(tried ?? "")}
<article class="sheet" style="margin-top:22px">
  <div class="sheet-title">Not marked</div>
  <h1 class="subject" style="font-size:25px">${esc(message)}</h1>
  <p class="subject-note">Only public repositories can be marked.</p>
</article>
<p class="note">Try <a href="/openai/codex">openai/codex</a> or <a href="/honojs/hono">honojs/hono</a>.</p>`,
  });
}
