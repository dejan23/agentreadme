import type { Row, Sort, Stats } from "../db";
import { SITE, attr, esc, figure, layout } from "./layout";
import { searchForm } from "./page";

const EXTRA_CSS = `
/* One control bar: sort on the left, find on the right, languages beneath.
   Three stacked bands of controls buried the table. */
.lbbar{display:flex;align-items:flex-end;gap:20px;flex-wrap:wrap;
  border-bottom:1px solid var(--rule);margin:0 0 12px}
.filters{display:flex;gap:0;flex-wrap:wrap}
.filters a{padding:9px 16px 10px;font-size:15.5px;font-weight:600;text-decoration:none;
  color:var(--ink-3);border-bottom:3px solid transparent;margin-bottom:-1px}
.filters a:hover{color:var(--ink)}
.filters a.on{color:var(--ink);border-bottom-color:var(--acc)}
.langs{display:flex;gap:15px;flex-wrap:wrap;margin:0 0 22px;font-size:14px}
.langs a{text-decoration:none;color:var(--ink-3)}
.langs a:hover{color:var(--acc-t)}
.langs a.on{color:var(--ink);font-weight:700}
.reg{width:100%;border-collapse:collapse;font-size:16px}
.reg th{text-align:left;font-weight:700;font-size:12px;letter-spacing:.05em;text-transform:uppercase;
  color:var(--ink-3);padding:0 10px 10px;border-bottom:2px solid var(--ink)}
.reg td{padding:12px 10px;border-bottom:1px solid var(--rule);vertical-align:baseline}
.reg tr:hover td{background:var(--track)}
.reg .no{color:var(--ink-3);font-family:var(--mono);font-size:12.5px;width:40px}
.reg .nm a{text-decoration:none;font-weight:600}
.reg .nm .o{color:var(--ink-3);font-weight:400}
.reg .nm small{display:block;color:var(--ink-3);font-size:14px;font-weight:400;margin-top:2px;
  max-width:48ch;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.reg .md{width:36px;text-align:center;font-family:var(--mono)}
.reg .lg{color:var(--ink-3);font-size:14.5px;width:106px}
.reg .st{color:var(--ink-3);font-family:var(--mono);font-size:12.5px;text-align:right;width:64px}
.reg .sc{font-family:var(--mono);font-size:14px;text-align:right;width:46px;color:var(--ink-2)}
.reg .gr{font-family:var(--mono);font-size:18px;font-weight:700;width:46px;text-align:right}
.reg .gr.bad{color:var(--acc-t)}
.scroll{overflow-x:auto}
.find{display:flex;align-items:center;border:1px solid var(--rule);background:#fff;
  margin:0 0 8px auto;width:270px;max-width:100%}
.find:focus-within{border-color:var(--ink)}
.find input{flex:1;min-width:0;border:0;padding:8px 11px;font-family:var(--mono);
  font-size:13.5px;background:transparent;color:var(--ink)}
.find input:focus{outline:none}
.find input::placeholder{color:var(--ink-3)}
.find .n{flex:none;padding:0 11px 0 0;font-family:var(--mono);font-size:12px;color:var(--ink-3)}
@media (max-width:640px){.find{margin-left:0;width:100%}}
.miss{padding:26px 10px;color:var(--ink-2);font-size:16px}
.miss a{font-weight:600}
#lb{transition:opacity .12s ease-out}
#lb[data-loading]{opacity:.4}
@media (max-width:700px){ .reg .lg,.reg .st,.reg .nm small{display:none} }
`;

/**
 * Swaps the table in place when a filter is clicked, instead of reloading the
 * page. The links stay real URLs so they still work with JavaScript off and
 * still get crawled; this only intercepts them.
 */
const FILTER_JS = `(function(){
var root=document.getElementById('lb');
if(!root||!window.fetch||!window.history.pushState||!Element.prototype.closest)return;
function load(url,push){
root.setAttribute('data-loading','');
fetch(url,{credentials:'same-origin'}).then(function(r){return r.text()}).then(function(t){
var doc=new DOMParser().parseFromString(t,'text/html'),next=doc.getElementById('lb');
if(!next)throw 0;
root.innerHTML=next.innerHTML;
root.removeAttribute('data-loading');
if(q){var box=root.querySelector('#lbq'); if(box){box.value=q; apply()}}
if(doc.title)document.title=doc.title;
if(push)history.pushState({},'',url);
}).catch(function(){location.href=url});
}
root.addEventListener('click',function(e){
var a=e.target.closest('a');
if(!a||(!a.closest('.filters')&&!a.closest('.langs')))return;
e.preventDefault();load(a.getAttribute('href'),true);
});
window.addEventListener('popstate',function(){load(location.pathname+location.search,false)});

// Filter the visible rows as you type. When nothing matches and the query
// looks like a repository, offer to mark it instead of showing a dead end.
var q='';
function esc(s){return s.replace(/[<>&"]/g,function(c){return {'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c]})}
function apply(){
var rows=root.querySelectorAll('.reg tbody tr'),n=0,t=q.trim().toLowerCase();
for(var i=0;i<rows.length;i++){
var hit=!t||rows[i].textContent.toLowerCase().indexOf(t)>-1;
rows[i].hidden=!hit; if(hit)n++;
}
var count=root.querySelector('#lbn');
if(count)count.textContent=t?(n+' of '+rows.length):'';
var miss=root.querySelector('#lbmiss');
if(!miss)return;
if(t&&n===0){
var slug=q.trim().replace(/^https?:\\/\\/(www\\.)?github\\.com\\//,'').replace(/\\.git$/,'').replace(/^\\/+|\\/+$/g,'');
miss.innerHTML=/^[A-Za-z0-9][A-Za-z0-9-]*\\/[A-Za-z0-9._-]+$/.test(slug)
?'Not on the class list. <a href="/'+esc(slug)+'">Mark '+esc(slug)+'</a> and it will be.'
:'Nothing here matches that. The list only holds repositories above 1,000 stars.';
miss.hidden=false;
}else{miss.hidden=true}
}
document.addEventListener('input',function(e){
if(!e.target||e.target.id!=='lbq')return; q=e.target.value; apply();
});
document.addEventListener('keydown',function(e){
if(!e.target||e.target.id!=='lbq'||e.key!=='Enter')return;
e.preventDefault();
var first=root.querySelector('.reg tbody tr:not([hidden]) .nm a');
if(first){location.href=first.getAttribute('href');return}
var link=root.querySelector('#lbmiss a'); if(link)location.href=link.getAttribute('href');
});
})();`;

function pctOf(n: number, total: number): number {
  return total ? Math.round((n / total) * 100) : 0;
}

function row(r: Row, i: number): string {
  const slug = `${r.owner}/${r.repo}`;
  const mdTitle = r.has_agents_md
    ? "Ships an AGENTS.md"
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
  <td class="gr${r.score < 55 ? " bad" : ""}">${esc(r.grade)}</td>
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
        ? "The class list"
        : "Top of the class";

  const noTest = pctOf(stats.total - stats.withTestCommand, stats.total);

  const body = `
<section style="padding:52px 0 0">
  <h1>${esc(heading)}</h1>
  <p class="lede" style="margin:20px 0 0">Every repository here has at least 1,000 stars and was marked
    against the same scheme. Curated lists, books, and tutorials are marked separately and left out,
    since asking whether an agent can install a list of links means nothing.</p>
</section>

<section class="band" style="border:0;margin-top:44px">
  <div>
    <p class="kicker">The class as a whole</p>
    <div class="nums">
      <div><div class="n">${figure(stats.total)}</div><div class="k">repositories marked</div></div>
      <div><div class="n">${figure(stats.median)}</div><div class="k">median mark out of a hundred</div></div>
      <div><div class="n"><em>${figure(noTest, "%")}</em></div><div class="k">have no test command an agent can find</div></div>
      <div><div class="n">${figure(pctOf(stats.withAgentsMd, stats.total), "%")}</div><div class="k">ship an AGENTS.md</div></div>
    </div>
  </div>
</section>

<section style="padding-top:44px"><div id="lb">
  <div class="lbbar">
    <div class="filters">
      ${tab("best", "Top of the class")}
      ${tab("worst", "Bottom of the class")}
      ${tab("popular", "Most starred")}
    </div>
    <div class="find">
      <input id="lbq" type="search" placeholder="Filter this list"
        aria-label="Filter the class list" spellcheck="false" autocapitalize="off" autocorrect="off">
      <span class="n" id="lbn"></span>
    </div>
  </div>
  ${
    langs.length
      ? `<div class="langs">
    <a class="${!language ? "on" : ""}" href="${qs(sort)}">All</a>
    ${langs.map((l) => `<a class="${language === l.language ? "on" : ""}" href="${qs(sort, l.language)}">${esc(l.language)}</a>`).join("")}
  </div>`
      : ""
  }
  <div class="miss" id="lbmiss" hidden></div>
  ${
    rows.length
      ? `<div class="scroll"><table class="reg">
    <thead><tr><th></th><th>Repository</th><th title="Ships an AGENTS.md">MD</th><th>Language</th>
      <th style="text-align:right">Stars</th><th style="text-align:right">Mark</th><th></th></tr></thead>
    <tbody>${rows.map(row).join("")}</tbody>
  </table></div>`
      : `<p class="lede">Nothing marked yet.${language ? " Try another language." : ""}</p>`
  }
</div></section>

<section class="center">
  <h2>Mark <i>yours</i>.</h2>
  <p class="lede">Two API calls. Nothing cloned, nothing executed, no account.</p>
  ${searchForm()}
</section>`;

  return layout({
    title: language
      ? `${language} repositories ranked by AI agent readiness · ${SITE}`
      : `Which repositories are ready for AI coding agents? · ${SITE}`,
    description: `${stats.total.toLocaleString()} popular open source repositories marked on how well AI coding agents can work in them. The median scores ${stats.median} out of 100, and ${noTest}% have no test command an agent can find.`,
    canonical: language ? `/leaderboard?sort=${sort}&lang=${encodeURIComponent(language)}` : `/leaderboard?sort=${sort}`,
    body,
    extraCss: EXTRA_CSS,
    extraJs: FILTER_JS,
  });
}
