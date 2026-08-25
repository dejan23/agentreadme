import { SITE, barRow, esc, figure, layout } from "./layout";
import { searchForm } from "./page";

/** Measured on 25 August 2026 across the 864 most-starred software repos. */
const N = 864;
const MEDIAN = 61;

const DISTRIBUTION: Array<[string, string, number, number]> = [
  ["A", "90 to 100", 18, 2],
  ["B", "70 to 89", 259, 30],
  ["C", "55 to 69", 282, 33],
  ["D", "40 to 54", 182, 21],
  ["F", "under 40", 123, 14],
];

const CATEGORIES: Array<[string, number]> = [
  ["Navigability", 83],
  ["Context economy", 76],
  ["Verification", 65],
  ["Setup", 56],
  ["Instructions", 39],
];

const LANGS: Array<[string, number, number]> = [
  ["TypeScript", 71, 173],
  ["Go", 70, 77],
  ["Rust", 63, 57],
  ["Python", 60, 214],
  ["JavaScript", 60, 104],
  ["Shell", 49, 15],
  ["Java", 44, 40],
  ["C++", 42, 41],
  ["C", 38, 21],
];

export function findingsPage(): string {
  const body = `
<section style="padding-top:56px;padding-bottom:34px">
  <p class="kicker">The finding · 25 August 2026</p>
  <h1>Most AI agent failures are a property of the <i>repository</i>, not the model.</h1>
  <p class="lede" style="margin:24px 0 0;max-width:56ch">
    We marked the ${N} most-starred software repositories on GitHub against a fixed,
    published set of checks. Nothing was cloned and no code was run. Here is what came back.
  </p>
</section>

<section class="band" style="border:0">
  <div>
    <p class="kicker">Repositories that ship an AGENTS.md score better on everything else too</p>
    <div class="nums">
      <div><div class="n">${figure(78)}</div><div class="k">median mark, the 278 that ship one</div></div>
      <div><div class="n">${figure(54)}</div><div class="k">median mark, the 586 that do not</div></div>
      <div><div class="n"><em>${figure(24)}</em></div><div class="k">points between them</div></div>
    </div>
    <p style="margin:28px 0 0;font-size:16px;color:#A3A3A3;max-width:62ch">
      Read that carefully, because it is the most misreadable number here. Writing the file does not
      earn a repository 24 points. Teams that stop to write down how their project works are the same
      teams that already committed a lockfile and made the tests runnable. The file is a symptom of
      that habit as much as a cause. It is still the cheapest place to start.
    </p>
  </div>
</section>

<section class="two">
  <div>
    <h2>Almost nothing is <i>ready</i></h2>
    <p class="lede" style="margin:16px 0 0">Eighteen repositories out of ${N} scored an A. Just over a
      third landed below 55, which is the point where an agent spends more turns orienting itself than
      changing anything.</p>
  </div>
  <div class="panel">
    <h3>Marks across ${N} repositories</h3>
    <p class="cap">grade, count, share of the total</p>
    ${DISTRIBUTION.map(([g, range, count, share], i) =>
      barRow(`${g}  ${range}`, share * 2.8, `${count}`, g === "F" || g === "D", i),
    ).join("")}
    <p class="foot">Higher is better. Curated lists and tutorials excluded.</p>
  </div>
</section>

<section class="two">
  <div>
    <h2>The weak link is always the <i>same one</i></h2>
    <p class="lede" style="margin:16px 0 0">Repositories are documented, licensed, and reasonably
      organised. What they do not do is tell an agent how to work in them. Instructions is the worst
      category by a distance, and it is the cheapest one to fix.</p>
  </div>
  <div class="panel">
    <h3>Mean score by category</h3>
    <p class="cap">percentage of available marks earned</p>
    ${CATEGORIES.map(([label, v], i) => barRow(label, v, `${v}%`, v < 50, i)).join("")}
    <p class="foot">Instructions is worth 27 of the 100 marks.</p>
  </div>
</section>

<section class="band" style="border:0">
  <div>
    <p class="kicker">Three numbers worth sitting with</p>
    <div class="nums">
      <div><div class="n"><em>${figure(38, "%")}</em></div><div class="k">have no test command an agent can find, so it edits blind and reports success</div></div>
      <div><div class="n">${figure(60, "%")}</div><div class="k">carry no agent instructions of any kind, not even a tool-specific file</div></div>
      <div><div class="n">${figure(2, "%")}</div><div class="k">scored an A</div></div>
    </div>
  </div>
</section>

<section class="two">
  <div>
    <h2>Language matters more than it <i>should</i></h2>
    <p class="lede" style="margin:16px 0 0">A TypeScript repository is not better engineered than a C
      one. What it has is a package manager that produces a lockfile, a convention for where tests go,
      and a scripts block that names commands. Ecosystem defaults do most of this work, which is why
      the spread is this wide.</p>
  </div>
  <div class="panel">
    <h3>Median mark by language</h3>
    <p class="cap">languages with at least 15 repositories</p>
    ${LANGS.map(([l, v], i) => barRow(l, v, String(v), v < 50, i)).join("")}
    <p class="foot">Sample sizes: ${LANGS.map(([l, , n]) => `${l} ${n}`).join(", ")}.</p>
  </div>
</section>

<section>
  <h2>Popularity predicts almost <i>nothing</i></h2>
  <p class="lede" style="margin:16px 0 24px">The hundred most-starred repositories have a median of 66
    against ${MEDIAN} for the rest. Five points. Being loved is not the same as being workable, and the
    projects an agent will struggle with most are often the ones it is most likely to be pointed at.</p>
</section>

<section class="two">
  <div><h2>How this was <i>measured</i></h2></div>
  <div class="cols" style="color:var(--ink-2);font-size:16.5px">
    <p><b style="color:var(--ink)">Two API calls per repository.</b> Metadata and the full file tree.
    Small configuration files come from a CDN. No repository was cloned and no code was executed.</p>
    <p><b style="color:var(--ink)">Lists and tutorials are excluded.</b> Many of the most-starred
    repositories on GitHub are curated link collections and courses. Asking whether an agent can
    install a list of links means nothing, so 136 of the 1,000 were marked separately and left out of
    every number here.</p>
    <p><b style="color:var(--ink)">Checks that do not apply are not counted.</b> A library has no
    environment to configure. Those are removed from the total rather than scored zero, so nothing is
    punished for being what it is.</p>
    <p><b style="color:var(--ink)">The scheme is opinionated and some marks are wrong.</b> Detection
    misses things, particularly outside JavaScript and Python. Every rule is
    <a href="https://github.com/dejan23/agentreadme">open source</a>, every deduction cites the file it
    came from, and a pull request beats an argument.</p>
  </div>
</section>

<section class="center">
  <h2>See where <i>yours</i> lands.</h2>
  <p class="lede">The median is ${MEDIAN}. It takes about two seconds to find out.</p>
  ${searchForm()}
</section>`;

  return layout({
    title: `Most AI agent failures are a repository problem · ${SITE}`,
    description: `We marked the ${N} most-starred software repos on GitHub for AI agent readiness. Median ${MEDIAN}/100. Repos shipping an AGENTS.md score 24 points higher, and 38% have no test command an agent can find.`,
    canonical: "/findings",
    body,
    ogImage: "/og/default.png",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "Most AI agent failures are a property of the repository, not the model",
      datePublished: "2026-08-25",
      author: { "@type": "Person", name: "Dejan Stojadinovic", url: "https://x.com/dejansto_" },
      publisher: { "@type": "Organization", name: SITE },
      url: `https://${SITE}/findings`,
    },
  });
}
