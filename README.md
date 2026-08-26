# agentreadme

[![agent ready](https://agentreadme.com/badge/dejan23/agentreadme.svg)](https://agentreadme.com/dejan23/agentreadme)
[![CI](https://github.com/dejan23/agentreadme/actions/workflows/ci.yml/badge.svg)](https://github.com/dejan23/agentreadme/actions/workflows/ci.yml)

Grades any public GitHub repository on how well AI coding agents can work in it.

**[agentreadme.com](https://agentreadme.com)**

The badge above is this repository's own mark, from the same rubric everyone
else gets. We would have no business scoring anyone else otherwise.

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

## Private repos

The hosted site cannot read private repositories, and it never will. Run the
rubric locally instead:

```
npx agentreadme
```

Same checks, same scoring, in your terminal. **Nothing is uploaded. No account,
no token, no network call at all.** It works on private repos, monorepos,
uncommitted work, and code that was never pushed anywhere.

```
npx agentreadme                 grade the current directory
npx agentreadme --verbose       every check, not just the categories
npx agentreadme --write-agents  draft an AGENTS.md from what is here
npx agentreadme --min 70        exit non-zero below 70, for CI
npx agentreadme --json          the full report as JSON
```

It grades what git tracks, so a local run and the hosted one agree on the same
repository. Stars, description, and topics belong to GitHub rather than to a
checkout, so those checks are marked not applicable off-platform instead of
costing you marks you cannot earn.

## As a Claude Code skill

Let the agent check the repo it is working in, and fix what it finds:

As a plugin:

```
/plugin marketplace add dejan23/agentreadme
/plugin install agentreadme
```

Or drop the file in by hand:

```
mkdir -p ~/.claude/skills/agentreadme
curl -o ~/.claude/skills/agentreadme/SKILL.md \
  https://raw.githubusercontent.com/dejan23/agentreadme/main/skills/agentreadme/SKILL.md
```

Then ask it to check the repository, or say `/agentreadme`.

Agents that can reach the web need none of this. Any public repository is
readable with one request, and `agentreadme.com/llms.txt` describes the rest:

```
curl agentreadme.com/OWNER/REPO.txt
```

The skill is the part a CLI cannot do. It measures, reports the two or three
things costing the most, offers to fix them, and re-checks. Drafting the
AGENTS.md is only half the job: the draft leaves a `TODO` wherever it could not
determine something, and an agent that has read your codebase can fill those in.

## As an MCP server

For agents outside Claude Code, or anywhere a skill file is not an option, the
same engine is a remote MCP server:

```
https://agentreadme.com/mcp
```

Streamable HTTP, no key, nothing to install. Claude Code:

```
claude mcp add --transport http agentreadme https://agentreadme.com/mcp
```

Cursor, Claude Desktop, and anything else that reads a config file:

```json
{
  "mcpServers": {
    "agentreadme": { "url": "https://agentreadme.com/mcp" }
  }
}
```

Three tools: `grade_repository` marks a public repo and names the fixes,
`draft_agents_md` returns a ready-to-save AGENTS.md built from what the repo
actually contains, and `agent_readiness_findings` gives the study numbers so a
score has something to sit against.

It reads public repositories only, which is the same promise the website makes.
Private code stays with `npx agentreadme`.

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

Across the 864 most-starred software repositories on GitHub:

- Median score **61/100**
- **38%** have no test command an agent can find
- **32%** ship an `AGENTS.md`
- Instructions is the weakest category by a distance, averaging **39%**

Median by language: TypeScript 71, Go 70, Rust 63, Python 60, JavaScript 60,
Java 44, C++ 42, C 38.

## The badge

```markdown
[![agent ready](https://agentreadme.com/badge/OWNER/REPO.svg)](https://agentreadme.com/OWNER/REPO)
```

It re-checks daily. Add `?refresh=1` to any report URL to force a re-mark.

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

## Install

```
bun install
cp .dev.vars.example .dev.vars     # add a GitHub token with no scopes
bunx wrangler d1 migrations apply agentreadme --local
```

## Usage

```
bun run dev                          # local server on :8787
bun run test                         # 21 tests, no network
bun run typecheck
bun run scripts/probe.ts honojs/hono # grade one repo in the terminal
```

See [AGENTS.md](AGENTS.md) for the full set of commands and conventions.

## Licence

MIT
