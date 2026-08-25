import { describe, expect, it } from "vitest";
import { parseRepo } from "../index";

describe("parseRepo", () => {
  it("accepts the plain form", () => {
    expect(parseRepo("honojs/hono")).toEqual({ owner: "honojs", repo: "hono" });
  });

  it("accepts what people actually paste", () => {
    const want = { owner: "honojs", repo: "hono" };
    expect(parseRepo("https://github.com/honojs/hono")).toEqual(want);
    expect(parseRepo("http://www.github.com/honojs/hono")).toEqual(want);
    expect(parseRepo("https://github.com/honojs/hono.git")).toEqual(want);
    expect(parseRepo("git@github.com:honojs/hono.git")).toEqual(want);
    expect(parseRepo("  honojs/hono/  ")).toEqual(want);
  });

  it("keeps dots inside a repo name", () => {
    expect(parseRepo("expressjs/express.js")).toEqual({ owner: "expressjs", repo: "express.js" });
  });

  it("rejects anything that is not a repository", () => {
    for (const bad of ["", "   ", "honojs", "/hono", "honojs/", "a/b/c/d"]) {
      expect(parseRepo(bad), bad).toBeNull();
    }
  });

  it("refuses our own routes so they cannot be shadowed", () => {
    for (const reserved of ["about/x", "leaderboard/x", "badge/x", "privacy/x", "terms/x"]) {
      expect(parseRepo(reserved), reserved).toBeNull();
    }
  });

  it("refuses path traversal and injection shapes", () => {
    for (const bad of ["../../etc/passwd", "a b/c", "<script>/x", "own er/repo"]) {
      expect(parseRepo(bad), bad).toBeNull();
    }
  });
});
