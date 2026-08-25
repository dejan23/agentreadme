export type Severity = "critical" | "major" | "minor" | "polish";

export interface Check {
  /** Stable id, used in URLs and anchors. Never rename these. */
  id: string;
  label: string;
  /** Points earned and available. */
  score: number;
  max: number;
  /** One line the reader sees on the report card. */
  verdict: string;
  /** Shown only when points were lost: what to actually do. */
  fix?: string;
  severity?: Severity;
  /** Not applicable to this kind of project. Excluded from score AND from max. */
  na?: boolean;
  /** Concrete evidence from the repo, so nobody can argue the score is vibes. */
  evidence?: string[];
}

export interface Category {
  id: string;
  label: string;
  blurb: string;
  score: number;
  max: number;
  checks: Check[];
}

export interface Report {
  owner: string;
  repo: string;
  defaultBranch: string;
  stars: number;
  language: string | null;
  description: string | null;
  sizeKb: number;
  score: number;
  grade: string;
  categories: Category[];
  /** Ordered worst-first, the "do these five things" list. */
  topFixes: Check[];
  truncatedTree: boolean;
  fileCount: number;
  gradedAt: string;
}

export interface TreeEntry {
  path: string;
  type: "blob" | "tree" | "commit";
  size?: number;
}

export interface RepoMeta {
  owner: string;
  repo: string;
  defaultBranch: string;
  stars: number;
  language: string | null;
  description: string | null;
  topics: string[];
  license: string | null;
  sizeKb: number;
  archived: boolean;
  fork: boolean;
  pushedAt: string | null;
}

/** Everything a rule is allowed to look at. Rules must be pure over this. */
export interface RepoSnapshot {
  meta: RepoMeta;
  tree: TreeEntry[];
  truncatedTree: boolean;
  /** Lowercased path -> entry, for fast exact lookups. */
  byPath: Map<string, TreeEntry>;
  /** Contents of a handful of small, high-signal files. Keyed by lowercase path. */
  files: Map<string, string>;
}
