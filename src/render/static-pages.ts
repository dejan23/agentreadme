import { SITE, esc, layout } from "./layout";
import { searchForm } from "./page";

const FEATURED = [
  "openai/codex",
  "honojs/hono",
  "tinygrad/tinygrad",
  "fastapi/fastapi",
  "cloudflare/workers-sdk",
  "expressjs/express",
];

export function homePage(): string {
  const body = `
<section style="margin-bottom:34px">
  <h1 style="font-size:34px;letter-spacing:-.03em;margin:0 0 10px;line-height:1.2">
    Can an AI agent actually work in your repo?
  </h1>
  <p style="font-size:18px;color:var(--ink-2);margin:0 0 26px;max-width:62ch">
    When Claude Code or Cursor flails in a codebase, people blame the model. Usually it's
    the repo. Paste any public repository and get a graded breakdown of what an agent
    can and can't figure out, plus the fixes that matter most.
  </p>
  ${searchForm()}
  <p class="note">No account, no install, nothing stored. Try
    ${FEATURED.slice(0, 3).map((r) => `<a href="/${r}">${esc(r)}</a>`).join(", ")}.</p>
</section>

<section style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px;margin-bottom:36px">
  ${[
    ["Instructions", "Is there an AGENTS.md, and does it name real commands?"],
    ["Setup", "Can an agent install this and get it running unattended?"],
    ["Verification", "Can an agent check its own work, or is it editing blind?"],
    ["Context economy", "Does the repo fit in a context window, or fight it?"],
    ["Navigability", "How fast can something new orient itself here?"],
  ]
    .map(
      ([h, p]) =>
        `<div style="background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:18px 20px">
      <div style="font-weight:640;margin-bottom:5px">${esc(h)}</div>
      <div style="color:var(--ink-2);font-size:14.5px">${esc(p)}</div></div>`,
    )
    .join("")}
</section>

<section style="margin-bottom:20px">
  <h2 style="font-size:19px;margin:0 0 12px">Recently graded</h2>
  <div style="display:flex;gap:10px;flex-wrap:wrap">
    ${FEATURED.map(
      (r) =>
        `<a href="/${r}" style="background:var(--panel);border:1px solid var(--line);
      border-radius:8px;padding:9px 14px;font-family:var(--mono);font-size:14px;color:var(--ink-2)">${esc(r)}</a>`,
    ).join("")}
  </div>
</section>`;

  return layout({
    title: `${SITE} · Is your repo ready for AI coding agents?`,
    description:
      "Grade any public GitHub repository on how well AI coding agents can work in it. Checks agent instructions, setup, the verification loop, context economy, and navigability, then tells you what to fix first.",
    canonical: "/",
    body,
  });
}

export function aboutPage(): string {
  const body = `
<h1 style="font-size:28px;letter-spacing:-.02em;margin:0 0 8px">How the score works</h1>
<p style="color:var(--ink-2);max-width:66ch;font-size:16.5px">
  Every point on a report card traces back to something in your repository. There is no
  model judging your code and no vibes in the number. The whole rubric is checks against
  files, and you can read the source.
</p>

<h2 style="font-size:19px;margin:32px 0 6px">What we look at</h2>
<div style="color:var(--ink-2);max-width:70ch">
  <p><b style="color:var(--ink)">Instructions (27 points).</b> Whether an AGENTS.md, CLAUDE.md,
  or equivalent exists, and whether it does anything useful. A file that never names a build or
  test command scores badly no matter how long it is.</p>
  <p><b style="color:var(--ink)">Setup (20 points).</b> A lockfile, discoverable commands, a
  documented environment, a pinned runtime. The question is whether an agent gets the project
  running without a human in the loop.</p>
  <p><b style="color:var(--ink)">Verification loop (25 points).</b> The heaviest category.
  Tests that exist, a test command an agent can actually find, CI, linting, type checking.
  An agent that cannot check its own work is guessing, and this is what separates useful
  output from confident nonsense.</p>
  <p><b style="color:var(--ink)">Context economy (20 points).</b> Committed build output,
  oversized source files, repository weight. A 400KB file forces an agent to work from
  fragments and edit code it never read.</p>
  <p><b style="color:var(--ink)">Navigability (10 points).</b> Documentation, a description,
  a license.</p>
</div>

<h2 style="font-size:19px;margin:32px 0 6px">Checks that don't apply, don't count</h2>
<p style="color:var(--ink-2);max-width:70ch">A library has no environment to configure and no
reason to ship a Dockerfile. Those checks are marked not applicable and are removed from the
total rather than scored as zero, so nothing is penalised for being what it is.</p>

<h2 style="font-size:19px;margin:32px 0 6px">What we never do</h2>
<p style="color:var(--ink-2);max-width:70ch">No code is executed and no repository is cloned.
Grading is two GitHub API calls plus a few small config files read from a CDN. Private
repositories cannot be graded at all.</p>

<h2 style="font-size:19px;margin:32px 0 6px">If a score is wrong</h2>
<p style="color:var(--ink-2);max-width:70ch">Some of it will be. The rubric is opinionated and
the detection misses things, especially outside JavaScript and Python. It is open source, so
the useful move is a pull request adding the case we got wrong.</p>`;

  return layout({
    title: `How the agent readiness score works · ${SITE}`,
    description:
      "The full rubric behind the score: instructions, setup, verification loop, context economy, and navigability, with every check traced to a file in your repository.",
    canonical: "/about",
    body,
  });
}

export function agentsMdPage(): string {
  const body = `
<h1 style="font-size:28px;letter-spacing:-.02em;margin:0 0 8px">What is AGENTS.md?</h1>
<p style="color:var(--ink-2);max-width:66ch;font-size:16.5px">
  It is a plain markdown file at the root of a repository that tells an AI coding agent how to
  work in it. Think of the README as written for a person deciding whether to use your project,
  and AGENTS.md as written for whoever has to change it.
</p>

<h2 style="font-size:19px;margin:30px 0 6px">Why a separate file</h2>
<p style="color:var(--ink-2);max-width:70ch">READMEs are marketing as much as instruction. They
open with badges and a pitch, and bury the build command in the middle. An agent needs the
opposite: commands first, conventions second, and none of the persuasion.</p>

<h2 style="font-size:19px;margin:30px 0 6px">What to put in it</h2>
<p style="color:var(--ink-2);max-width:70ch">The test that matters is whether a competent
stranger could make a small change and verify it, using only this file.</p>
<pre style="max-width:70ch"><code># AGENTS.md

## Setup
pnpm install

## Commands
pnpm dev          # local server on :3000
pnpm test         # full suite, must pass before any commit
pnpm typecheck    # tsc --noEmit

## Conventions
- Server code in src/server, client in src/app. Never import across that line.
- Database changes go through a migration in db/migrations. Never edit schema.sql by hand.
- Tests live next to the file they cover, as *.test.ts.

## Gotchas
- The dev server needs Postgres running. docker compose up -d db first.
- Anything under src/generated is built from the schema. Edit the schema instead.</code></pre>

<h2 style="font-size:19px;margin:30px 0 6px">What makes one bad</h2>
<div style="color:var(--ink-2);max-width:70ch">
  <p>Being too short. A three-line file saying "this is a TypeScript project, write clean code"
  changes nothing about what an agent does.</p>
  <p>Being too long. Twenty thousand characters of philosophy gets loaded on every single turn
  and crowds out the code the agent needs to read.</p>
  <p>Naming no commands. This is the most common failure by a wide margin. If the file never
  says how to run the tests, the agent guesses, guesses wrong, and reports success anyway.</p>
</div>

<h2 style="font-size:19px;margin:30px 0 6px">Which filename</h2>
<p style="color:var(--ink-2);max-width:70ch">AGENTS.md is the vendor-neutral one and the most
widely read. CLAUDE.md, .cursorrules, and .github/copilot-instructions.md are tool-specific.
Keeping a tool-specific file is fine, but AGENTS.md is the one that works everywhere, and
scoring here reflects that.</p>

<p style="margin-top:30px">${""}<a href="/">Grade a repository</a> to see how its instructions score.</p>`;

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
    description: "That page doesn't exist.",
    body: `<h1 style="font-size:24px">Nothing here</h1>
<p style="color:var(--ink-2)">Grade a repository instead.</p>${searchForm()}`,
  });
}
