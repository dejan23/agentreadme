export const SITE = "agentreadme.com";

const FONTS =
  "https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;700&display=swap";

/** See DESIGN.md. Colours, type scale, and components all live there first. */
const CSS = `
*,*::before,*::after{box-sizing:border-box}
:root{
  --bg:#fff; --ink:#0A0A0A; --ink-2:#525252; --ink-3:#8A8A8A;
  --rule:#E5E5E5; --track:#F6F6F6;
  --acc:#FF3D00; --acc-t:#D62E00;
  --sans:"Archivo",ui-sans-serif,system-ui,sans-serif;
  --mono:"JetBrains Mono",ui-monospace,SFMono-Regular,Menlo,monospace;
}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--ink);font-family:var(--sans);
  font-size:16px;line-height:1.5;-webkit-font-smoothing:antialiased}
a{color:inherit;text-decoration:underline;text-decoration-color:var(--rule);text-underline-offset:3px}
a:hover{color:var(--acc-t);text-decoration-color:var(--acc)}
code,kbd{font-family:var(--mono);font-size:.86em;background:var(--track);padding:1px 5px}
h1,h2,h3{font-weight:800;margin:0}
h1{font-size:clamp(38px,6.2vw,66px);line-height:.93;letter-spacing:-.022em}
h2{font-size:clamp(30px,4.4vw,44px);line-height:.98;letter-spacing:-.025em}
h1 i,h2 i{font-style:normal;color:var(--acc)}
p{margin:0 0 1em}
.wrap{max-width:1180px;margin:0 auto;padding:0 32px}
.lede{font-size:19px;color:var(--ink-2);max-width:46ch;line-height:1.5}
.lede b{color:var(--ink);font-weight:600}
.note{font-size:14.5px;color:var(--ink-3)}
.kicker{font-size:13px;font-weight:700;letter-spacing:.02em;color:var(--ink-3);
  text-transform:uppercase;margin:0 0 16px}

/* masthead */
.announce{background:var(--ink);color:#fff;font-size:14px;padding:9px 0;text-align:center;font-weight:500}
.announce a{color:#fff;text-decoration-color:#5a5a5a}
.announce a:hover{color:var(--acc)}
.top{border-bottom:1px solid var(--rule)}
.top .inner{display:flex;align-items:center;gap:26px;flex-wrap:wrap;
  max-width:1180px;margin:0 auto;padding:15px 32px}
.brand{font-weight:800;font-size:20px;letter-spacing:-.035em;text-decoration:none}
.brand i{font-style:normal;color:var(--acc)}
.top nav{margin-left:auto;display:flex;gap:22px}
.top nav a{font-size:15px;color:var(--ink-2);text-decoration:none;font-weight:500}
.top nav a:hover{color:var(--acc-t)}

/* search: the primary action everywhere */
.search{display:flex;border:2px solid var(--ink);max-width:560px;margin:0 0 11px}
.search input{flex:1;min-width:0;border:0;padding:14px 15px;font-family:var(--mono);
  font-size:15px;background:transparent;color:var(--ink)}
.search input::placeholder{color:var(--ink-3)}
.search input:focus{outline:none;background:var(--track)}
.search button{border:0;background:var(--ink);color:#fff;font-family:var(--sans);
  font-weight:700;font-size:15px;padding:14px 26px;cursor:pointer}
.search button:hover{background:var(--acc)}

/* bars */
.bar{display:grid;grid-template-columns:128px 1fr 34px;gap:12px;align-items:center;margin-bottom:10px}
.bar .n{font-size:13.5px;font-weight:500;color:var(--ink-2)}
.bar .t{background:var(--track);height:26px;position:relative}
.bar .t i{position:absolute;inset:0 auto 0 0;background:var(--ink)}
.bar .v{font-family:var(--mono);font-size:12.5px;color:var(--ink-2);text-align:right;
  font-variant-numeric:tabular-nums}
.bar .t i{transform-origin:left center;animation:grow .75s cubic-bezier(.22,.8,.24,1) both}
@keyframes grow{from{transform:scaleX(0)}to{transform:scaleX(1)}}
.bar.hot .t i{background:var(--acc)}
.bar.hot .n,.bar.hot .v{color:var(--acc-t);font-weight:700}

/* panel: the evidence box beside an argument */
.panel{border:1px solid var(--rule);padding:26px 28px 22px}
.panel h3{font-size:15px;margin:0 0 3px}
.panel .cap{font-size:13.5px;color:var(--ink-3);margin:0 0 18px}
.panel .foot{font-size:12.5px;color:var(--ink-3);margin:14px 0 0;
  border-top:1px solid var(--rule);padding-top:11px}

/* full-bleed dark band */
.band{background:var(--ink);color:#fff;padding:52px 0;
  margin-left:calc(50% - 50vw);margin-right:calc(50% - 50vw);
  padding-left:calc(50vw - 50%);padding-right:calc(50vw - 50%)}
.band>div{max-width:1180px;margin:0 auto}
.band h2{color:#fff}
.band .kicker{color:#A3A3A3;margin-bottom:26px}
.band .nums{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:36px}
.band .n{font-size:clamp(46px,6vw,72px);font-weight:800;letter-spacing:-.035em;line-height:.92}
.band .n em{font-style:normal;color:var(--acc)}
.band .k{font-size:15.5px;color:#A3A3A3;margin-top:10px;max-width:26ch;line-height:1.4}
.band a{color:#fff;text-decoration-color:#5a5a5a}
.band a:hover{color:var(--acc)}

/* code / report block */
pre{background:var(--ink);color:#F2F2F2;padding:20px 22px;margin:0;overflow-x:auto;
  font-family:var(--mono);font-size:13.5px;line-height:1.65}
pre b{color:var(--acc);font-weight:400}
pre s{text-decoration:none;color:#8A8A8A}
pre code{background:none;padding:0;font-size:inherit}

/* section rhythm */
section{padding:56px 0}
section+section{border-top:1px solid var(--rule)}
.two{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.15fr);gap:56px;align-items:start}
/* Text sections: heading spans, prose runs in a measured column. Using .two
   here left half the page empty, since a three-word heading cannot hold a
   50% column. */
/* The one centred moment: the closing call to action. Everything else stays
   left aligned. */
.center{text-align:center}
.center .lede{margin:18px auto 24px;max-width:52ch}
.center .search{margin-left:auto;margin-right:auto}
.center h2{max-width:22ch;margin-left:auto;margin-right:auto}
.doc{max-width:68ch}
.doc>p{font-size:16.5px;color:var(--ink-2)}
.doc>p b{color:var(--ink)}
.doc h2{margin-bottom:18px}
.cols{columns:2;column-gap:48px}
.cols>p{break-inside:avoid;margin-bottom:1.1em}
@media (max-width:820px){.cols{columns:1}}
.hero{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.06fr);gap:52px;align-items:start;padding:60px 0 54px}

/* report scorecard rows */
.cat{border-top:1px solid var(--rule);padding:18px 0 6px}
.cat>summary{list-style:none;cursor:pointer;display:flex;align-items:baseline;gap:12px}
.cat>summary::-webkit-details-marker{display:none}
.cat>summary:hover .cname{color:var(--acc-t)}
.cname{font-size:21px;font-weight:700;letter-spacing:-.015em}
.cpts{margin-left:auto;font-family:var(--mono);font-size:13px;color:var(--ink-3)}
.cgr{font-family:var(--mono);font-size:20px;font-weight:700;min-width:2.4em;text-align:right}
.cgr.bad{color:var(--acc-t)}
.cblurb{color:var(--ink-2);font-size:15.5px;margin:6px 0 0;max-width:70ch}
.checks{margin:14px 0 4px}
.chk{padding:13px 0;border-top:1px solid var(--rule)}
.chk .row{display:flex;gap:10px;align-items:baseline}
.chk .mark{font-family:var(--mono);flex:none;width:15px;font-weight:700}
.chk .lbl{font-weight:600;font-size:16.5px}
.chk .sc{margin-left:auto;font-family:var(--mono);font-size:12.5px;color:var(--ink-3)}
.chk .verdict{color:var(--ink-2);font-size:16px;margin:3px 0 0 25px}
.chk .fix{margin:9px 0 0 25px;padding:11px 14px;background:var(--track);
  border-left:3px solid var(--acc);font-size:15.5px;color:var(--ink-2)}
.chk .ev{margin:7px 0 0 25px;font-family:var(--mono);font-size:12.5px;color:var(--ink-3)}
.chk .ev div{overflow-wrap:anywhere}
.pass{color:var(--ink)}.part{color:var(--ink-2)}.fail{color:var(--acc)}.skip{color:var(--ink-3)}
.sev{display:inline-block;font-size:11px;font-family:var(--mono);text-transform:uppercase;
  letter-spacing:.06em;padding:1px 6px;margin-left:8px;border:1px solid currentColor;vertical-align:2px}
.sev-critical,.sev-major{color:var(--acc-t)}
.sev-minor,.sev-polish{color:var(--ink-3)}

footer{border-top:1px solid var(--rule);padding:30px 0 64px;color:var(--ink-3);
  font-size:14.5px;text-align:center}
footer p{margin:0 0 .6em;max-width:74ch;margin-left:auto;margin-right:auto}

@media (prefers-reduced-motion:reduce){
  *,*::before,*::after{animation:none!important;transition:none!important}
}
@media (max-width:900px){
  .hero,.two{grid-template-columns:1fr;gap:34px}
}
@media (max-width:640px){
  .wrap{padding:0 20px}
  .top .inner{padding:14px 20px;gap:16px}
  .top nav{gap:14px;width:100%;margin-left:0}
  section{padding:40px 0}
  .search{flex-direction:column}
  .band{padding:38px 0}
}
`;

export function layout(opts: {
  title: string;
  description: string;
  canonical?: string;
  body: string;
  ogImage?: string;
  extraCss?: string;
  noindex?: boolean;
  /** Optional announcement strip, used to carry the launch finding. */
  announce?: string;
  /** Page-specific script, appended after the shared one. */
  extraJs?: string;
}): string {
  const { title, description, canonical, body, ogImage, extraCss, noindex, announce, extraJs } = opts;
  const url = canonical ? `https://${SITE}${canonical}` : `https://${SITE}`;
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<meta name="description" content="${attr(description)}">
<link rel="canonical" href="${url}">
${noindex ? '<meta name="robots" content="noindex,follow">' : ""}
<meta property="og:type" content="website">
<meta property="og:title" content="${attr(title)}">
<meta property="og:description" content="${attr(description)}">
<meta property="og:url" content="${url}">
<meta property="og:site_name" content="${SITE}">
<meta name="twitter:card" content="${ogImage ? "summary_large_image" : "summary"}">
${ogImage ? `<meta property="og:image" content="https://${SITE}${ogImage}">\n<meta name="twitter:image" content="https://${SITE}${ogImage}">` : ""}
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
<style>${CSS}${extraCss ?? ""}</style>
</head><body>
${announce ? `<div class="announce">${announce}</div>` : ""}
<header class="top"><div class="inner">
  <a class="brand" href="/">agent<i>readme</i></a>
  <nav><a href="/leaderboard">Class list</a><a href="/what-is-agents-md">AGENTS.md</a><a href="/about">Marking scheme</a></nav>
</div></header>
<main class="wrap">${body}</main>
<footer><div class="wrap">
  <p>Every public repository is marked against the same scheme. Nothing is cloned, nothing is executed, and private repositories cannot be marked.</p>
  <p><a href="/about">Marking scheme</a> · <a href="/leaderboard">Class list</a> · <a href="https://github.com/agentreadme">Source</a> · <a href="/privacy">Privacy</a> · <a href="/terms">Terms</a></p>
  <p style="margin-top:14px">Built by <a href="https://x.com/dejansto_" rel="me">@dejansto_</a></p>
</div></footer>
<script>${COUNT_JS}${extraJs ?? ""}</script>
</body></html>`;
}

/**
 * Counts figures up to their value on first view. The final value is already in
 * the HTML, so this is pure enhancement: crawlers and no-JS readers see the real
 * number, and anyone who asked for reduced motion keeps it.
 */
const COUNT_JS = `(function(){
if(!window.IntersectionObserver||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
var els=[].slice.call(document.querySelectorAll('[data-count]'));if(!els.length)return;
els.forEach(function(el){el.textContent='0'+(el.getAttribute('data-suffix')||'');});
var io=new IntersectionObserver(function(es){es.forEach(function(e){
if(!e.isIntersecting)return;io.unobserve(e.target);
var el=e.target,to=parseFloat(el.getAttribute('data-count'))||0,
sf=el.getAttribute('data-suffix')||'',t0=0;
function step(t){if(!t0)t0=t;var p=Math.min(1,(t-t0)/900);
el.textContent=Math.round(to*(1-Math.pow(1-p,3)))+sf;
if(p<1)requestAnimationFrame(step);}
requestAnimationFrame(step);});},{threshold:.35});
els.forEach(function(el){io.observe(el);});
})();`;

/** A figure that counts up on first view, correct in the HTML either way. */
export function figure(value: number, suffix = ""): string {
  return `<span data-count="${value}" data-suffix="${attr(suffix)}">${value}${esc(suffix)}</span>`;
}

export function esc(s: string): string {
  return String(s).replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c]!);
}

export function attr(s: string): string {
  return esc(s).replace(/"/g, "&quot;");
}

/** Shared bar row, used by the homepage chart and the leaderboard. */
export function barRow(label: string, pct: number, value: string, hot = false, index = 0): string {
  const w = Math.max(0, Math.min(100, pct));
  return `<div class="bar${hot ? " hot" : ""}">
  <span class="n">${esc(label)}</span>
  <span class="t"><i style="width:${w}%;animation-delay:${index * 55}ms"></i></span>
  <span class="v">${esc(value)}</span>
</div>`;
}
