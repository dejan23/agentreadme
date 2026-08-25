import { describe, expect, it } from "vitest";
import { layout } from "../layout";
import { leaderboardPage } from "../leaderboard";
import { homePage } from "../static-pages";

/**
 * Inline scripts live inside template literals, where a backslash has to be
 * doubled. Getting that wrong ships a page whose script throws on parse and
 * silently does nothing. These pull the real emitted script out of the real
 * HTML and make sure it parses.
 */
function scripts(html: string): string[] {
  return [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
}

const STATS = { total: 851, median: 62, withAgentsMd: 280, withAnyAgentDoc: 340, withTestCommand: 536 };

const PAGES: Array<[string, string]> = [
  ["home", homePage(undefined, STATS)],
  [
    "leaderboard",
    leaderboardPage({ rows: [], stats: STATS, sort: "best", langs: [{ language: "Rust", n: 40 }] }),
  ],
  ["bare layout", layout({ title: "t", description: "d", body: "<p>x</p>" })],
];

describe("inline scripts", () => {
  for (const [name, html] of PAGES) {
    it(`parses on ${name}`, () => {
      const found = scripts(html);
      expect(found.length).toBeGreaterThan(0);
      for (const src of found) {
        // Throws SyntaxError on a malformed script, which is the whole point.
        expect(() => new Function(src), src.slice(0, 120)).not.toThrow();
      }
    });
  }

  it("never closes the script tag from inside a string", () => {
    for (const [, html] of PAGES) {
      for (const src of scripts(html)) expect(src).not.toContain("</script");
    }
  });
});
