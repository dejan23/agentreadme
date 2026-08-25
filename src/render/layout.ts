export const SITE = "agentreadme.com";

const CSS = `
*,*::before,*::after{box-sizing:border-box}
:root{
  --bg:#0b0d10; --panel:#12151a; --panel-2:#171b21; --line:#232830;
  --ink:#e8ecf1; --ink-2:#a3adbb; --ink-3:#6b7684;
  --accent:#7cc4ff; --accent-dim:#1d3a52;
  --good:#5bc57a; --ok:#b5cf4e; --warn:#f0a63a; --bad:#f0603a; --crit:#f04a4a;
  --mono:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;
  --sans:-apple-system,BlinkMacSystemFont,"Segoe UI",Inter,Roboto,Helvetica,Arial,sans-serif;
  --radius:10px;
}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--ink);font-family:var(--sans);
  font-size:16px;line-height:1.6;-webkit-font-smoothing:antialiased}
a{color:var(--accent);text-decoration:none}
a:hover{text-decoration:underline}
code,kbd{font-family:var(--mono);font-size:.88em}
.wrap{max-width:960px;margin:0 auto;padding:0 20px}

/* header */
.top{border-bottom:1px solid var(--line);padding:18px 0;margin-bottom:40px}
.top .wrap{display:flex;align-items:center;gap:16px;flex-wrap:wrap}
.brand{font-weight:640;letter-spacing:-.02em;color:var(--ink);font-size:17px}
.brand span{color:var(--accent)}
.top nav{margin-left:auto;display:flex;gap:20px;font-size:14px}
.top nav a{color:var(--ink-2)}

/* search */
.search{display:flex;gap:8px;margin:0 0 12px}
.search input{flex:1;min-width:0;background:var(--panel);border:1px solid var(--line);
  color:var(--ink);padding:13px 15px;border-radius:var(--radius);font-size:15px;font-family:var(--mono)}
.search input:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-dim)}
.search button{background:var(--accent);color:#06121c;border:0;padding:13px 22px;
  border-radius:var(--radius);font-weight:640;font-size:15px;cursor:pointer;white-space:nowrap}
.search button:hover{filter:brightness(1.08)}

/* score header */
.head{display:flex;gap:28px;align-items:center;flex-wrap:wrap;
  background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:26px 28px;margin-bottom:14px}
.dial{flex:none;position:relative;width:118px;height:118px}
.dial svg{transform:rotate(-90deg)}
.dial .num{position:absolute;inset:0;display:flex;flex-direction:column;
  align-items:center;justify-content:center;gap:0}
.dial .n{font-size:34px;font-weight:680;letter-spacing:-.03em;line-height:1}
.dial .g{font-size:13px;color:var(--ink-2);font-weight:600;margin-top:3px}
.head h1{margin:0 0 6px;font-size:25px;letter-spacing:-.02em;font-weight:640;word-break:break-word}
.head h1 .owner{color:var(--ink-3);font-weight:500}
.head .desc{color:var(--ink-2);margin:0 0 12px;font-size:15px}
.facts{display:flex;gap:16px;flex-wrap:wrap;font-size:13px;color:var(--ink-3);font-family:var(--mono)}

/* categories */
.cat{border:1px solid var(--line);border-radius:12px;margin-bottom:12px;overflow:hidden;background:var(--panel)}
.cat>summary{list-style:none;cursor:pointer;padding:16px 20px;display:flex;
  align-items:center;gap:14px;flex-wrap:wrap}
.cat>summary::-webkit-details-marker{display:none}
.cat>summary:hover{background:var(--panel-2)}
.cat .name{font-weight:600;font-size:16px}
.cat .pts{margin-left:auto;font-family:var(--mono);font-size:14px;color:var(--ink-2);flex:none}
.bar{height:5px;border-radius:3px;background:var(--line);overflow:hidden;flex-basis:100%;order:3}
.bar i{display:block;height:100%;border-radius:3px}
.cat .blurb{order:4;flex-basis:100%;font-size:13.5px;color:var(--ink-3);margin-top:-2px}
.checks{border-top:1px solid var(--line);padding:4px 20px 14px}
.chk{padding:14px 0;border-bottom:1px dashed var(--line)}
.chk:last-child{border-bottom:0}
.chk .row{display:flex;gap:10px;align-items:baseline}
.chk .mark{font-family:var(--mono);flex:none;width:16px;font-weight:700}
.chk .lbl{font-weight:600;font-size:15px}
.chk .sc{margin-left:auto;font-family:var(--mono);font-size:13px;color:var(--ink-3);flex:none}
.chk .verdict{color:var(--ink-2);font-size:14.5px;margin:3px 0 0 26px}
.chk .fix{margin:8px 0 0 26px;padding:10px 13px;background:var(--panel-2);
  border-left:2px solid var(--warn);border-radius:0 6px 6px 0;font-size:14px;color:var(--ink-2)}
.chk .ev{margin:6px 0 0 26px;font-family:var(--mono);font-size:12.5px;color:var(--ink-3)}
.chk .ev div{overflow-wrap:anywhere}
.pass{color:var(--good)}.part{color:var(--warn)}.fail{color:var(--bad)}.skip{color:var(--ink-3)}

/* fixes */
.fixes{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:6px 24px 20px;margin-bottom:28px}
.fixes h2{font-size:17px;margin:20px 0 4px}
.fixes ol{margin:0;padding-left:22px}
.fixes li{margin:14px 0;color:var(--ink-2);font-size:15px}
.fixes li b{color:var(--ink);font-weight:600}
.sev{display:inline-block;font-size:11px;font-family:var(--mono);text-transform:uppercase;
  letter-spacing:.05em;padding:2px 7px;border-radius:20px;margin-left:8px;vertical-align:1px}
.sev-critical{background:#3a1618;color:#ff8b8b}
.sev-major{background:#3a2410;color:#ffb469}
.sev-minor{background:#2a2b16;color:#d8dd7a}
.sev-polish{background:#1d2530;color:#9db4cc}

/* badge box */
.badge-box{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:22px 24px;margin-bottom:28px}
.badge-box h2{margin:0 0 6px;font-size:17px}
.badge-box p{color:var(--ink-2);font-size:14.5px;margin:0 0 14px}
.badge-box img{vertical-align:middle;margin-bottom:14px}
pre{background:#0a0c0f;border:1px solid var(--line);border-radius:8px;padding:14px;
  overflow-x:auto;margin:0;font-family:var(--mono);font-size:13px;color:var(--ink-2)}

h2{letter-spacing:-.015em}
.foot{border-top:1px solid var(--line);margin-top:56px;padding:26px 0 60px;
  color:var(--ink-3);font-size:14px}
.foot a{color:var(--ink-2)}
.note{color:var(--ink-3);font-size:13px}
@media (max-width:620px){
  .head{padding:22px 18px;gap:20px}
  .head h1{font-size:21px}
  .search{flex-direction:column}
  .dial{width:96px;height:96px}
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
<style>${CSS}${extraCss ?? ""}</style>
</head><body>
<header class="top"><div class="wrap">
  <a class="brand" href="/">agent<span>readme</span></a>
  <nav><a href="/leaderboard">Leaderboard</a><a href="/what-is-agents-md">AGENTS.md</a><a href="/about">How it scores</a></nav>
</div></header>
<main class="wrap">${body}</main>
<footer class="foot"><div class="wrap">
  <p>${SITE} grades public repositories on how well they work with AI coding agents. Two API calls, no code execution, nothing stored from private repos.</p>
  <p><a href="/about">How scoring works</a> · <a href="/leaderboard">Leaderboard</a> · <a href="https://github.com/agentreadme">GitHub</a></p>
</div></footer>
</body></html>`;
}

export function esc(s: string): string {
  return String(s).replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c]!);
}

export function attr(s: string): string {
  return esc(s).replace(/"/g, "&quot;");
}
