import type { Category, Check, RepoSnapshot } from "./types";
import { tally } from "./tally";
import { file, has, readme } from "./detect";

const AGENT_FILES = [
  { path: "AGENTS.md", label: "AGENTS.md", points: 12 },
  { path: "CLAUDE.md", label: "CLAUDE.md", points: 9 },
  { path: ".github/copilot-instructions.md", label: "Copilot instructions", points: 8 },
  { path: ".cursorrules", label: ".cursorrules", points: 7 },
];

/** Commands an agent needs to find. Loose on purpose — we want signal, not grammar. */
const COMMAND_HINTS = /\b(npm|pnpm|yarn|bun|make|just|cargo|go|uv|poetry|pytest|python|docker|mvn|gradle|dotnet)\b[^\n]{0,60}\b(run|test|build|install|start|dev|lint|check|fmt)\b/i;

function scoreInstructionQuality(body: string): { points: number; notes: string[]; gaps: string[] } {
  const notes: string[] = [];
  const gaps: string[] = [];
  let points = 0;

  const len = body.trim().length;
  if (len < 200) {
    gaps.push("it's under 200 characters, which is closer to a placeholder than instructions");
  } else if (len > 20000) {
    gaps.push(`it's ${(len / 1000).toFixed(0)}k characters, which burns context on every single turn`);
    points += 2;
  } else {
    points += 4;
    notes.push(`${len.toLocaleString()} characters, a workable length`);
  }

  if (COMMAND_HINTS.test(body)) {
    points += 4;
    notes.push("names the actual commands to run");
  } else {
    gaps.push("it never states a build, test, or run command");
  }

  if (/^#{1,3}\s/m.test(body)) {
    points += 2;
    notes.push("uses headings, so an agent can skim it");
  } else {
    gaps.push("has no headings to structure it");
  }

  if (/```/.test(body)) {
    points += 2;
    notes.push("includes copyable code blocks");
  } else {
    gaps.push("has no code blocks");
  }

  return { points, notes, gaps };
}

export function gradeInstructions(s: RepoSnapshot): Category {
  const checks: Check[] = [];

  // --- Does an agent instruction file exist at all? ---
  const found = AGENT_FILES.filter((f) => has(s, f.path));
  const primary = found[0];

  if (!primary) {
    checks.push({
      id: "agents-file",
      label: "Agent instruction file",
      score: 0,
      max: 12,
      severity: "critical",
      verdict: "None found. Every agent that opens this repo starts from zero.",
      fix: "Add an AGENTS.md at the root: what the project is, how to install, how to run, how to test, and the two or three conventions a newcomer always gets wrong.",
      evidence: ["Looked for AGENTS.md, CLAUDE.md, .github/copilot-instructions.md, .cursorrules"],
    });
  } else {
    const others = found.slice(1).map((f) => f.label);
    checks.push({
      id: "agents-file",
      label: "Agent instruction file",
      score: primary.points,
      max: 12,
      verdict:
        primary.path === "AGENTS.md"
          ? "AGENTS.md is present, which is the format the most tools read."
          : `${primary.label} is present, but not the vendor-neutral AGENTS.md.`,
      fix:
        primary.path === "AGENTS.md"
          ? undefined
          : `Rename or symlink to AGENTS.md so tools other than one vendor's can read it. Keeping ${primary.label} alongside it costs nothing.`,
      severity: primary.path === "AGENTS.md" ? undefined : "minor",
      evidence: others.length ? [`Also found: ${others.join(", ")}`] : undefined,
    });
  }

  // --- Is it any good? ---
  const body = primary ? file(s, primary.path) : null;
  if (!body) {
    checks.push({
      id: "instruction-quality",
      label: "Instruction quality",
      score: 0,
      max: 12,
      severity: primary ? "major" : "critical",
      verdict: primary
        ? "The file exists but couldn't be read for scoring."
        : "Nothing to judge, since there are no instructions.",
      fix: "Instructions earn their keep by naming exact commands. 'Run the tests with `pnpm test`' beats three paragraphs of philosophy.",
    });
  } else {
    const { points, notes, gaps } = scoreInstructionQuality(body);
    checks.push({
      id: "instruction-quality",
      label: "Instruction quality",
      score: points,
      max: 12,
      severity: points >= 10 ? undefined : points >= 6 ? "minor" : "major",
      verdict:
        points >= 10
          ? "Specific enough that an agent can act on it."
          : points >= 6
            ? "Real instructions, with gaps."
            : "Present but too thin to change an agent's behavior.",
      fix: gaps.length ? `Worth fixing: ${gaps.join("; ")}.` : undefined,
      evidence: notes.length ? notes : undefined,
    });
  }

  // --- README as the fallback entry point ---
  const rm = readme(s);
  const rmLen = rm?.trim().length ?? 0;
  const hasInstall = rm ? /(^|\n)#{1,4}[^\n]*(install|getting started|quick ?start|setup|usage)/i.test(rm) : false;
  let rmScore = 0;
  if (rmLen > 0) rmScore += 1;
  if (rmLen >= 400) rmScore += 1;
  if (hasInstall) rmScore += 1;
  checks.push({
    id: "readme-entry",
    label: "README as an entry point",
    score: rmScore,
    max: 3,
    severity: rmScore >= 2 ? undefined : "major",
    verdict:
      rmLen === 0
        ? "No README. This is the first file anything reads, human or machine."
        : hasInstall
          ? "README has a clear getting-started section."
          : "README exists but never explains how to get the thing running.",
    fix:
      rmScore >= 3
        ? undefined
        : "Give the README an Install and a Usage heading with real commands under each. Agents pattern-match on those headings.",
  });

  return tally("instructions", "Instructions", "Whether the repo tells an agent how to behave before it starts guessing.", checks);
}
