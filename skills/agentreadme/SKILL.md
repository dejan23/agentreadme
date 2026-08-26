---
name: agentreadme
description: Check whether the repository you are working in is set up for an AI agent to work in it, then fix what is missing. Use when an agent is struggling in a codebase, when you cannot find how to install or test a project, when asked to add or improve an AGENTS.md or CLAUDE.md, or when the user asks about agent readiness, onboarding friction, or why Claude Code and Cursor keep flailing here. Also use before opening a repository to other contributors.
version: 0.1.0
license: MIT
---

# agentreadme

Grades a repository on how well an AI coding agent can work in it, then fixes
what it finds. Runs entirely on the local machine, so it works on private code.

The five things it measures, worth 100 marks in total:

| Category | Marks | The question |
|---|---|---|
| Instructions | 27 | Is there an AGENTS.md, and does it name real commands? |
| Setup | 20 | Can an agent install this and run it unattended? |
| Verification loop | 25 | Can an agent check its own work, or is it editing blind? |
| Context economy | 20 | Does the repo fit in a context window, or fight it? |
| Navigability | 10 | How fast can something new orient itself? |

## Step 1 — measure

Run it against the repository root:

```bash
npx --yes agentreadme@latest . --verbose
```

Nothing is uploaded and no network call is made. It grades what `git ls-files`
reports, so untracked build output does not count against the score.

Useful variants:

```bash
npx --yes agentreadme@latest . --json      # machine readable, for reasoning over
npx --yes agentreadme@latest ../other      # a different directory
```

If `npx` is unavailable, say so and stop rather than guessing at a score.

## Step 2 — report what matters, not everything

Give the user the overall mark, the weakest category, and the top two or three
fixes. Do not paste the whole output back at them; they can run it themselves.

Lead with the single most costly thing. A missing test command matters more
than a missing licence, and the tool already orders fixes by severity.

## Step 3 — offer to fix it

This is the part a command line tool cannot do, and the reason this is a skill.
**Offer, then wait.** Do not start editing files because a score was low.

What is usually worth fixing, in order:

**No AGENTS.md, or a weak one.** The largest single category and the cheapest to
fix. Draft one from what the repository actually contains:

```bash
npx --yes agentreadme@latest . --write-agents
```

That writes a draft with real commands read from the project, and leaves an
explicit `TODO` wherever it could not determine something. **Then improve it by
hand**: you have read this codebase and know the two or three conventions a
newcomer always gets wrong. Replace every TODO. A draft left full of TODOs is
worse than no file.

**No discoverable test command.** Add a `test` script, a `test` make target, or
whatever the ecosystem expects, that runs the whole suite with no arguments.
Convention is the interface: an agent tries `npm test` and `make test` before it
reads a CI config.

**Committed build output.** If `dist/`, `build/` or similar is tracked, add it
to `.gitignore` and `git rm -r --cached` it. Generated files poison search, so
an agent greps for a function and edits the compiled copy.

**No environment documentation.** Scan for environment variables the code reads
and write a `.env.example` with safe placeholder values.

**Oversized source files.** Report them, do not split them unprompted. Splitting
a 400KB file is a refactor and needs the user's agreement.

## Step 4 — re-check

After changes, run it again and report the movement:

```bash
npx --yes agentreadme@latest .
```

State the before and after honestly. If the mark did not move, say so.

## Things to get right

- **A low mark is not a judgement about code quality.** It means an agent will
  waste turns. Say it that way.
- **Never invent a command.** If you cannot determine how to run the tests, the
  correct output is a TODO, not a plausible guess. A confidently wrong command
  is worse than an obvious gap, because it fails silently later.
- **Some marks will be wrong**, particularly outside JavaScript and Python. If
  one looks wrong, say so and point at
  <https://github.com/dejan23/agentreadme/issues>. The rubric is open source and
  a pull request settles it.
- **Public repositories** can be checked without installing anything:
  `curl agentreadme.com/OWNER/REPO.txt`
