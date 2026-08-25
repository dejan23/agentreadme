import type { Row, Sort, Stats } from "../db";
import { SITE, attr, esc, layout } from "./layout";
import { searchForm } from "./page";

const EXTRA_CSS = `
.figures{display:grid;grid-template-columns:repeat(auto-fit,minmax(148px,1fr));
  gap:0;border:1px solid var(--ink);background:#fffdf7;margin:0 0 30px}
.fig{padding:16px 18px;border-right:1px solid var(--rule)}
.fig:last-child{border-right:0}
.fig .v{font-size:32px;line-height:1.05;letter-spacing:-.02em}
.fig .k{color:var(--ink-3);font-size:14px;font-style:italic;margin-top:4px;line-height:1.35}
.filters{display:flex;gap:0;flex-wrap:wrap;margin:0 0 8px;border-bottom:1px solid var(--rule)}
.filters a{padding:7px 14px 8px;font-size:16px;text-decoration:none;color:var(--ink-2);
  border-bottom:2px solid transparent;margin-bottom:-1px}
.filters a:hover{color:var(--red)}
.filters a.on{color:var(--ink);border-bottom-color:var(--red)}
.langs{display:flex;gap:14px;flex-wrap:wrap;margin:0 0 22px;font-size:15px}
.langs a{text-decoration:none;color:var(--ink-3)}
.langs a:hover{color:var(--red)}
.langs a.on{color:var(--ink);text-decoration:underline;text-decoration-color:var(--red)}
.reg{width:100%;border-collapse:collapse;font-size:17px}
.reg th{text-align:left;font-weight:400;font-size:12.5px;letter-spacing:.16em;
  text-transform:uppercase;color:var(--ink-3);padding:0 8px 9px;border-bottom:1px solid var(--ink)}
.reg td{padding:10px 8px;border-bottom:1px dotted var(--rule);vertical-align:baseline}
.reg tr:hover td{background:var(--paper-2)}
.reg .no{color:var(--ink-3);font-family:var(--mono);font-size:13px;width:36px}
.reg .nm a{text-decoration:none}
.reg .nm .o{color:var(--ink-3)}
.reg .nm small{display:block;color:var(--ink-3);font-size:14px;font-style:italic;
  margin-top:1px;max-width:46ch;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.reg .md{width:34px;text-align:center;font-family:var(--mono)}
.reg .lg{color:var(--ink-3);font-size:15px;width:104px}
.reg .st{color:var(--ink-3);font-family:var(--mono);font-size:13px;text-align:right;width:62px}
.reg .sc{font-family:var(--mono);font-size:15px;text-align:right;width:44px;color:var(--ink-2)}
.reg .gr2{color:var(--red);font-size:19px;font-weight:600;width:44px;text-align:right}
.scroll{overflow-x:auto}
@media (max-width:680px){ .reg .lg,.reg .st,.reg .nm small{display:none} .fig{border-right:0;border-bottom:1px solid var(--rule)} }
`;

function fig(v: string, k: string): string {
  return `<div class="fig"><div class="v">${esc(v)}</div><div class="k">${esc(k)}</div></div>`;
}

function pctOf(n: number, total: number): string {
  return total ? `${Math.round((n / total) * 100)}%` : "—";
}

function row(r: Row, i: number): string {
  const slug = `${r.owner}/${r.repo}`;
  const mdTitle = r.has_agents_md
    ? "Has AGENTS.md"
    : r.has_any_agent_doc
      ? "Has a tool-specific instruction file"
      : "No agent instructions";
  return `<tr>
  <td class="no">${i + 1}</td>
  <td class="nm"><a href="/${attr(slug)}"><span class="o">${esc(r.owner)}/</span>${esc(r.repo)}</a>
    ${r.description ? `<small>${esc(r.description)}</small>` : ""}</td>
  <td class="md" title="${attr(mdTitle)}">${
    r.has_agents_md ? '<span class="pass">✓</span>' : r.has_any_agent_doc ? '<span class="part">~</span>' : '<span class="skip">·</span>'
  }</td>
  <td class="lg">${esc(r.language ?? "")}</td>
  <td class="st">${r.stars >= 1000 ? `${Math.round(r.stars / 1000)}k` : String(r.stars)}</td>
  <td class="sc">${r.score}</td>
  <td class="gr2">${esc(r.grade)}</td>
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

  const heading = language
    ? `${language}, marked`
    : sort === "worst"
      ? "Bottom of the class"
      : sort === "popular"
        ? "The class list, by standing"
        : "Top of the class";

  const body = `
<h1 style="font-size:38px;margin:0 0 12px;letter-spacing:-.02em">${esc(heading)}</h1>
<p style="font-size:18px;color:var(--ink-2);max-width:58ch;margin:0 0 26px">
  Every public repository here has at least 1,000 stars and was marked against the same
  scheme. Curated lists, books, and tutorials are marked separately and left out, since
  asking whether an agent can install a list of links means nothing.
</p>

<div class="figures">
  ${fig(stats.total.toLocaleString(), "repositories marked")}
  ${fig(String(stats.median), "median mark out of 100")}
  ${fig(pctOf(stats.withAgentsMd, stats.total), "ship an AGENTS.md")}
  ${fig(pctOf(stats.total - stats.withTestCommand, stats.total), "have no test command an agent can find")}
</div>

<div class="filters">
  ${tab("best", "Top of the class")}
  ${tab("worst", "Bottom of the class")}
  ${tab("popular", "Most starred")}
</div>

${
  langs.length
    ? `<div class="langs">
  <a class="${!language ? "on" : ""}" href="${qs(sort)}">All</a>
  ${langs.map((l) => `<a class="${language === l.language ? "on" : ""}" href="${qs(sort, l.language)}">${esc(l.language)}</a>`).join("")}
</div>`
    : ""
}

${
  rows.length
    ? `<div class="scroll"><table class="reg">
  <thead><tr><th></th><th>Repository</th><th title="Ships an AGENTS.md">MD</th><th>Language</th>
    <th style="text-align:right">Stars</th><th style="text-align:right">Mark</th><th></th></tr></thead>
  <tbody>${rows.map(row).join("")}</tbody>
</table></div>`
    : `<p style="color:var(--ink-2)">Nothing marked yet.${language ? " Try another language." : ""}</p>`
}

<section style="margin-top:44px">
  <h2 style="font-size:15px;letter-spacing:.2em;text-transform:uppercase;color:var(--ink-2);margin:0 0 14px">
    Mark your own</h2>
  ${searchForm()}
</section>`;

  return layout({
    title: language
      ? `${language} repositories ranked by AI agent readiness · ${SITE}`
      : `Which repositories are ready for AI coding agents? · ${SITE}`,
    description: `${stats.total.toLocaleString()} popular open source repositories marked on how well AI coding agents can work in them. The median scores ${stats.median} out of 100, and ${pctOf(stats.total - stats.withTestCommand, stats.total)} have no test command an agent can find.`,
    canonical: language ? `/leaderboard?sort=${sort}&lang=${encodeURIComponent(language)}` : `/leaderboard?sort=${sort}`,
    body,
    extraCss: EXTRA_CSS,
  });
}
