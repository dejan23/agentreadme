import { existsSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { grade } from "../grade";
import { renderReport } from "./render";
import { localSnapshot } from "./snapshot";

const HELP = `agentreadme — how well can an AI coding agent work in this repo?

  npx agentreadme [dir]

Runs entirely on your machine. Nothing is uploaded, no account, no token,
no network call. Works on private repositories, monorepos, uncommitted
work, and code that was never pushed anywhere.

Options
  --verbose, -v     every individual check, not just the categories
  --json            the full report as JSON
  --write-agents    write the drafted AGENTS.md to the directory
  --min <score>     exit non-zero below this score, for CI
  --no-color        plain output
  --help, -h        this

Examples
  npx agentreadme                    grade the current directory
  npx agentreadme ../other-project
  npx agentreadme --write-agents     draft an AGENTS.md from what is here
  npx agentreadme --min 70           fail a build under 70
`;

function main(): void {
  const argv = process.argv.slice(2);
  if (argv.includes("--help") || argv.includes("-h")) {
    process.stdout.write(HELP);
    return;
  }

  const flag = (n: string) => argv.includes(n);
  const value = (n: string) => {
    const i = argv.indexOf(n);
    return i >= 0 ? argv[i + 1] : undefined;
  };

  const dir = resolve(argv.find((a) => !a.startsWith("-") && argv[argv.indexOf(a) - 1] !== "--min") ?? ".");
  if (!existsSync(dir)) {
    process.stderr.write(`No such directory: ${dir}\n`);
    process.exit(2);
  }

  const report = grade(localSnapshot(dir));

  if (flag("--json")) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    // Colour only for a terminal, so piping to a file stays readable.
    const colour = !flag("--no-color") && process.stdout.isTTY === true && !process.env.NO_COLOR;
    process.stdout.write(renderReport(report, { colour, verbose: flag("--verbose") || flag("-v") }));
  }

  if (flag("--write-agents")) {
    const target = resolve(dir, "AGENTS.md");
    if (existsSync(target) && !flag("--force")) {
      process.stderr.write(`AGENTS.md already exists. Pass --force to overwrite it.\n`);
      process.exit(2);
    }
    writeFileSync(target, report.draft);
    process.stdout.write(`  Wrote ${target}\n\n`);
  }

  const min = Number(value("--min"));
  if (Number.isFinite(min) && report.score < min) {
    process.stderr.write(`Score ${report.score} is below the required ${min}.\n`);
    process.exit(1);
  }
}

main();
