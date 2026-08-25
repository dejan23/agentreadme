import { SITE, esc, layout } from "./layout";

export const REPO = "https://github.com/dejan23/agentreadme";

/**
 * A GitHub issue pre-filled with the repository and its marks.
 *
 * Someone who thinks a mark is wrong is the most valuable person to hear from,
 * and the difference between hearing from them and not is usually the blank
 * issue form. This fills it in.
 */
export function disputeUrl(slug: string, score: number, grade: string, weakest?: string): string {
  const title = `Mark looks wrong: ${slug} scored ${score}/100`;
  const body = [
    `**Repository:** https://github.com/${slug}`,
    `**Report:** https://${SITE}/${slug}`,
    `**Mark:** ${score}/100 (${grade})`,
    weakest ? `**Category in question:** ${weakest}` : "",
    "",
    "### Which check is wrong",
    "",
    "<!-- The report names a check for every deduction. Which one, and what did it miss? -->",
    "",
    "### What it should have found",
    "",
    "<!-- The file, setting, or command it did not detect. -->",
    "",
  ]
    .filter((l) => l !== "")
    .join("\n");
  return `${REPO}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}&labels=${encodeURIComponent("wrong mark")}`;
}

export function feedbackPage(): string {
  const body = `
<section style="padding-top:56px">
  <h1>Tell us it is <i>wrong</i></h1>
  <p class="lede" style="margin:22px 0 0">This marks other people's work, so being correctable matters
    more than being right. Every deduction names the file it came from, which means a disagreement can
    always be settled by looking rather than arguing.</p>
</section>

<section class="two">
  <div>
    <h2 style="font-size:30px">A mark is <i>wrong</i></h2>
    <p class="lede" style="font-size:17px;margin:16px 0 20px">The most useful thing you can send. The
      rubric misses things, particularly outside JavaScript and Python, and every miss is a rule
      somebody can fix.</p>
    <p><a href="${REPO}/issues/new?labels=wrong+mark">Open an issue</a></p>
  </div>
  <div>
    <p style="color:var(--ink-2)">Every report page has a link that opens an issue already filled in
      with the repository, its mark, and its weakest category. Use that one if you are looking at a
      report, because it saves you writing any of it out.</p>
    <p style="color:var(--ink-2)">What helps most: which check was wrong, and the file or setting it
      failed to find. The rules live in
      <a href="${REPO}/tree/main/src/grade">src/grade</a> and each one is a small pure function, so a
      pull request is usually a handful of lines.</p>
  </div>
</section>

<section class="two">
  <div>
    <h2 style="font-size:30px">Something is <i>broken</i></h2>
    <p class="lede" style="font-size:17px;margin:16px 0 20px">A page that will not load, a repository
      that will not mark, a badge stuck on an old score.</p>
    <p><a href="${REPO}/issues/new?labels=bug">Report a bug</a></p>
  </div>
  <div>
    <p style="color:var(--ink-2)">Include the URL. If a mark looks stale, add <code>?refresh=1</code> to
      the report URL first, which forces a re-mark and fixes it more often than not.</p>
  </div>
</section>

<section class="two">
  <div>
    <h2 style="font-size:30px">Everything <i>else</i></h2>
    <p class="lede" style="font-size:17px;margin:16px 0 20px">Ideas, disagreements with the whole
      premise, or a repository you think should be on the class list.</p>
    <p><a href="https://x.com/dejansto_">@dejansto_</a> or a
      <a href="${REPO}/discussions">discussion</a>.</p>
  </div>
  <div>
    <p style="color:var(--ink-2)">Requests to remove a public repository from the class list are always
      honoured, no reason needed. Ask either way.</p>
  </div>
</section>

<section class="two">
  <div><h2 style="font-size:30px">What we will not <i>argue</i> about</h2></div>
  <div style="color:var(--ink-2);font-size:16.5px">
    <p><b style="color:var(--ink)">Whether a low mark means bad code.</b> It does not, and the site says
    so. It means an agent will waste turns, which is a different claim.</p>
    <p><b style="color:var(--ink)">Whether the scheme should exist.</b> Reasonable people disagree, and
    that is a conversation for a thread rather than an issue. Individual rules are where the useful
    argument lives.</p>
  </div>
</section>`;

  return layout({
    title: `Feedback · ${SITE}`,
    description:
      "A mark that looks wrong is the most useful thing you can send. Every deduction names the file it came from, so a disagreement can be settled by looking rather than arguing.",
    canonical: "/feedback",
    ogImage: "/og/default.png",
    body,
  });
}
