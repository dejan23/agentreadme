# CLAUDE.md

Read `AGENTS.md` first. It is the canonical instruction file for this repository
and everything about setup, commands, layout, and conventions lives there.

This file exists only for rules specific to working here with Claude Code.

## Writing

Apply the `humanizer` skill to **all** user-facing text, every time, without being
asked. That covers page copy, the verdict and fix strings in `src/grade/rules-*.ts`,
`DESIGN.md`, README text, commit messages, PR descriptions, and anything written
for launch.

No em dashes. No AI tells. Vary sentence length and phrasing. Say the thing
plainly. Run the pass before the text ships, not after.

The only exemptions are code identifiers and comments meant for us.

This matters more here than on most projects: the product's whole claim is that
it is rigorous and worth trusting. Copy that reads as machine-generated
undermines the rubric it is describing.

## Design

`DESIGN.md` is binding. Read it before changing anything under `src/render/`.
Do not introduce colours, fonts, or spacing values outside the tokens in
`src/render/layout.ts`.

## Dogfooding

This repository is graded by its own tool. Before shipping a change that touches
setup, tests, or documentation, run it:

```
bun run scripts/probe.ts <owner>/agentreadme
```

If our own mark drops, fix that before merging.
