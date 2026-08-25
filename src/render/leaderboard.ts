import type { Row, Sort, Stats } from "../db";
import { colorFor } from "./badge";
import { SITE, attr, esc, layout } from "./layout";
import { searchForm } from "./page";

const EXTRA_CSS = `
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin:0 0 26px}
.stat{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:16px 18px}
.stat .v{font-size:29px;font-weight:680;letter-spacing:-.03em;line-height:1.1}
.stat .k{color:var(--ink-3);font-size:13px;margin-top:4px;line-height:1.35}
.tabs{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 16px}
.tabs a{padding:7px 14px;border-radius:20px;border:1px solid var(--line);
  font-size:14px;color:var(--ink-2);background:var(--panel)}
.tabs a.on{background:var(--accent);color:#06121c;border-color:var(--accent);font-weight:600}
.lb{width:100%;border-collapse:collapse;font-size:14.5px}
.lb th{text-align:left;color:var(--ink-3);font-weight:500;font-size:12.5px;
  text-transform:uppercase;letter-spacing:.06em;padding:0 10px 10px;border-bottom:1px solid var(--line)}
.lb td{padding:11px 10px;border-bottom:1px solid var(--line);vertical-align:middle}
.lb tr:hover td{background:var(--panel)}
.lb .rank{color:var(--ink-3);font-family:var(--mono);width:38px;font-size:13px}
.lb .name{font-weight:560}
.lb .name .o{color:var(--ink-3);font-weight:400}
.lb .name small{display:block;color:var(--ink-3);font-weight:400;font-size:12.5px;
  margin-top:2px;max-width:52ch;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.lb .sc{font-family:var(--mono);font-weight:640;text-align:right;width:52px}
.lb .gr{font-family:var(--mono);font-size:12.5px;color:var(--ink-3);width:34px}
.lb .lang{color:var(--ink-3);font-size:13px;width:96px}
.lb .st{color:var(--ink-3);font-family:var(--mono);font-size:13px;text-align:right;width:70px}
.lb .amd{width:44px;text-align:center;font-family:var(--mono)}
.scroll{overflow-x:auto;-webkit-overflow-scrolling:touch}
@media (max-width:680px){ .lb .lang,.lb .st{display:none} .lb .name small{display:none} }
`;

function statCard(v: string, k: string): string {
  return `<div class="stat"><div class="v">${esc(v)}</div><div class="k">${esc(k)}</div></div>`;
}

function pctOf(n: number, total: number): string {
  return total ? `${Math.round((n / total) * 100)}%` : "0%";
}

function row(r: Row, i: number): string {
  const slug = `${r.owner}/${r.repo}`;
  return `<tr>
  <td class="rank">${i + 1}</td>
  <td class="name"><a href="/${attr(slug)}"><span class="o">${esc(r.owner)}/</span>${esc(r.repo)}</a>
    ${r.description ? `<small>${esc(r.description)}</small>` : ""}</td>
  <td class="amd" title="${r.has_agents_md ? "Has AGENTS.md" : r.has_any_agent_doc ? "Has a tool-specific instruction file" : "No agent instructions"}">${
    r.has_agents_md ? '<span class="pass">✓</span>' : r.has_any_agent_doc ? '<span class="part">~</span>' : '<span class="skip">·</span>'
  }</td>
  <td class="lang">${esc(r.language ?? "")}</td>
  <td class="st">${r.stars >= 1000 ? `${Math.round(r.stars / 1000)}k` : String(r.stars)}</td>
  <td class="sc" style="color:${colorFor(r.score)}">${r.score}</td>
  <td class="gr">${esc(r.grade)}</td>
</tr>`;
}

export function leaderboardPage(opts: {
  rows: Row[];
  stats: Stats;
  sort: Sort;
  language?: string;
  langs: Array<{ language: string; n: number }>;
}): string {
  const { rows, stats, sort, language, langs } = opts;
  const qs = (s: Sort, l?: string) => `/leaderboard?sort=${s}${l ? `&lang=${encodeURIComponent(l)}` : ""}`;

  const tab = (s: Sort, label: string) =>
    `<a class="${sort === s ? "on" : ""}" href="${qs(s, language)}">${esc(label)}</a>`;

  const headline = language
    ? `${language} repositories, ranked`
    : sort === "worst"
      ? "The popular repositories agents struggle with most"
      : sort === "popular"
        ? "The most popular repositories, graded"
        : "The repositories best set up for AI agents";

  const body = `
<h1 style="font-size:29px;letter-spacing:-.025em;margin:0 0 8px">${esc(headline)}</h1>
<p style="color:var(--ink-2);max-width:64ch;margin:0 0 24px;font-size:16px">
  Every public repository here has at least 1,000 stars and was graded on the same rubric:
  can an AI coding agent install it, understand it, change it, and verify the change.
</p>

<div class="stats">
  ${statCard(String(stats.total.toLocaleString()), "repositories graded")}
  ${statCard(String(stats.median), "median score out of 100")}
  ${statCard(pctOf(stats.withAgentsMd, stats.total), "have an AGENTS.md")}
  ${statCard(pctOf(stats.withTestCommand, stats.total), "have a test command an agent can find")}
</div>

<div class="tabs">
  ${tab("best", "Best")}
  ${tab("worst", "Worst")}
  ${tab("popular", "Most starred")}
</div>

${
  langs.length
    ? `<div class="tabs" style="margin-bottom:20px">
  <a class="${!language ? "on" : ""}" href="${qs(sort)}">All languages</a>
  ${langs.map((l) => `<a class="${language === l.language ? "on" : ""}" href="${qs(sort, l.language)}">${esc(l.language)}</a>`).join("")}
</div>`
    : ""
}

${
  rows.length
    ? `<div class="scroll"><table class="lb">
  <thead><tr><th></th><th>Repository</th><th title="Has AGENTS.md">MD</th><th>Language</th><th style="text-align:right">Stars</th><th style="text-align:right">Score</th><th></th></tr></thead>
  <tbody>${rows.map(row).join("")}</tbody>
</table></div>`
    : `<p style="color:var(--ink-2)">Nothing graded yet. ${language ? "Try another language." : ""}</p>`
}

<section style="margin-top:38px">
  <h2 style="font-size:19px;margin:0 0 10px">Grade your own</h2>
  ${searchForm()}
</section>`;

  return layout({
    title: language
      ? `${language} repositories ranked by AI agent readiness · ${SITE}`
      : `Which repositories are ready for AI coding agents? · ${SITE}`,
    description: `${stats.total.toLocaleString()} popular open source repositories graded on how well AI coding agents can work in them. Median score ${stats.median} out of 100, and only ${pctOf(stats.withAgentsMd, stats.total)} have an AGENTS.md.`,
    canonical: language ? `/leaderboard?sort=${sort}&lang=${encodeURIComponent(language)}` : `/leaderboard?sort=${sort}`,
    body,
    extraCss: EXTRA_CSS,
  });
}
