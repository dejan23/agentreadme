import { SITE, barRow, esc, layout } from "./layout";
import { GUIDES, type Guide } from "./guides-data";
import { searchForm } from "./page";

export function guidesIndex(): string {
  const body = `
<section style="padding-top:56px">
  <h1>Writing an <i>AGENTS.md</i></h1>
  <p class="lede" style="margin:22px 0 0">One guide per ecosystem, because the advice genuinely
    differs. A Python project's biggest problem is the unpinned runtime. A Java project's is that
    nothing exposes a test command. Every number below was measured, not assumed.</p>
</section>

<section>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:0 36px">
    ${GUIDES.map(
      (g) => `<a href="/guides/${g.slug}" style="display:block;padding:16px 0;
      border-bottom:1px solid var(--rule);text-decoration:none">
      <div style="display:flex;align-items:baseline;gap:10px">
        <span style="font-weight:700;font-size:18px">${esc(g.language)}</span>
        <span style="margin-left:auto;font-family:var(--mono);font-size:13px;color:var(--ink-3)">median ${g.median}</span>
      </div>
      <div style="color:var(--ink-2);font-size:15px;margin-top:3px">Most common gap: ${esc(g.worst[0][0].toLowerCase())}, in ${g.worst[0][1]}% of them</div>
    </a>`,
    ).join("")}
  </div>
</section>

<section class="two">
  <div>
    <h2>Start with the <i>general</i> one</h2>
    <p class="lede" style="margin:16px 0 18px">What AGENTS.md is, what belongs in it, and what makes
      one useless regardless of language.</p>
    <p><a href="/what-is-agents-md">What is AGENTS.md?</a></p>
  </div>
  <div>
    <p style="color:var(--ink-2)">Or skip the reading. Point the tool at a repository and it drafts one
      from what is already there: the install command from your lockfile, the commands you already
      declare, your real directory layout.</p>
    ${searchForm()}
  </div>
</section>`;

  return layout({
    title: `How to write an AGENTS.md, by language · ${SITE}`,
    description:
      "Guides for writing an AGENTS.md in TypeScript, Python, Go, Rust, JavaScript, Java and C++, with the most common gap in each measured across 864 repositories.",
    canonical: "/guides",
    ogImage: "/og/default.png",
    body,
  });
}

export function guidePage(g: Guide): string {
  const others = GUIDES.filter((x) => x.slug !== g.slug);

  const body = `
<section style="padding-top:56px">
  <p class="kicker"><a href="/guides" style="color:inherit">Guides</a> · ${esc(g.language)}</p>
  <h1>${esc(g.title)}</h1>
  <p class="lede" style="margin:22px 0 0">Measured across ${g.sample} of the most-starred
    ${esc(g.language)} repositories on GitHub. The median scores ${g.median} out of 100.</p>
</section>

<section class="two">
  <div>
    <h2 style="font-size:30px">What ${esc(g.language)} repos get <i>wrong</i></h2>
    <p style="color:var(--ink-2);font-size:16.5px;margin-top:16px">${esc(g.note)}</p>
  </div>
  <div class="panel">
    <h3>Most common failures</h3>
    <p class="cap">share of ${g.sample} ${esc(g.language)} repositories scoring zero on each</p>
    ${g.worst.map(([label, pct], i) => barRow(label, pct, `${pct}%`, pct >= 50, i)).join("")}
    <p class="foot">Lower is better here. These are failures, not scores.</p>
  </div>
</section>

<section class="two">
  <div>
    <h2 style="font-size:30px">A working <i>example</i></h2>
    <p class="lede" style="font-size:17px;margin:16px 0 0">Commands first, conventions second, none of
      the persuasion a README carries. The test is whether a capable stranger could make a small change
      and verify it using only this file.</p>
    <p style="color:var(--ink-2);font-size:16px;margin-top:16px">Save it at the root of the repository
      as <code>AGENTS.md</code>. Tool-specific files like CLAUDE.md or .cursorrules still work, but
      AGENTS.md is the one every tool reads.</p>
  </div>
  <div>
    <div class="term">
      <div class="bar">
        <span class="dot"></span><span class="dot"></span><span class="dot"></span>
        <span class="name">AGENTS.md — ${esc(g.language)}</span>
      </div>
      <div class="body"><pre>${esc(g.example)}</pre></div>
    </div>
  </div>
</section>

<section>
  <h2>The two lines that matter <i>most</i></h2>
  <p class="lede" style="margin:16px 0 20px">If you write nothing else, write these. An agent that
    cannot install the project cannot start, and one that cannot run the tests cannot tell whether it
    broke something.</p>
  <div class="term" style="max-width:640px">
    <div class="body"><pre><s># install</s>
${esc(g.install)}

<s># verify</s>
${esc(g.testCmd)}</pre></div>
  </div>
</section>

<section class="two">
  <div>
    <h2 style="font-size:30px">Have it <i>drafted</i> instead</h2>
    <p class="lede" style="font-size:17px;margin:16px 0 18px">Point the tool at a repository and it
      writes the file from what is already there, rather than from a template.</p>
    ${searchForm()}
  </div>
  <div>
    <p style="color:var(--ink-2)">For private code, the same rubric runs on your machine and sends
      nothing anywhere:</p>
    <div class="term">
      <div class="body"><pre><span class="prompt">$</span> <span class="cmd">npx agentreadme --write-agents</span></pre></div>
    </div>
  </div>
</section>

<section>
  <p class="kicker">Other ecosystems</p>
  <div style="display:flex;gap:14px;flex-wrap:wrap">
    ${others
      .map(
        (o) => `<a href="/guides/${o.slug}" style="border:1px solid var(--rule);padding:8px 14px;
      text-decoration:none;font-size:15px">${esc(o.language)} <span style="color:var(--ink-3);font-family:var(--mono);font-size:13px">${o.median}</span></a>`,
      )
      .join("")}
  </div>
</section>`;

  return layout({
    title: `${g.title} · ${SITE}`,
    description: `${g.sample} of the most-starred ${g.language} repos scored a median ${g.median}/100 for AI agent readiness. The most common gap is ${g.worst[0][0].toLowerCase()}, missing in ${g.worst[0][1]}%. A working AGENTS.md example for ${g.language}.`,
    canonical: `/guides/${g.slug}`,
    ogImage: "/og/default.png",
    body,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: g.title,
      description: `Write an AGENTS.md for a ${g.language} project so AI coding agents can install, run, and verify it.`,
      step: [
        { "@type": "HowToStep", name: "Name the install command", text: g.install },
        { "@type": "HowToStep", name: "Name the test command", text: g.testCmd },
        { "@type": "HowToStep", name: "Write down the conventions a newcomer always gets wrong", text: "Two or three lines, no more." },
      ],
      url: `https://${SITE}/guides/${g.slug}`,
    },
  });
}
