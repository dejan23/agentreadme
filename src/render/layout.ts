export const SITE = "agentreadme.com";

const FONTS =
  "https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,300..700;1,6..72,300..600&display=swap";

const CSS = `
*,*::before,*::after{box-sizing:border-box}
:root{
  --paper:#faf6ec; --paper-2:#f1ead9; --paper-3:#e7dec8;
  --ink:#14110d; --ink-2:#4c463a; --ink-3:#847b6b;
  --rule:#d5c9b0; --rule-2:#bdad8d;
  --red:#c81e0f; --red-2:#e04a35;
  --green:#2c6539; --amber:#8d6410;
  --serif:"Newsreader",Georgia,"Times New Roman",serif;
  --mono:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;
}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--paper);color:var(--ink);font-family:var(--serif);
  font-size:18px;line-height:1.62;font-optical-sizing:auto;
  -webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
a{color:var(--ink);text-decoration:underline;text-decoration-color:var(--rule-2);
  text-underline-offset:3px}
a:hover{text-decoration-color:var(--red);color:var(--red)}
code,kbd{font-family:var(--mono);font-size:.84em;background:var(--paper-3);
  padding:1px 5px;border:1px solid var(--rule)}
h1,h2,h3{font-weight:400;letter-spacing:-.01em;line-height:1.2}
.display{font-size:clamp(42px,7.4vw,86px);font-weight:600;line-height:.98;
  letter-spacing:-.035em;margin:0 0 18px}
.display em{font-style:italic;color:var(--red);font-weight:600}
.lede{font-size:clamp(19px,2.1vw,23px);color:var(--ink-2);max-width:34ch;
  margin:0 0 28px;line-height:1.45}
.kicker{font-size:13px;letter-spacing:.22em;text-transform:uppercase;color:var(--ink-3);
  margin:0 0 14px}

/* inverted band: the hard contrast break the page was missing */
.band{background:var(--ink);color:var(--paper);padding:38px 0 34px;
  margin:46px calc(50% - 50vw);padding-left:calc(50vw - 50%);padding-right:calc(50vw - 50%)}
.band>div{max-width:820px;margin:0 auto}
main>.wrap:last-child{padding-bottom:10px}
.band h2{font-size:14px;letter-spacing:.22em;text-transform:uppercase;
  color:#a49a86;margin:0 0 22px;font-weight:400}
.band .nums{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:28px}
.band .n{font-size:clamp(38px,5.4vw,58px);line-height:.95;font-weight:600;
  letter-spacing:-.035em;color:var(--paper)}
.band .n em{color:var(--red-2);font-style:normal}
.band .l{font-size:15px;color:#a49a86;margin-top:9px;font-style:italic;line-height:1.35}
.band a{color:var(--paper);text-decoration-color:#5d5548}
.band a:hover{color:var(--red-2)}
p{margin:0 0 1em}
.wrap{max-width:820px;margin:0 auto;padding:0 26px}
main>.wrap:last-child{padding-bottom:10px}

/* masthead */
.top{border-bottom:2px solid var(--ink);margin-bottom:44px}
.top .inner{display:flex;align-items:baseline;gap:20px;flex-wrap:wrap;
  max-width:820px;margin:0 auto;padding:20px 26px 14px}
.brand{font-size:20px;letter-spacing:.14em;text-transform:uppercase;
  text-decoration:none;font-weight:500}
.brand:hover{color:var(--ink)}
.top nav{margin-left:auto;display:flex;gap:22px;font-size:15px}
.top nav a{text-decoration:none;color:var(--ink-2)}
.top nav a:hover{color:var(--red);text-decoration:underline;text-decoration-color:var(--red)}

/* the sheet: a printed form, not a card */
.sheet{background:#fffdf7;border:2px solid var(--ink);
  box-shadow:0 0 0 1px var(--paper) inset, 3px 3px 0 var(--paper-3);
  padding:34px 38px;margin:0 0 30px}
.sheet-head{display:flex;align-items:flex-start;gap:18px;flex-wrap:wrap;
  border-bottom:1px solid var(--ink);padding-bottom:14px;margin-bottom:22px}
.sheet-title{font-size:15px;letter-spacing:.24em;text-transform:uppercase;color:var(--ink-2)}
.sheet-meta{margin-left:auto;font-size:14px;color:var(--ink-3);letter-spacing:.04em;
  text-transform:uppercase}
.subject{font-size:31px;margin:2px 0 0;letter-spacing:-.015em;word-break:break-word}
.subject .o{color:var(--ink-3)}
.subject-note{color:var(--ink-2);font-size:17px;font-style:italic;margin:6px 0 0}

/* dotted leaders, the signature detail */
.leader{display:flex;align-items:baseline;gap:10px;margin:0 0 11px}
.leader .lbl{flex:none;font-size:18px}
.leader .dots{flex:1;border-bottom:1px dotted var(--rule-2);transform:translateY(-5px);min-width:20px}
.leader .val{flex:none;font-family:var(--mono);font-size:14px;color:var(--ink-3)}
.leader .gr{flex:none;color:var(--red);font-size:24px;font-weight:600;
  min-width:2.1em;text-align:right;letter-spacing:.02em}

/* overall mark, circled the way a teacher circles it */
.overall{display:flex;align-items:center;gap:22px;flex-wrap:wrap;
  border-top:2px solid var(--ink);margin-top:22px;padding-top:20px}
.overall .word{font-size:16px;letter-spacing:.22em;text-transform:uppercase}
.circle{margin-left:auto;flex:none;width:132px;height:132px;border:3px solid var(--red);
  border-radius:50%;display:flex;flex-direction:column;align-items:center;
  justify-content:center;color:var(--red);transform:rotate(-2.5deg)}
.circle .g{font-size:52px;font-weight:600;line-height:1;letter-spacing:-.03em}
.circle .n{font-size:14px;font-family:var(--mono);margin-top:4px;opacity:.75}

/* remarks */
.remarks{border-top:1px solid var(--rule);margin-top:22px;padding-top:18px}
.remarks h3{font-size:14px;letter-spacing:.2em;text-transform:uppercase;
  color:var(--ink-2);margin:0 0 12px}
.remarks ol{margin:0;padding-left:22px}
.remarks li{margin:0 0 13px;color:var(--ink-2)}
.remarks li b{color:var(--ink);font-weight:600}
.remarks li::marker{color:var(--red)}

/* search */
.search{display:flex;gap:0;margin:0 0 10px;border:2px solid var(--ink);background:#fffdf7}
.search input{flex:1;min-width:0;background:transparent;border:0;color:var(--ink);
  padding:18px 18px;font-size:18px;font-family:var(--mono);letter-spacing:-.01em}
.search input::placeholder{color:var(--ink-3)}
.search input:focus{outline:none;background:var(--paper-2)}
.search button{background:var(--ink);color:var(--paper);border:0;padding:18px 30px;
  font-family:var(--serif);font-size:18px;font-weight:500;cursor:pointer;white-space:nowrap;letter-spacing:.02em}
.search button:hover{background:var(--red)}

/* detail tables */
.cat{border-top:1px solid var(--rule);padding:16px 0 4px}
.cat:first-of-type{border-top:0}
.cat>summary{list-style:none;cursor:pointer;display:flex;align-items:baseline;gap:10px}
.cat>summary::-webkit-details-marker{display:none}
.cat>summary:hover .cname{color:var(--red)}
.cname{font-size:20px}
.cat .cpts{flex:none;font-family:var(--mono);font-size:14px;color:var(--ink-3)}
.cat .cgr{flex:none;color:var(--red);font-size:20px;font-weight:600;min-width:2.1em;text-align:right}
.cblurb{color:var(--ink-2);font-size:16px;font-style:italic;margin:4px 0 0}
.checks{margin:14px 0 6px;padding:0 0 0 2px}
.chk{padding:12px 0;border-top:1px dotted var(--rule)}
.chk .row{display:flex;gap:10px;align-items:baseline}
.chk .mark{font-family:var(--mono);flex:none;width:15px;font-weight:700}
.chk .lbl2{font-size:17px}
.chk .sc{margin-left:auto;font-family:var(--mono);font-size:13px;color:var(--ink-3);flex:none}
.chk .verdict{color:var(--ink-2);font-size:16.5px;margin:2px 0 0 25px}
.chk .fix{margin:9px 0 0 25px;padding:0 0 0 14px;border-left:2px solid var(--red);
  font-size:16px;color:var(--ink-2);font-style:italic}
.chk .ev{margin:6px 0 0 25px;font-family:var(--mono);font-size:12.5px;color:var(--ink-3)}
.chk .ev div{overflow-wrap:anywhere}
.pass{color:var(--green)}.part{color:var(--amber)}.fail{color:var(--red)}.skip{color:var(--ink-3)}

.sev{display:inline-block;font-size:11px;font-family:var(--mono);text-transform:uppercase;
  letter-spacing:.08em;padding:1px 6px;margin-left:8px;border:1px solid currentColor;vertical-align:2px}
.sev-critical{color:var(--red)}.sev-major{color:var(--amber)}
.sev-minor{color:var(--ink-3)}.sev-polish{color:var(--ink-3)}

pre{background:var(--paper-2);border:1px solid var(--rule);padding:14px 16px;
  overflow-x:auto;margin:0;font-family:var(--mono);font-size:13px;color:var(--ink-2);line-height:1.5}
pre code{background:none;border:0;padding:0}
.note{color:var(--ink-3);font-size:15px}
.stamp{display:inline-block;border:1.5px solid var(--red);color:var(--red);
  padding:3px 10px;font-size:12px;letter-spacing:.18em;text-transform:uppercase;
  transform:rotate(-3deg)}

.foot{border-top:2px solid var(--ink);margin-top:60px;padding:22px 0 60px;
  color:var(--ink-2);font-size:15px}
.foot p{margin:0 0 .5em}

@media (max-width:640px){
  .band{padding:28px 0 26px;margin:32px 0}
  .band .nums{gap:20px}
  body{font-size:17px}
  .wrap{padding:0 18px}
  .sheet{padding:24px 20px}
  .subject{font-size:25px}
  .circle{width:78px;height:78px}
  .circle .g{font-size:29px}
  .search{flex-direction:column}
  .search button{padding:13px}
}
@media print{
  body{background:#fff}
  .top nav,.search{display:none}
  .sheet{box-shadow:none}
}
`;

export function layout(opts: {
  title: string;
  description: string;
  canonical?: string;
  body: string;
  ogImage?: string;
  /** Page-specific rules appended after the base sheet. */
  extraCss?: string;
  /** Keep thin or low-value pages out of the index. */
  noindex?: boolean;
}): string {
  const { title, description, canonical, body, ogImage, extraCss, noindex } = opts;
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
<header class="top"><div class="inner">
  <a class="brand" href="/">Agent&nbsp;Readme</a>
  <nav><a href="/leaderboard">Class list</a><a href="/what-is-agents-md">AGENTS.md</a><a href="/about">Marking scheme</a></nav>
</div></header>
<main class="wrap">${body}</main>
<footer class="foot"><div class="wrap">
  <p>Every public repository is marked against the same scheme. Nothing is executed, nothing is cloned, and private repositories cannot be graded.</p>
  <p><a href="/about">Marking scheme</a> · <a href="/leaderboard">Class list</a> · <a href="https://github.com/agentreadme">Source</a></p>
</div></footer>
</body></html>`;
}

export function esc(s: string): string {
  return String(s).replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c]!);
}

export function attr(s: string): string {
  return esc(s).replace(/"/g, "&quot;");
}
