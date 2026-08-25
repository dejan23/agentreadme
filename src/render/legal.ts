import { SITE, layout } from "./layout";

const UPDATED = "25 August 2026";

export function privacyPage(): string {
  const body = `
<section style="padding-top:56px">
  <h1>Privacy</h1>
  <p class="lede" style="margin:22px 0 0">Short version: there are no accounts, no cookies, and no
    tracking. We do not know who you are and we are not trying to find out.</p>
  <p class="note" style="margin-top:16px">Last updated ${UPDATED}.</p>
</section>

<section>
  <h2>What we collect</h2>
  <div class="doc" style="margin-top:20px">
    <p><b>Nothing about you.</b> Marking a repository needs a public repository name and nothing
    else. There is no sign-up, no email field, and no profile.</p>
    <p><b>No cookies, and no tracking.</b> This site sets no cookies and embeds no tracking pixels.
    Nothing is stored in your browser.</p>
    <p><b>Counting visits, without identifying you.</b> We use Cloudflare Web Analytics to see how many
    people reach a page and where they came from. It sets no cookies, assigns no identifier, and
    follows nobody between sites or across visits, which is why this page needs no consent banner.
    Google Analytics was considered and rejected for exactly those reasons. If you block the script,
    everything on the site still works.</p>
    <p><b>Marking results are stored.</b> When a public repository is marked we keep the score, the
    category breakdown, and basic repository metadata, so the class list and the per-repository pages
    work. All of it is derived from information GitHub already publishes.</p>
    <p><b>Server logs.</b> Our host, Cloudflare, records standard request information including IP
    address, timestamp, and user agent. That is used to keep the service running and to stop abuse.
    We do not join it to anything else and we do not use it to build a profile of you.</p>
  </div>
</section>

<section>
  <h2>Who else sees a request</h2>
  <div class="doc" style="margin-top:20px">
    <p><b>Cloudflare</b> hosts the site and therefore handles every request.</p>
    <p><b>GitHub</b> receives an API call naming the repository you asked about. It does not receive
    anything about you.</p>
    <p><b>Google Fonts</b> serves the two typefaces this site uses, which means your browser makes a
    request to Google and Google can see your IP address. This is worth knowing. If it bothers you,
    say so and we will self-host the fonts instead, which removes the request entirely.</p>
  </div>
</section>

<section>
  <h2>Private repositories</h2>
  <div class="doc" style="margin-top:20px">
    <p>Cannot be marked here, at all. The token this service uses can only read public repositories,
    so there is no path by which private code reaches us. If a repository is private, or becomes
    private, marking it simply fails.</p>
    <p><b>For private code there is a command line tool</b>, <code>npx agentreadme</code>, which runs
    the same checks on your own machine. It sends nothing anywhere, and that is checkable rather than
    a promise: the published binary imports only <code>fs</code>, <code>path</code>, and
    <code>child_process</code>, contains no HTTP client or sockets at all, and works with your network
    switched off. The <a href="https://www.npmjs.com/package/agentreadme">package</a> and its
    <a href="https://github.com/dejan23/agentreadme/blob/main/src/local/cli.ts">source</a> are public,
    so you can read it before you run it.</p>
    <p>If a public repository of yours has been marked and you would rather it were not listed, ask
    and we will remove it.</p>
  </div>
</section>

<section>
  <h2>Changes</h2>
  <div class="doc" style="margin-top:20px">
    <p>If this ever changes in a way that matters, particularly if analytics are ever added, this
    page will be updated and the date at the top will move. Nothing here is retroactive.</p>
    <p>Questions go to <a href="https://x.com/dejansto_">@dejansto_</a>.</p>
  </div>
</section>`;

  return layout({
    title: `Privacy · ${SITE}`,
    description:
      "No accounts, no cookies, no analytics, no tracking. What agentreadme.com stores when it marks a repository, and who else sees a request.",
    canonical: "/privacy",
    body,
  });
}

export function termsPage(): string {
  const body = `
<section style="padding-top:56px">
  <h1>Terms</h1>
  <p class="lede" style="margin:22px 0 0">A free tool, offered as is. Use it, put the badge in your
    README, argue with the marks. Do not try to knock it over.</p>
  <p class="note" style="margin-top:16px">Last updated ${UPDATED}.</p>
</section>

<section>
  <h2>What this service is</h2>
  <div class="doc" style="margin-top:20px">
    <p>${SITE} reads public information about a GitHub repository and applies a fixed, published set
    of checks to it. No code is executed and no repository is cloned.</p>
    <p><b>A mark is an opinion, not a fact.</b> The scheme is deliberately opinionated, the detection
    is imperfect, and it misses things, particularly outside JavaScript and Python. A low mark is not
    a judgement of the people who wrote the code, and a high one is not a guarantee of anything.
    Do not use these scores as the sole basis for a hiring, procurement, or security decision.</p>
    <p>The scheme changes as it improves, which means a mark can move without the repository
    changing. Every version of the rules is public in the source.</p>
  </div>
</section>

<section>
  <h2>Using it</h2>
  <div class="doc" style="margin-top:20px">
    <p><b>The badge is yours to use.</b> Put it in any repository, including commercial ones, at no
    cost and with no attribution requirement beyond the link the badge already carries.</p>
    <p><b>Reasonable use.</b> Automated bulk scraping, deliberate attempts to exhaust the rate limit,
    or anything intended to degrade the service for other people is not on. Requests may be
    throttled or blocked if they look like that.</p>
    <p><b>No uptime promise.</b> This is a free service run by one person. It may be slow, it may be
    down, and it may stop existing. Do not build anything load-bearing on top of it without a
    fallback.</p>
  </div>
</section>

<section>
  <h2>Liability</h2>
  <div class="doc" style="margin-top:20px">
    <p>The service is provided as is, without warranty of any kind, express or implied. To the extent
    the law allows, we are not liable for any loss arising from using it or from being unable to use
    it. Where the law does not allow a limitation, the limitation does not apply to you.</p>
  </div>
</section>

<section>
  <h2>Not affiliated</h2>
  <div class="doc" style="margin-top:20px">
    <p>${SITE} is an independent project. It is not affiliated with, endorsed by, or sponsored by
    GitHub, Microsoft, Anthropic, Cursor, or any other company whose products it happens to mention.
    All trademarks belong to their respective owners, and repository names are used descriptively to
    identify the repository being marked.</p>
  </div>
</section>

<section>
  <h2>Contact</h2>
  <div class="doc" style="margin-top:20px">
    <p>Corrections, removal requests, and complaints about a mark all go to the same place:
    <a href="https://x.com/dejansto_">@dejansto_</a>, or a pull request against the rules.</p>
  </div>
</section>`;

  return layout({
    title: `Terms · ${SITE}`,
    description:
      "agentreadme.com is a free tool offered as is. What a mark means, what it does not mean, how the badge may be used, and the limits of liability.",
    canonical: "/terms",
    body,
  });
}
