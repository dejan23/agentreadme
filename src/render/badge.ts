/**
 * Shields-style SVG badge. Hand-rolled rather than proxied to shields.io so it
 * stays fast, has no third-party dependency, and can't break someone's README
 * if an external service goes down.
 */

const GRADE_COLORS: Array<[number, string]> = [
  [85, "#2f9e44"],
  [70, "#66a80f"],
  [55, "#f08c00"],
  [40, "#e8590c"],
  [0, "#c92a2a"],
];

export function colorFor(score: number): string {
  for (const [floor, color] of GRADE_COLORS) if (score >= floor) return color;
  return "#c92a2a";
}

/** Approximate Verdana advance width; good enough to center text in a badge. */
function textWidth(s: string): number {
  let w = 0;
  for (const ch of s) {
    if (/[A-Z]/.test(ch)) w += 8;
    else if (/[il1.:'\/ ]/.test(ch)) w += 3.5;
    else if (/[mw]/.test(ch)) w += 9;
    else w += 6.6;
  }
  return Math.ceil(w);
}

function esc(s: string): string {
  return s.replace(/[<>&"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

export function badgeSvg(label: string, value: string, color: string): string {
  const PAD = 10;
  const lw = textWidth(label) + PAD * 2;
  const vw = textWidth(value) + PAD * 2;
  const w = lw + vw;
  const lx = (lw / 2) * 10;
  const vx = (lw + vw / 2) * 10;

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="20" role="img" aria-label="${esc(label)}: ${esc(value)}">
<title>${esc(label)}: ${esc(value)}</title>
<linearGradient id="s" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient>
<clipPath id="r"><rect width="${w}" height="20" rx="3" fill="#fff"/></clipPath>
<g clip-path="url(#r)">
<rect width="${lw}" height="20" fill="#555"/>
<rect x="${lw}" width="${vw}" height="20" fill="${color}"/>
<rect width="${w}" height="20" fill="url(#s)"/>
</g>
<g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="110">
<text aria-hidden="true" x="${lx}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="${(lw - PAD * 2) * 10}">${esc(label)}</text>
<text x="${lx}" y="140" transform="scale(.1)" textLength="${(lw - PAD * 2) * 10}">${esc(label)}</text>
<text aria-hidden="true" x="${vx}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="${(vw - PAD * 2) * 10}">${esc(value)}</text>
<text x="${vx}" y="140" transform="scale(.1)" textLength="${(vw - PAD * 2) * 10}">${esc(value)}</text>
</g>
</svg>`;
}

export function gradeBadge(score: number, grade: string): string {
  return badgeSvg("agent ready", `${score}/100 ${grade}`, colorFor(score));
}

export function errorBadge(text = "unknown"): string {
  return badgeSvg("agent ready", text, "#9e9e9e");
}
