# agentreadme

Grades any public GitHub repository on how well AI coding agents can work in it.

[agentreadme.com](https://agentreadme.com)

When Claude Code or Cursor flails in a codebase, everyone blames the model.
Usually it is the repository. There is no test command the agent can find, or
`dist/` is committed so search returns the compiled copy, or one file is 400KB
and the agent ends up editing code it never read.

This measures that, and tells you what to fix first.

```
$ curl agentreadme.com/honojs/hono.txt

# honojs/hono — 72/100 · B+

✗ Instructions              3/27   F
  None found. Every agent that opens this repo starts from zero.
✓ Setup                    14/14   A+
✓ Verification loop        24/25   A+
✓ Context economy          18/20   A
✓ Navigability             10/10   A+
```

## What it measures

| Category | Marks | The question |
|---|---|---|
| Instructions | 27 | Is there an AGENTS.md, and does it name real commands? |
| Setup | 20 | Can an agent install this and run it unattended? |
| Verification loop | 25 | Can an agent check its own work, or is it editing blind? |
| Context economy | 20 | Does the repo fit in a context window, or fight it? |
| Navigability | 10 | How fast can something new orient itself? |

Checks that do not apply to a project are excluded from the score **and** from
the maximum, so a library is not punished for having no environment config.
Curated lists, books, and tutorials are marked but kept off the leaderboard,
since asking whether an agent can install a list of links means nothing.

## Findings

Across the 851 most-starred software repositories on GitHub:

- Median score **62/100**
- **37%** have no test command an agent can find
- **33%** ship an `AGENTS.md`
- Instructions is the weakest category by a distance, averaging **39%**

Median by language: TypeScript 72, Go 70, Rust 64, JavaScript 61, Python 60,
Java 43, C++ 42, C 38.

## The badge

```markdown
[![agent ready](https://agentreadme.com/badge/OWNER/REPO.svg)](https://agentreadme.com/OWNER/REPO)
```

It re-marks on every request, so it stays honest as the repository changes.

## How it works

Two authenticated GitHub API calls per repository: one for metadata, one for the
full file tree. File contents come from `raw.githubusercontent.com`, which is
CDN-served and does not consume rate limit. **No code is executed and no
repository is cloned.** Private repositories cannot be marked at all.

Everything runs on Cloudflare Workers with D1 and server-rendered HTML.

## If a mark is wrong

Some will be. The scheme is opinionated and the detection misses things,
particularly outside JavaScript and Python. The rules live in
[`src/grade/`](src/grade/) and each one is a pure function over a snapshot, so
adding a case is small. A pull request beats an argument.

## Development

See [AGENTS.md](AGENTS.md) for setup, commands, and conventions.

```
bun install
bun run test
bun run scripts/probe.ts honojs/hono
```

## Licence

MIT
