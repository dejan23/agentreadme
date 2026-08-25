import type { RepoMeta, RepoSnapshot, TreeEntry } from "./grade/types";

const API = "https://api.github.com";
const RAW = "https://raw.githubusercontent.com";
const UA = "agentreadme.com (+https://agentreadme.com)";

export class GitHubError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

/**
 * Small, high-signal files we pull in full. Fetched from raw.githubusercontent,
 * which is CDN-served and does NOT consume API rate limit — so the whole grade
 * costs exactly two authenticated API calls regardless of how many we read.
 */
const WANTED_FILES = [
  "AGENTS.md",
  "CLAUDE.md",
  ".cursorrules",
  ".github/copilot-instructions.md",
  "README.md",
  "package.json",
  ".gitignore",
  "Makefile",
  "justfile",
  "Taskfile.yml",
  "tsconfig.json",
  "pyproject.toml",
  "setup.cfg",
  "Cargo.toml",
  "go.mod",
  "pytest.ini",
  "tox.ini",
  "CONTRIBUTING.md",
];

/** Never pull a "small" file that turns out to be enormous. */
const MAX_FILE_BYTES = 96 * 1024;

function headers(token?: string): Record<string, string> {
  const h: Record<string, string> = {
    "User-Agent": UA,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

async function api(path: string, token?: string): Promise<Response> {
  const res = await fetch(`${API}${path}`, { headers: headers(token) });
  if (res.status === 404) throw new GitHubError("Repository not found, or it's private.", 404);
  if (res.status === 403 || res.status === 429) {
    const remaining = res.headers.get("x-ratelimit-remaining");
    if (remaining === "0") throw new GitHubError("GitHub rate limit reached. Try again shortly.", 429);
    throw new GitHubError("GitHub refused the request.", 403);
  }
  if (!res.ok) throw new GitHubError(`GitHub returned ${res.status}.`, res.status);
  return res;
}

export async function fetchMeta(owner: string, repo: string, token?: string): Promise<RepoMeta> {
  const res = await api(`/repos/${owner}/${repo}`, token);
  const j = (await res.json()) as any;
  return {
    owner: j.owner?.login ?? owner,
    repo: j.name ?? repo,
    defaultBranch: j.default_branch ?? "main",
    stars: j.stargazers_count ?? 0,
    language: j.language ?? null,
    description: j.description ?? null,
    topics: j.topics ?? [],
    license: j.license?.spdx_id ?? null,
    sizeKb: j.size ?? 0,
    archived: !!j.archived,
    fork: !!j.fork,
    pushedAt: j.pushed_at ?? null,
  };
}

export async function fetchTree(
  owner: string,
  repo: string,
  branch: string,
  token?: string,
): Promise<{ tree: TreeEntry[]; truncated: boolean }> {
  const res = await api(`/repos/${owner}/${repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`, token);
  const j = (await res.json()) as any;
  const tree: TreeEntry[] = (j.tree ?? []).map((e: any) => ({
    path: e.path as string,
    type: e.type as TreeEntry["type"],
    size: typeof e.size === "number" ? e.size : undefined,
  }));
  return { tree, truncated: !!j.truncated };
}

async function fetchRaw(owner: string, repo: string, branch: string, path: string): Promise<string | null> {
  const url = `${RAW}/${owner}/${repo}/${encodeURIComponent(branch)}/${path}`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) return null;
  const len = Number(res.headers.get("content-length") ?? "0");
  if (len > MAX_FILE_BYTES) return null;
  const text = await res.text();
  return text.length > MAX_FILE_BYTES ? text.slice(0, MAX_FILE_BYTES) : text;
}

export async function snapshot(owner: string, repo: string, token?: string): Promise<RepoSnapshot> {
  const meta = await fetchMeta(owner, repo, token);
  const { tree, truncated } = await fetchTree(meta.owner, meta.repo, meta.defaultBranch, token);

  const byPath = new Map<string, TreeEntry>();
  for (const e of tree) byPath.set(e.path.toLowerCase(), e);

  // Resolve each wanted file against the tree so we fetch its REAL casing.
  // raw.githubusercontent is case-sensitive, and plenty of repos ship
  // "Readme.md" or "makefile" — asking for the canonical spelling 404s.
  const wanted = WANTED_FILES.map((want) => byPath.get(want.toLowerCase()));

  // A root readme under any spelling: README.md, Readme.rst, readme.txt, README.
  const rootReadme = tree.find((e) => e.type === "blob" && /^readme(\.(md|markdown|rst|txt))?$/i.test(e.path));
  if (rootReadme) wanted.push(rootReadme);

  const seen = new Set<string>();
  const present = wanted.filter((e): e is TreeEntry => {
    if (!e || e.type !== "blob" || (e.size ?? 0) > MAX_FILE_BYTES) return false;
    if (seen.has(e.path)) return false;
    seen.add(e.path);
    return true;
  });

  const results = await Promise.all(
    present.map(async (e) => [e.path.toLowerCase(), await fetchRaw(meta.owner, meta.repo, meta.defaultBranch, e.path)] as const),
  );

  const files = new Map<string, string>();
  for (const [p, body] of results) if (body !== null) files.set(p, body);

  return { meta, tree, truncatedTree: truncated, byPath, files };
}
