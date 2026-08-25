import type { Row, Stats } from "../db";
import { SITE, barRow, esc, figure, layout } from "./layout";
import { searchForm } from "./page";

/** Real measured medians, used when the database has nothing yet. */
const FALLBACK_LANGS: Array<[string, number]> = [
  ["TypeScript", 71], ["Go", 70], ["Rust", 63], ["Python", 60],
  ["JavaScript", 60], ["Java", 44], ["C++", 42], ["C", 38],
];

/** Mirrors the real output of `curl agentreadme.com/honojs/hono.txt`. */
const SAMPLE = `<div class="term">
  <div class="bar">
    <span class="dot"></span><span class="dot"></span><span class="dot"></span>
    <span class="name">bash \u2014 ~/code</span>
  </div>
  <div class="body"><pre><span class="prompt">$</span> <span class="cmd">curl agentreadme.com/honojs/hono.txt</span>

<s># honojs/hono \u2014 72/100 \u00b7 B+</s>

<b>\u2717 Instructions              3/27   F</b>
  None found. Every agent that opens
  this repo starts from zero.
\u2713 Setup                    14/14   A+
\u2713 Verification loop        24/25   A+
\u2713 Context economy          18/20   A
\u2713 Navigability             10/10   A+

<s># fix first</s>
<b>+</b> Add an AGENTS.md at the root: what the
  project is, how to install, how to run,
  how to test, and the conventions a
  newcomer always gets wrong.
<b>+</b> Instructions earn their keep by naming
  exact commands.

<s># full report: agentreadme.com/honojs/hono</s>

<span class="prompt">$</span> <span class="cursor"></span></pre></div>
</div>`;

const SCHEME: Array<[string, string, string]> = [
  ["Instructions", "27", "An AGENTS.md that names the real commands"],
  ["Setup", "20", "A lockfile, declared commands, a documented environment"],
  ["Verification loop", "25", "Tests an agent can find and run to check itself"],
  ["Context economy", "20", "No 400KB files, no committed build output"],
  ["Navigability", "10", "Documentation, a description, a licence"],
];

export function homePage(recent?: Row[], stats?: Stats, langs?: Array<[string, number]>): string {
  const total = stats?.total ?? 865;
  const median = stats?.median ?? 61;
  const noTest = stats?.total ? Math.round(((stats.total - stats.withTestCommand) / stats.total) * 100) : 38;
  const withMd = stats?.total ? Math.round((stats.withAgentsMd / stats.total) * 100) : 32;
  const chart = (langs?.length ? langs : FALLBACK_LANGS).slice(0, 10);
  const worst = Math.min(...chart.map(([, v]) => v));

  const body = `
<div class="hero">
  <div>
    <h1>Can an AI agent <i>actually</i> work in your repo?</h1>
    <p class="lede" style="margin:20px 0 26px">When Claude Code or Cursor flails in a codebase,
      everyone blames the model. <b>Usually it is the repository.</b></p>
    ${searchForm()}
    <p class="note">Try it on the repo you have open right now. Nothing installed, no code executed.</p>
  </div>
  <div class="panel">
    <h3>Median agent-readiness by language</h3>
    <p class="cap">${total.toLocaleString()} most-starred software repos on GitHub</p>
    ${chart.map(([l, v], i) => barRow(l, v, String(v), v <= worst + 4, i)).join("")}
    <p class="foot">Higher is better. Curated lists and tutorials excluded.</p>
  </div>
</div>

<section class="band" style="border:0">
  <div>
    <p class="kicker">What we found across ${total.toLocaleString()} repositories</p>
    <div class="nums">
      <div><div class="n">${figure(median)}</div><div class="k">median mark out of a hundred</div></div>
      <div><div class="n"><em>${figure(noTest, "%")}</em></div><div class="k">have no test command an agent can find</div></div>
      <div><div class="n">${figure(withMd, "%")}</div><div class="k">ship an AGENTS.md</div></div>
    </div>
    <p style="margin:28px 0 0;font-size:16px"><a href="/leaderboard">See the whole class list</a></p>
  </div>
</section>

<section class="two">
  <div>
    <h2>Five things decide whether an agent <i>succeeds</i></h2>
    <div style="margin-top:22px">
      ${SCHEME.map(
        ([l, m, d]) => `<div style="display:flex;gap:14px;align-items:baseline;padding:12px 0;border-bottom:1px solid var(--rule)">
        <div><b style="font-weight:600;font-size:16.5px">${esc(l)}</b>
          <div style="color:var(--ink-2);font-size:15px;margin-top:2px">${esc(d)}</div></div>
        <span style="margin-left:auto;font-family:var(--mono);font-size:14px;color:var(--ink-3)">${esc(m)}</span>
      </div>`,
      ).join("")}
    </div>
  </div>
  <div>${SAMPLE}</div>
</section>

${
  recent && recent.length >= 4
    ? `<section>
  <p class="kicker">Recently marked</p>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:0 30px">
    ${recent
      .slice(0, 8)
      .map(
        (r) => `<a href="/${r.owner}/${r.repo}" style="display:flex;align-items:baseline;gap:10px;
      padding:11px 0;border-bottom:1px solid var(--rule);text-decoration:none">
      <span style="font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(r.owner)}/${esc(r.repo)}</span>
      <span style="margin-left:auto;font-family:var(--mono);font-size:13px;color:var(--ink-3)">${r.score}</span>
      <span style="font-weight:700;font-family:var(--mono);font-size:14px;${r.score < 55 ? "color:var(--acc-t)" : ""}">${esc(r.grade)}</span>
    </a>`,
      )
      .join("")}
  </div>
</section>`
    : ""
}

<section class="two">
  <div>
    <h2>Private repo? Run it <i>locally</i>.</h2>
    <p class="lede" style="margin:16px 0 18px">This site cannot read private repositories and never
      will. The same rubric runs on your machine instead.</p>
    <p style="color:var(--ink-2);font-size:16.5px">Nothing is uploaded. No account, no token, no
      network call at all. It works on private repos, monorepos, uncommitted work, and code that was
      never pushed anywhere.</p>
    <p style="color:var(--ink-2);font-size:16.5px">It grades what git tracks, so a local run and this
      site agree on the same repository.</p>
  </div>
  <div>
    <div class="term">
      <div class="bar">
        <span class="dot"></span><span class="dot"></span><span class="dot"></span>
        <span class="name">bash \u2014 ~/your-private-repo</span>
      </div>
      <div class="body"><pre><span class="prompt">$</span> <span class="cmd">npx agentreadme</span>

  acme/internal-api   <b>54/100  C-</b>

  Instructions       <b>\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591</b>    0/27  F
  Setup              \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2591\u2591\u2591\u2591   14/20  B+
  Verification loop  \u2588\u2588\u2588\u2588\u2588\u2588\u2591\u2591\u2591\u2591\u2591\u2591   12/25  C
  Context economy    \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2591\u2591   17/20  A
  Navigability       \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2591\u2591\u2591\u2591    5/7   B+

  <s>Fix these first</s>
  <b>1.</b> Agent instruction file
  <b>2.</b> Test command is discoverable

<span class="prompt">$</span> <span class="cursor"></span></pre></div>
    </div>
    <p class="note" style="margin-top:14px"><code>--write-agents</code> drafts the file for you.
      <code>--min 70</code> fails a build below a score.</p>
  </div>
</section>

<section class="center">
  <h2>Try it on the repo you have <i>open right now</i>.</h2>
  <p class="lede">Two API calls. Nothing cloned, nothing executed, no account.
    The marking scheme is <a href="/about">published in full</a> and every deduction cites its file.</p>
  ${searchForm()}
</section>`;

  return layout({
    title: `${SITE} · Is your repository ready for AI coding agents?`,
    description:
      "Grade any public GitHub repo on how well AI coding agents can work in it. Instructions, setup, tests, context economy. See what to fix first.",
    canonical: "/",
    ogImage: "/og/default.png",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE,
      url: `https://${SITE}`,
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: `https://${SITE}/analyze?repo={search_term_string}` },
        "query-input": "required name=search_term_string",
      },
    },
    body,
    announce: `We marked the ${total.toLocaleString()} most-starred repos on GitHub. The median scored ${median}. <a href="/findings">Read the findings</a>`,
  });
}

export function aboutPage(): string {
  const body = `
<section style="padding-top:56px">
  <h1>The marking <i>scheme</i></h1>
  <p class="lede" style="margin:22px 0 0">Every mark traces back to something in the repository. No model
    judges your code and there is no discretion in the number. The whole scheme is checks against
    files, and you can read the source.</p>
</section>

<section>
  <h2>What is marked</h2>
  <div class="cols" style="margin-top:22px;color:var(--ink-2);font-size:16.5px">
    <p><b style="color:var(--ink)">Instructions, 27 marks.</b> Whether an AGENTS.md, CLAUDE.md, or
    equivalent exists, and whether it does anything useful. A file that never names a build or test
    command scores badly however long it is.</p>
    <p><b style="color:var(--ink)">Setup, 20 marks.</b> A lockfile, discoverable commands, a documented
    environment, a pinned runtime. The question is whether an agent gets the project running with
    nobody watching.</p>
    <p><b style="color:var(--ink)">Verification loop, 25 marks.</b> The heaviest section. Tests that
    exist, a test command an agent can actually find, CI, linting, type checking. An agent that cannot
    check its own work is guessing, and this is what separates useful output from confident nonsense.</p>
    <p><b style="color:var(--ink)">Context economy, 20 marks.</b> Committed build output, oversized
    source files, repository weight. One 400KB file forces an agent to work from fragments and edit
    code it never read.</p>
    <p><b style="color:var(--ink)">Navigability, 10 marks.</b> Documentation, a description, a licence.</p>
  </div>
</section>

<section>
  <h2>The rules we apply to <i>ourselves</i></h2>
  <div class="cols" style="margin-top:22px;color:var(--ink-2);font-size:16.5px">
    <p><b style="color:var(--ink)">Checks that do not apply are not counted.</b> A library has no
    environment to configure and no reason to ship a Dockerfile. Those are marked not applicable and
    removed from the total rather than scored as zero, so nothing is punished for being what it is.</p>
    <p><b style="color:var(--ink)">Link collections are marked separately.</b> Many of the most-starred
    repositories on GitHub are curated lists, books, and tutorials. Asking whether an agent can install
    a list of links means nothing, so those are kept off the class list and out of every published
    statistic.</p>
    <p><b style="color:var(--ink)">Nothing is executed.</b> No code runs and no repository is cloned.
    Marking is two GitHub API calls plus a few small configuration files read from a CDN. Private
    repositories cannot be marked at all.</p>
    <p><b style="color:var(--ink)">Some marks will be wrong.</b> The scheme is opinionated and the
    detection misses things, particularly outside JavaScript and Python. It is open source, so the
    useful response is a pull request adding the case we got wrong.</p>
  </div>
</section>

<section>
  <h2>Read it as <i>plain text</i></h2>
  <p class="lede" style="margin:16px 0 20px">Any report is available as text, so an agent can read its
    own scorecard without a browser.</p>
  <pre><code>$ curl agentreadme.com/honojs/hono.txt</code></pre>
</section>`;

  return layout({
    title: `The marking scheme · ${SITE}`,
    description:
      "The full rubric behind the mark: instructions, setup, the verification loop, context economy, and navigability, with every check traced to a file in the repository.",
    canonical: "/about",
    ogImage: "/og/default.png",
    body,
  });
}

export function agentsMdPage(): string {
  const body = `
<section style="padding-top:56px">
  <h1>What is <i>AGENTS.md</i>?</h1>
  <p class="lede" style="margin:22px 0 0">A plain markdown file at the root of a repository that tells an
    AI coding agent how to work in it. The README is written for a person deciding whether to use your
    project. AGENTS.md is written for whoever has to change it.</p>
</section>

<section class="two">
  <div>
    <h2 style="font-size:34px">What belongs in it</h2>
    <p class="lede" style="font-size:17px;margin:16px 0 0">The test that matters is whether a capable
      stranger could make a small change and verify it using only this file. Commands first,
      conventions second, none of the persuasion a README carries.</p>
  </div>
  <div><pre><code># AGENTS.md

## Setup
pnpm install

## Commands
pnpm dev          # local server on :3000
pnpm test         # full suite, must pass before any commit
pnpm typecheck    # tsc --noEmit

## Conventions
- Server code in src/server, client in src/app.
  Never import across that line.
- Database changes go through a migration
  in db/migrations.
- Tests sit next to the file they cover.

## Gotchas
- The dev server needs Postgres.
  Run docker compose up -d db first.
- Anything under src/generated is built from
  the schema. Edit the schema.</code></pre></div>
</section>

<section>
  <h2>What makes one <i>bad</i></h2>
  <div class="cols" style="margin-top:22px;color:var(--ink-2);font-size:16.5px">
    <p><b style="color:var(--ink)">Too short.</b> Three lines saying "this is a TypeScript project, write
    clean code" changes nothing about what an agent does.</p>
    <p><b style="color:var(--ink)">Too long.</b> Twenty thousand characters of philosophy loads on every
    turn and crowds out the code the agent needs to read.</p>
    <p><b style="color:var(--ink)">No commands.</b> The most common failure by a wide margin. If the file
    never says how to run the tests, the agent guesses, guesses wrong, and reports success anyway.</p>
    <p><b style="color:var(--ink)">The wrong filename.</b> AGENTS.md is vendor-neutral and the most widely
    read. CLAUDE.md, .cursorrules, and .github/copilot-instructions.md are tool-specific. Keeping one
    alongside is fine, but AGENTS.md is the one that works everywhere.</p>
  </div>
</section>

<section class="center">
  <h2>See how yours <i>scores</i>.</h2>
  <p class="lede">Instructions are worth 27 of the 100 marks, and the median
    repository gets 39% of them.</p>
  ${searchForm()}
</section>`;

  return layout({
    title: `What is AGENTS.md, and how do you write a good one? · ${SITE}`,
    description:
      "AGENTS.md tells an AI coding agent how to work in your repo. What belongs in it, what makes one useless, and how it differs from a README.",
    canonical: "/what-is-agents-md",
    ogImage: "/og/default.png",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "TechArticle",
      headline: "What is AGENTS.md, and how do you write a good one?",
      about: "AGENTS.md",
      url: `https://${SITE}/what-is-agents-md`,
    },
    body,
  });
}

export function notFoundPage(): string {
  return layout({
    title: `Not found · ${SITE}`,
    description: "That page does not exist.",
    noindex: true,
    body: `<section style="padding-top:60px"><h1>Nothing here</h1>
<p class="lede" style="margin:20px 0 24px">Mark a repository instead.</p>${searchForm()}</section>`,
  });
}
