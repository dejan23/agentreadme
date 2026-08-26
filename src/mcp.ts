import { McpServer } from "@modelcontextprotocol/server";
import { createMcpHandler } from "agents/mcp/server";
import { z } from "zod";
import { storedReport, saveReport } from "./db";
import { grade } from "./grade";
import { GitHubError, snapshot } from "./github";
import { reportText } from "./render/text";
import type { Env } from "./index";

/**
 * The same grading engine, exposed over MCP.
 *
 * Deliberately read-only and unauthenticated. Every tool here reads public
 * information that anyone can already fetch, so there is nothing to protect and
 * no reason to make people sign in to use it. Private repositories are not
 * reachable from here at all, which is the same guarantee the website makes.
 */

const FRESH_MS = 24 * 60 * 60 * 1000;

const OWNER = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/;
const REPO = /^(?!\.\.?$)[A-Za-z0-9._-]{1,100}$/;

const text = (s: string) => ({ content: [{ type: "text" as const, text: s }] });

/** One place for the "that is not a repo" and "GitHub said no" answers. */
function problem(message: string) {
  return { ...text(message), isError: true as const };
}

/**
 * Same throttle the website uses, and for the same reason: the GitHub token is
 * shared, so a client looping over repository names could drain it for everyone.
 * Only the path that actually calls GitHub is limited; cached reads are free.
 */
async function mayCallGitHub(env: Env, ip: string): Promise<boolean> {
  if (!env.GRADE_LIMIT) return true;
  try {
    const { success } = await env.GRADE_LIMIT.limit({ key: `mcp:${ip}` });
    return success;
  } catch {
    return true;
  }
}

async function reportFor(env: Env, ip: string, owner: string, repo: string) {
  if (!OWNER.test(owner) || !REPO.test(repo)) {
    return { error: "Not a valid GitHub owner and repository name." };
  }

  // A repo marked in the last day is served from storage, so repeated calls
  // cost no GitHub quota. Same cache the website uses.
  if (env.DB) {
    const stored = await storedReport(env.DB, owner, repo).catch(() => null);
    if (stored && stored.ageMs < FRESH_MS) return { report: stored.report };
  }

  if (!(await mayCallGitHub(env, ip))) {
    return { error: "Too many new repositories from this address. Try again in a minute." };
  }

  try {
    const report = grade(await snapshot(owner, repo, env.GITHUB_TOKEN));
    if (env.DB) await saveReport(env.DB, report).catch(() => {});
    return { report };
  } catch (e) {
    const err = e instanceof GitHubError ? e : null;
    if (err?.status === 404) {
      return {
        error:
          `${owner}/${repo} was not found, or it is private. This server can only read public ` +
          `repositories. For private code, run the same checks locally with "npx agentreadme", ` +
          `which uploads nothing and makes no network calls.`,
      };
    }
    return { error: err?.message ?? "Could not mark that repository." };
  }
}

function createServer(env: Env, ip: string) {
  const server = new McpServer({ name: "agentreadme", version: "0.1.0" });

  server.registerTool(
    "grade_repository",
    {
      description:
        "Score a public GitHub repository on how well an AI coding agent can work in it. " +
        "Returns a mark out of 100 across five categories (instructions, setup, verification " +
        "loop, context economy, navigability) plus the specific fixes that would help most. " +
        "Use this when an agent is struggling in a codebase, or to check a repository before " +
        "working in it. Nothing is cloned and no code is executed.",
      inputSchema: {
        owner: z.string().describe("GitHub owner or organisation, for example 'honojs'"),
        repo: z.string().describe("Repository name, for example 'hono'"),
      },
    },
    async ({ owner, repo }) => {
      const r = await reportFor(env, ip, owner, repo);
      return r.error ? problem(r.error) : text(reportText(r.report!));
    },
  );

  server.registerTool(
    "draft_agents_md",
    {
      description:
        "Draft an AGENTS.md for a public GitHub repository, built from what the repository " +
        "actually contains: the install command implied by its lockfile, the commands it already " +
        "declares, its real directory layout, and the specific problems found while grading it. " +
        "Anything that cannot be determined is left as an explicit TODO rather than guessed. " +
        "Returns markdown ready to save at the repository root.",
      inputSchema: {
        owner: z.string().describe("GitHub owner or organisation"),
        repo: z.string().describe("Repository name"),
      },
    },
    async ({ owner, repo }) => {
      const r = await reportFor(env, ip, owner, repo);
      return r.error ? problem(r.error) : text(r.report!.draft);
    },
  );

  server.registerTool(
    "agent_readiness_findings",
    {
      description:
        "The published study behind the scoring: what the 864 most-starred software repositories " +
        "on GitHub scored, which categories fail most often, and how the medians differ by " +
        "language. Use this for context on whether a particular mark is good or bad.",
      inputSchema: {},
    },
    async () =>
      text(
        [
          "# Agent readiness across the 864 most-starred software repos on GitHub",
          "Measured 25 August 2026. Curated lists, books, and tutorials excluded.",
          "",
          "- Median score 61 of 100. Only 2% scored an A.",
          "- 38% have no test command an agent can discover.",
          "- 60% carry no agent instructions of any kind.",
          "- Instructions is the weakest category, averaging 39% of available marks.",
          "  Navigability averages 83%.",
          "- Repos shipping an AGENTS.md have a median of 78 against 54 without. That is",
          "  correlation, not causation: teams that write the file already had a lockfile",
          "  and runnable tests.",
          "",
          "Median by language: TypeScript 71, Go 70, Rust 63, Python 60, JavaScript 60,",
          "Java 44, C++ 42, C 38.",
          "",
          "Full study: https://agentreadme.com/findings",
        ].join("\n"),
      ),
  );

  return server;
}

/** Streamable HTTP at /mcp. SSE is deprecated, so it is not offered. */
export function mcpHandler(request: Request, env: Env, ctx: unknown): Promise<Response> {
  // Hono's ExecutionContext and the SDK's disagree on a field the handler never
  // reads, so the cast is the honest way through rather than a type gymnastic.
  const ip = request.headers.get("cf-connecting-ip") ?? "unknown";
  return createMcpHandler(() => createServer(env, ip))(request, env, ctx as never) as Promise<Response>;
}
