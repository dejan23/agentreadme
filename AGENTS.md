# AGENTS.md

Grades public GitHub repositories on how well AI coding agents can work in them.
Cloudflare Workers, Hono, D1, server-rendered HTML. No frontend framework.

## Setup

```
bun install
npx wrangler d1 migrations apply agentreadme --local
```

A GitHub token is needed for anything that hits the API. Put it in `.dev.vars`
(gitignored) as `GITHUB_TOKEN=...`. Without it you get 60 requests/hour instead
of 5,000 and the crawler will crawl.

## Commands

```
bun run dev                          # wrangler dev on :8787
bun run typecheck                    # tsc --noEmit, must pass before commit
bun run test                         # vitest
bun run scripts/probe.ts owner/repo  # grade one repo, print the scorecard
bun run scripts/seed.ts --limit 1000 # crawl top repos, write seed/seed.sql
bun run cli .                        # the CLI against this repo
bun run build:cli                    # bundle dist/cli.js for npm
npx wrangler deploy                  # production, from this machine
```

Pushing to `main` deploys through `.github/workflows/deploy.yml`, which runs
typecheck and tests first, applies D1 migrations, then smoke-tests the live
URLs. Deploying by hand is for emergencies; otherwise merge and let CI do it.

`probe.ts` is the fastest way to check a rules change. Run it against a repo you
know before and after.

## Layout

```
src/grade/     the rubric. rules-*.ts hold the checks, detect.ts the signals
src/render/    server-rendered HTML. layout.ts owns the design system
src/github.ts  GitHub client. Two API calls per repo, contents come from the CDN
src/local/     the npx CLI: a filesystem snapshot plus a terminal renderer
skills/        the Claude Code skill, which wraps the CLI and fixes what it finds
src/db.ts      D1 queries and the row shape
scripts/       probe (one repo) and seed (the crawl)
migrations/    D1 schema
```

## Conventions

- **Rules are pure over `RepoSnapshot`.** A rule reads the snapshot and returns a
  `Check`. It never fetches. That is what keeps them testable, and it is why the
  same rules run unchanged in the Worker and in the local CLI.
- **Nothing under `src/grade/` may import from `src/local/`.** The Worker bundle
  must never pull in filesystem code. The local marker lives in `detect.ts` for
  that reason.
- **A local run and a hosted run must agree** on the same repository. The CLI
  grades what `git ls-files` reports, which is what GitHub would return.
- **Never rename a check `id`.** They appear in URLs and anchors.
- **Not-applicable checks set `na: true`** and are excluded from score and max
  alike, so a library is not punished for having no environment config.
- **Every deduction needs `fix` and, where possible, `evidence`.** A score with no
  cited file is a score someone can argue with.
- **Two API calls per repo, maximum.** File contents come from
  raw.githubusercontent, which is CDN-served and does not consume rate limit.
- **`DESIGN.md` is the source of truth for anything visual.** Read it before
  touching `src/render/`. Colours and type live in `layout.ts` only.
- **Writing:** apply the `humanizer` skill to every piece of user-facing copy
  before it ships. That includes page text, check verdicts and fixes, commit
  messages, and release notes. No em dashes, no AI tells, varied natural phrasing.
  Skip it only for code identifiers and internal comments.

## Gotchas

- `wrangler dev` sets a `Cache-Control` header on the homepage. Hard-reload or add
  a cache-busting query param or you will screenshot a stale page.
- The seed crawler resumes from `seed/reports.jsonl`. Delete it to start clean.
- Classifying a repo as software rather than a curated list is genuinely fuzzy.
  See `projectShape()` in `src/grade/detect.ts` before adjusting it, and check the
  change against `awesome-python`, `system-design-primer`, and `freecodecamp`.
- D1 has no `median`. `languageMedians()` uses a window function instead.
