import type { Category, Check, RepoSnapshot } from "./types";
import { tally } from "./tally";
import { ARTIFACT_DIRS, blobs, file, has, isSource } from "./detect";

const KB = 1024;

export function gradeContext(s: RepoSnapshot): Category {
  const checks: Check[] = [];
  const all = blobs(s);
  const sources = all.filter((e) => isSource(e.path));

  // --- Committed build artifacts ---
  const offenders: string[] = [];
  for (const { dir, label } of ARTIFACT_DIRS) {
    const hit = all.find((e) => e.path.toLowerCase().startsWith(dir) || e.path.toLowerCase().includes(`/${dir}`));
    if (hit) offenders.push(label);
  }
  checks.push({
    id: "artifacts",
    label: "No committed build output",
    score: offenders.length === 0 ? 6 : offenders.length === 1 ? 3 : 0,
    max: 6,
    severity: offenders.length === 0 ? undefined : offenders.length > 1 ? "major" : "minor",
    verdict:
      offenders.length === 0
        ? "No generated directories committed."
        : `Generated output is committed: ${offenders.join(", ")}.`,
    fix:
      offenders.length === 0
        ? undefined
        : "Add these to .gitignore and `git rm -r --cached` them. Generated files pollute search results, so an agent grepping for a function finds the compiled copy and edits the wrong file.",
  });

  // --- .gitignore ---
  const gi = file(s, ".gitignore");
  const giLines = gi ? gi.split("\n").filter((l) => l.trim() && !l.trim().startsWith("#")).length : 0;
  checks.push({
    id: "gitignore",
    label: ".gitignore hygiene",
    score: giLines >= 5 ? 3 : giLines > 0 ? 2 : 0,
    max: 3,
    severity: giLines >= 5 ? undefined : "minor",
    verdict:
      giLines === 0
        ? "No .gitignore."
        : giLines < 5
          ? `.gitignore has only ${giLines} rules.`
          : `.gitignore covers ${giLines} patterns.`,
    fix: giLines >= 5 ? undefined : "Start from a standard template for your stack. It prevents the previous problem before it happens.",
  });

  // --- Oversized files ---
  const big = sources.filter((e) => (e.size ?? 0) > 100 * KB).sort((a, b) => (b.size ?? 0) - (a.size ?? 0));
  const huge = sources.filter((e) => (e.size ?? 0) > 300 * KB);
  let sizeScore = 6;
  if (huge.length) sizeScore = 0;
  else if (big.length > 3) sizeScore = 2;
  else if (big.length) sizeScore = 4;
  checks.push({
    id: "file-size",
    label: "File sizes fit in context",
    score: sizeScore,
    max: 6,
    severity: sizeScore === 6 ? undefined : huge.length ? "major" : "minor",
    verdict:
      big.length === 0
        ? "No source file is large enough to crowd out a context window."
        : `${big.length} source ${big.length === 1 ? "file is" : "files are"} over 100KB.`,
    fix:
      big.length === 0
        ? undefined
        : "A single file that fills the context window forces an agent to work from fragments, and it will confidently edit code it never saw. Splitting the worst offenders pays for itself immediately.",
    evidence: big.slice(0, 3).map((e) => `${e.path} — ${Math.round((e.size ?? 0) / KB)}KB`),
  });

  // --- Overall repo weight ---
  const kb = s.meta.sizeKb;
  let repoScore = 5;
  if (kb > 500_000) repoScore = 0;
  else if (kb > 150_000) repoScore = 2;
  else if (kb > 50_000) repoScore = 4;
  checks.push({
    id: "repo-size",
    label: "Repository weight",
    score: repoScore,
    max: 5,
    severity: repoScore >= 4 ? undefined : "minor",
    verdict:
      kb > 150_000
        ? `About ${(kb / 1000).toFixed(0)}MB checked out. Large enough that cloning and searching are both slow.`
        : `About ${kb >= 1000 ? `${(kb / 1000).toFixed(1)}MB` : `${kb}KB`} checked out, which is comfortable.`,
    fix:
      repoScore >= 4
        ? undefined
        : "Large binaries and vendored trees slow every operation an agent performs. Git LFS or a separate assets repo keeps the working tree navigable.",
    evidence: s.truncatedTree ? [`File tree exceeded GitHub's limit, so ${s.tree.length.toLocaleString()} entries were sampled`] : undefined,
  });

  return tally("context", "Context economy", "Whether the repo fits in a context window, or fights it.", checks);
}

export function gradeNavigation(s: RepoSnapshot): Category {
  const checks: Check[] = [];
  const all = blobs(s);

  // --- Docs ---
  const docs = all.filter((e) => /^(docs?|documentation)\//i.test(e.path));
  const mdCount = all.filter((e) => /\.mdx?$/i.test(e.path)).length;
  const docScore = docs.length >= 3 ? 4 : docs.length > 0 || mdCount >= 3 ? 2 : 0;
  checks.push({
    id: "docs",
    label: "Written documentation",
    score: docScore,
    max: 4,
    severity: docScore >= 2 ? undefined : "minor",
    verdict: docs.length
      ? `A docs/ directory with ${docs.length} files.`
      : mdCount >= 3
        ? `${mdCount} markdown files, but no docs/ directory.`
        : "Almost no prose documentation.",
    fix: docScore >= 4 ? undefined : "Prose that explains why the architecture is the way it is saves an agent from re-deriving it wrong.",
  });

  // --- Repo metadata: description + topics ---
  const hasDesc = !!s.meta.description && s.meta.description.length > 10;
  const hasTopics = s.meta.topics.length >= 2;
  const metaScore = (hasDesc ? 2 : 0) + (hasTopics ? 1 : 0);
  checks.push({
    id: "repo-meta",
    label: "Repository description",
    score: metaScore,
    max: 3,
    severity: metaScore >= 2 ? undefined : "polish",
    verdict: hasDesc ? "The repo describes itself in one line." : "No repository description set.",
    fix: hasDesc && hasTopics ? undefined : "Set the description and a few topics. It's the first context anything gets, and it takes ten seconds.",
  });

  // --- License ---
  const lic = s.meta.license && s.meta.license !== "NOASSERTION";
  checks.push({
    id: "license",
    label: "License",
    score: lic ? 3 : 0,
    max: 3,
    severity: lic ? undefined : "minor",
    verdict: lic ? `Licensed ${s.meta.license}.` : "No license detected.",
    fix: lic ? undefined : "Without a license nobody can safely reuse this, and some tools will refuse to work with it at all.",
  });

  return tally("navigation", "Navigability", "How quickly anything new can orient itself.", checks);
}
