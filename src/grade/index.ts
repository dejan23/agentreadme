import type { Check, Report, RepoSnapshot } from "./types";
import { gradeInstructions } from "./rules-instructions";
import { gradeSetup } from "./rules-setup";
import { gradeVerification } from "./rules-verification";
import { gradeContext, gradeNavigation } from "./rules-context";
import { blobs, projectShape } from "./detect";
import { draftAgentsMd } from "./draft";

export function letterGrade(score: number): string {
  if (score >= 93) return "A+";
  if (score >= 85) return "A";
  if (score >= 78) return "A-";
  if (score >= 70) return "B+";
  if (score >= 62) return "B";
  if (score >= 55) return "B-";
  if (score >= 48) return "C+";
  if (score >= 40) return "C";
  if (score >= 30) return "D";
  return "F";
}

const SEVERITY_RANK: Record<string, number> = { critical: 0, major: 1, minor: 2, polish: 3 };

export function grade(s: RepoSnapshot): Report {
  const categories = [
    gradeInstructions(s),
    gradeSetup(s),
    gradeVerification(s),
    gradeContext(s),
    gradeNavigation(s),
  ];

  const earned = categories.reduce((a, c) => a + c.score, 0);
  const possible = categories.reduce((a, c) => a + c.max, 0);
  const score = Math.round((earned / possible) * 100);

  // Worst first: severity, then raw points on the table.
  const topFixes: Check[] = categories
    .flatMap((c) => c.checks)
    .filter((c) => !c.na && c.fix && c.score < c.max)
    .sort((a, b) => {
      const sa = SEVERITY_RANK[a.severity ?? "polish"] ?? 3;
      const sb = SEVERITY_RANK[b.severity ?? "polish"] ?? 3;
      if (sa !== sb) return sa - sb;
      return b.max - b.score - (a.max - a.score);
    })
    .slice(0, 6);

  const shape = projectShape(s);

  return {
    owner: s.meta.owner,
    repo: s.meta.repo,
    defaultBranch: s.meta.defaultBranch,
    stars: s.meta.stars,
    language: s.meta.language,
    description: s.meta.description,
    sizeKb: s.meta.sizeKb,
    score,
    grade: letterGrade(score),
    categories,
    topFixes,
    truncatedTree: s.truncatedTree,
    fileCount: blobs(s).length,
    gradedAt: new Date().toISOString(),
    isSoftware: shape.isSoftware,
    shapeReason: shape.reason,
    draft: draftAgentsMd(s),
  };
}
