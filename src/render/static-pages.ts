import type { Row, Stats } from "../db";
import { SITE, esc, layout } from "./layout";
import { letterFor, searchForm } from "./page";

/** Real measured scores, shown when the database has nothing yet. */
const FALLBACK: Array<[string, number, string]> = [
  ["openai/codex", 82, "A-"],
  ["cloudflare/workers-sdk", 77, "B+"],
  ["tinygrad/tinygrad", 74, "B+"],
  ["honojs/hono", 72, "B+"],
  ["fastapi/fastapi", 63, "B"],
  ["expressjs/express", 60, "B-"],
];

/** A real marked repository, used as the specimen on the front page. */
const SPECIMEN = {
  slug: "honojs/hono",
  owner: "honojs",
  repo: "hono",
  meta: "TypeScript · 31,957 stars · 486 files",
  note: "Solid foundations, held back in a few specific places.",
  score: 72,
  grade: "B+",
  rows: [
    ["Instructions", "3/27", 11],
    ["Setup", "14/20", 70],
    ["Verification loop", "24/25", 96],
    ["Context economy", "18/20", 90],
    ["Navigability", "10/10", 100],
  ] as Array<[string, string, number]>,
  remark:
    "No AGENTS.md, so every agent that opens this repository starts from nothing. The testing and tooling underneath it are excellent.",
};

function leader(label: string, val: string, grade: string, href?: string): string {
  const name = href ? `<a href="${href}" style="text-decoration:none">${esc(label)}</a>` : esc(label);
  return `<div class="leader"><span class="lbl">${name}</span><span class="dots"></span>
  <span class="val">${esc(val)}</span><span class="gr">${esc(grade)}</span></div>`;
}

export function homePage(recent?: Row[], stats?: Stats): string {
  const rows =
    recent && recent.length >= 4
      ? recent.slice(0, 7).map((r) => [`${r.owner}/${r.repo}`, r.score, r.grade] as [string, number, string])
      : FALLBACK;

  const total = stats?.total ?? 876;
  const median = stats?.median ?? 61;
  const noTest = stats && stats.total ? Math.round(((stats.total - stats.withTestCommand) / stats.total) * 100) : 39;
  const withMd = stats && stats.total ? Math.round((stats.withAgentsMd / stats.total) * 100) : 32;

  const body = `
<section>
  <h1 class="display">Can an AI agent <em>actually</em> work in your repo?</h1>
  <p class="lede">
    When Claude Code or Cursor flails in a codebase, everyone blames the model.
    Usually it is the repository.
  </p>
  ${searchForm()}
  <p class="note" style="font-size:17px;color:var(--ink-2)">
    Try it on the repo you have open right now. No account, nothing installed,
    no code executed.</p>
</section>

<article class="sheet" style="margin-top:34px">
  <div class="sheet-head">
    <div style="flex:1;min-width:200px">
      <div class="sheet-title">Specimen</div>
      <h2 class="subject" style="font-size:29px">
        <a href="/${SPECIMEN.slug}" style="text-decoration:none"><span class="o">${esc(SPECIMEN.owner)}/</span>${esc(SPECIMEN.repo)}</a>
      </h2>
      <p class="subject-note">${esc(SPECIMEN.note)}</p>
    </div>
    <div class="sheet-meta">${esc(SPECIMEN.meta)}</div>
  </div>
  ${SPECIMEN.rows.map(([l, v, p]) => leader(l, v, letterFor(p))).join("")}
  <div class="overall">
    <span class="word">Overall mark</span>
    <div class="circle"><div class="g">${SPECIMEN.grade}</div><div class="n">${SPECIMEN.score}/100</div></div>
  </div>
  <div class="remarks">
    <h3>Remarks</h3>
    <p style="color:var(--ink-2);margin:0">${esc(SPECIMEN.remark)}</p>
  </div>
</article>

<section class="band"><div>
  <h2>We marked the ${total.toLocaleString()} most-starred software repositories on GitHub</h2>
  <div class="nums">
    <div><div class="n">${median}</div><div class="l">median mark, out of a hundred</div></div>
    <div><div class="n"><em>${noTest}%</em></div><div class="l">have no test command an agent can find</div></div>
    <div><div class="n">${withMd}%</div><div class="l">ship an AGENTS.md</div></div>
  </div>
  <p style="margin:26px 0 0;font-size:16px"><a href="/leaderboard">See the whole class list</a></p>
</div></section>

<section style="display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,1fr);gap:40px;margin:0 0 30px">
  <div>
    <h2 class="kicker">The marking scheme</h2>
    ${[
      ["Instructions", "27", "An AGENTS.md that names the real commands"],
      ["Setup", "20", "A lockfile, declared commands, a documented environment"],
      ["Verification loop", "25", "Tests an agent can find and run to check itself"],
      ["Context economy", "20", "No 400KB files, no committed build output"],
      ["Navigability", "10", "Documentation, a description, a licence"],
    ]
      .map(
        ([l, m, d]) => `<div style="margin-bottom:15px">
      <div class="leader" style="margin-bottom:2px"><span class="lbl">${esc(l)}</span>
        <span class="dots"></span><span class="val">${esc(m)} marks</span></div>
      <div style="color:var(--ink-3);font-size:15.5px;font-style:italic">${esc(d)}</div>
    </div>`,
      )
      .join("")}
  </div>

  <div>
    <h2 class="kicker">Recently marked</h2>
    ${rows.map(([slug, score, grade]) => leader(slug, String(score), grade, `/${slug}`)).join("")}
    <p style="margin-top:16px"><a href="/leaderboard">The whole class list</a></p>
  </div>
</section>

<p style="color:var(--ink-2);max-width:60ch;font-style:italic;margin-bottom:44px">
  Every deduction cites the file it came from, the
  <a href="/about">marking scheme is published in full</a>, and the whole thing is open
  source. If a mark is wrong, the fix is a pull request.
</p>`;

  return layout({
    title: `${SITE} · Is your repository ready for AI coding agents?`,
    description:
      "Mark any public GitHub repository on how well AI coding agents can work in it. Checks agent instructions, setup, the verification loop, context economy, and navigability, then says what to fix first.",
    canonical: "/",
    body,
    extraCss: `@media (max-width:720px){ main section[style*="1.05fr"]{grid-template-columns:1fr!important;gap:26px!important} }`,
  });
}

export function aboutPage(): string {
  const body = `
<h1 style="font-size:38px;margin:0 0 12px;letter-spacing:-.02em">The marking scheme</h1>
<p style="font-size:19px;color:var(--ink-2);max-width:58ch">
  Every mark traces back to something in the repository. No model judges your code and
  there is no discretion in the number. The whole scheme is checks against files, and
  you can read the source.
</p>

<h2 style="font-size:24px;margin:34px 0 10px">What is marked</h2>
<div style="color:var(--ink-2);max-width:62ch">
  <p><b style="color:var(--ink)">Instructions, 27 marks.</b> Whether an AGENTS.md, CLAUDE.md,
  or equivalent exists, and whether it does anything useful. A file that never names a build
  or test command scores badly however long it is.</p>
  <p><b style="color:var(--ink)">Setup, 20 marks.</b> A lockfile, discoverable commands, a
  documented environment, a pinned runtime. The question is whether an agent gets the project
  running with nobody watching.</p>
  <p><b style="color:var(--ink)">Verification loop, 25 marks.</b> The heaviest section. Tests
  that exist, a test command an agent can actually find, CI, linting, type checking. An agent
  that cannot check its own work is guessing, and this is what separates useful output from
  confident nonsense.</p>
  <p><b style="color:var(--ink)">Context economy, 20 marks.</b> Committed build output,
  oversized source files, repository weight. One 400KB file forces an agent to work from
  fragments and edit code it never read.</p>
  <p><b style="color:var(--ink)">Navigability, 10 marks.</b> Documentation, a description,
  a licence.</p>
</div>

<h2 style="font-size:24px;margin:34px 0 10px">Checks that do not apply are not counted</h2>
<p style="color:var(--ink-2);max-width:62ch">A library has no environment to configure and no
reason to ship a Dockerfile. Those checks are marked not applicable and removed from the total
rather than scored as zero, so nothing is punished for being what it is.</p>

<h2 style="font-size:24px;margin:34px 0 10px">Link collections are marked separately</h2>
<p style="color:var(--ink-2);max-width:62ch">Many of the most-starred repositories on GitHub are
curated lists, books, and tutorials. Asking whether an agent can install and test a list of links
is meaningless, so those are marked but kept off the class list and out of every published
statistic.</p>

<h2 style="font-size:24px;margin:34px 0 10px">What never happens</h2>
<p style="color:var(--ink-2);max-width:62ch">No code is executed and no repository is cloned.
Marking is two GitHub API calls plus a few small configuration files read from a CDN. Private
repositories cannot be marked at all.</p>

<h2 style="font-size:24px;margin:34px 0 10px">If a mark is wrong</h2>
<p style="color:var(--ink-2);max-width:62ch">Some of them will be. The scheme is opinionated and
the detection misses things, particularly outside JavaScript and Python. It is open source, so
the useful response is a pull request adding the case we got wrong.</p>`;

  return layout({
    title: `The marking scheme · ${SITE}`,
    description:
      "The full rubric behind the mark: instructions, setup, the verification loop, context economy, and navigability, with every check traced to a file in the repository.",
    canonical: "/about",
    body,
  });
}

export function agentsMdPage(): string {
  const body = `
<h1 style="font-size:38px;margin:0 0 12px;letter-spacing:-.02em">What is AGENTS.md?</h1>
<p style="font-size:19px;color:var(--ink-2);max-width:58ch">
  A plain markdown file at the root of a repository that tells an AI coding agent how to work
  in it. The README is written for a person deciding whether to use your project. AGENTS.md is
  written for whoever has to change it.
</p>

<h2 style="font-size:24px;margin:34px 0 10px">Why a separate file</h2>
<p style="color:var(--ink-2);max-width:62ch">READMEs are marketing as much as instruction. They
open with badges and a pitch and bury the build command in the middle. An agent needs the
opposite: commands first, conventions second, none of the persuasion.</p>

<h2 style="font-size:24px;margin:34px 0 10px">What belongs in it</h2>
<p style="color:var(--ink-2);max-width:62ch">The test that matters is whether a capable stranger
could make a small change and verify it using only this file.</p>
<pre style="max-width:62ch"><code># AGENTS.md

## Setup
pnpm install

## Commands
pnpm dev          # local server on :3000
pnpm test         # full suite, must pass before any commit
pnpm typecheck    # tsc --noEmit

## Conventions
- Server code in src/server, client in src/app. Never import across that line.
- Database changes go through a migration in db/migrations.
- Tests sit next to the file they cover, as *.test.ts.

## Gotchas
- The dev server needs Postgres. Run docker compose up -d db first.
- Anything under src/generated is built from the schema. Edit the schema.</code></pre>

<h2 style="font-size:24px;margin:34px 0 10px">What makes one bad</h2>
<div style="color:var(--ink-2);max-width:62ch">
  <p><b style="color:var(--ink)">Too short.</b> Three lines saying "this is a TypeScript project,
  write clean code" changes nothing about what an agent does.</p>
  <p><b style="color:var(--ink)">Too long.</b> Twenty thousand characters of philosophy loads on
  every turn and crowds out the code the agent needs to read.</p>
  <p><b style="color:var(--ink)">No commands.</b> The most common failure by a wide margin. If the
  file never says how to run the tests, the agent guesses, guesses wrong, and reports success.</p>
</div>

<h2 style="font-size:24px;margin:34px 0 10px">Which filename</h2>
<p style="color:var(--ink-2);max-width:62ch">AGENTS.md is the vendor-neutral one and the most
widely read. CLAUDE.md, .cursorrules, and .github/copilot-instructions.md are tool-specific.
Keeping one of those alongside is fine, but AGENTS.md is the one that works everywhere, and the
marking reflects that.</p>

<p style="margin-top:32px"><a href="/">Mark a repository</a> and see how its instructions score.</p>`;

  return layout({
    title: `What is AGENTS.md, and how do you write a good one? · ${SITE}`,
    description:
      "AGENTS.md tells an AI coding agent how to work in your repository. What belongs in it, what makes one useless, and how it differs from a README.",
    canonical: "/what-is-agents-md",
    body,
  });
}

export function notFoundPage(): string {
  return layout({
    title: `Not found · ${SITE}`,
    description: "That page does not exist.",
    noindex: true,
    body: `<h1 style="font-size:32px">Nothing here</h1>
<p style="color:var(--ink-2)">Mark a repository instead.</p>${searchForm()}`,
  });
}
