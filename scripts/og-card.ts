import type { Report } from "../src/grade/types";

const INK = "#0A0A0A";
const INK2 = "#525252";
const INK3 = "#8A8A8A";
const RULE = "#E5E5E5";
const TRACK = "#F6F6F6";
const ACC = "#FF3D00";
const ACC_T = "#D62E00";

/** Satori takes plain element objects, so no JSX runtime is needed. */
type El = { type: string; props: Record<string, unknown> };
const el = (type: string, style: Record<string, unknown>, children?: unknown): El => ({
  type,
  props: { style, ...(children === undefined ? {} : { children }) },
});

const row = (style: Record<string, unknown>, children: unknown[]): El =>
  el("div", { display: "flex", ...style }, children);

function wordmark(label: string): El {
  return row({ alignItems: "baseline", width: "100%" }, [
    row({}, [
      el("div", { fontFamily: "Archivo", fontSize: 26, fontWeight: 800, color: INK, letterSpacing: "-0.5px" }, "agent"),
      el("div", { fontFamily: "Archivo", fontSize: 26, fontWeight: 800, color: ACC, letterSpacing: "-0.5px" }, "readme"),
    ]),
    el(
      "div",
      { marginLeft: "auto", fontFamily: "JetBrains Mono", fontSize: 20, color: INK3, letterSpacing: "1px" },
      label,
    ),
  ]);
}

function bar(label: string, pct: number, value: string, failing: boolean): El {
  return row({ alignItems: "center", width: "100%", marginBottom: 13 }, [
    el(
      "div",
      {
        width: 280,
        flexShrink: 0,
        display: "flex",
        fontFamily: "Archivo",
        fontSize: 27,
        fontWeight: 600,
        color: failing ? ACC_T : INK,
      },
      label,
    ),
    el("div", { display: "flex", flexGrow: 1, flexShrink: 1, height: 30, backgroundColor: TRACK, marginLeft: 8, marginRight: 8 }, [
      el("div", { width: `${Math.max(2, Math.min(100, pct))}%`, height: 30, backgroundColor: failing ? ACC : INK }),
    ]),
    el(
      "div",
      {
        width: 110,
        flexShrink: 0,
        display: "flex",
        justifyContent: "flex-end",
        fontFamily: "JetBrains Mono",
        fontSize: 25,
        fontWeight: failing ? 700 : 400,
        color: failing ? ACC_T : INK2,
      },
      value,
    ),
  ]);
}

/** The single most damning line, which is what makes a card worth posting. */
function verdictLine(r: Report): string {
  const worst = r.topFixes[0];
  const failing = r.categories
    .flatMap((c) => c.checks)
    .find((c) => !c.na && c.score === 0 && c.severity === "critical");
  if (failing?.id === "agents-file") return "No AGENTS.md. Every agent that opens this repo starts from nothing.";
  if (failing?.id === "test-command") return "No test command an agent can find. It edits blind and reports success.";
  if (failing?.id === "tests-exist") return "No tests. Nothing tells an agent whether it broke something.";
  if (worst) return `Weakest link: ${worst.label.toLowerCase()}.`;
  return "Every check that applies here is passing or close to it.";
}

export function repoCard(r: Report): El {
  const slug = `${r.owner}/${r.repo}`;
  const bad = r.score < 55;

  return el(
    "div",
    {
      width: 1200,
      height: 630,
      display: "flex",
      flexDirection: "column",
      backgroundColor: "#FFFFFF",
      padding: 60,
      fontFamily: "Archivo",
    },
    [
      wordmark("AGENT READINESS"),
      el("div", { width: "100%", height: 1, backgroundColor: RULE, marginTop: 22, marginBottom: 26 }),

      row({ alignItems: "flex-end", width: "100%", marginBottom: 34 }, [
        el(
          "div",
          {
            display: "flex",
            flexGrow: 1,
            fontFamily: "Archivo",
            fontSize: slug.length > 26 ? 46 : 60,
            fontWeight: 800,
            color: INK,
            letterSpacing: "-1.6px",
          },
          [
            el("div", { color: INK3 }, `${r.owner}/`),
            el("div", { color: INK }, r.repo),
          ],
        ),
        row({ alignItems: "baseline" }, [
          el(
            "div",
            { fontFamily: "Archivo", fontSize: 120, fontWeight: 800, color: bad ? ACC : INK, letterSpacing: "-5px" },
            String(r.score),
          ),
          el("div", { fontFamily: "JetBrains Mono", fontSize: 24, color: INK3, marginLeft: 10 }, "/100"),
          el(
            "div",
            {
              fontFamily: "Archivo",
              fontSize: 70,
              fontWeight: 800,
              color: bad ? ACC : INK,
              marginLeft: 26,
              letterSpacing: "-2px",
            },
            r.grade,
          ),
        ]),
      ]),

      el(
        "div",
        { display: "flex", flexDirection: "column", width: "100%" },
        r.categories.map((c) => {
          const pct = c.max ? Math.round((c.score / c.max) * 100) : 0;
          return bar(c.label, pct, `${c.score}/${c.max}`, pct < 55);
        }),
      ),

      el("div", { display: "flex", marginTop: "auto", width: "100%", flexDirection: "column" }, [
        el("div", { width: "100%", height: 1, backgroundColor: RULE, marginBottom: 20 }),
        el("div", { fontFamily: "Archivo", fontSize: 28, color: INK2, lineHeight: 1.3 }, verdictLine(r)),
      ]),
    ],
  );
}

/** Shown on every page that is not a single repository. */
export function findingCard(opts: { total: number; median: number; noTest: number; withMd: number }): El {
  return el(
    "div",
    {
      width: 1200,
      height: 630,
      display: "flex",
      flexDirection: "column",
      backgroundColor: "#FFFFFF",
      padding: 60,
      fontFamily: "Archivo",
    },
    [
      wordmark("THE FINDING"),
      el("div", { width: "100%", height: 1, backgroundColor: RULE, marginTop: 22 }),

      row({ alignItems: "center", flexGrow: 1, width: "100%" }, [
        // Pinned width and no shrink: satori collapsed this box and let the
        // text column render straight over the number.
        el(
          "div",
          {
            display: "flex",
            width: 400,
            flexShrink: 0,
            alignItems: "center",
            justifyContent: "flex-start",
            fontFamily: "Archivo",
            fontSize: 250,
            fontWeight: 800,
            color: INK,
            lineHeight: 1,
            letterSpacing: "-10px",
          },
          String(opts.median),
        ),
        el("div", { display: "flex", flexDirection: "column", marginLeft: 20, flexGrow: 1, flexShrink: 1 }, [
          el(
            "div",
            { display: "flex", fontFamily: "Archivo", fontSize: 34, fontWeight: 600, color: INK, lineHeight: 1.25, letterSpacing: "-0.5px" },
            `median agent-readiness score across the ${opts.total} most-starred repos on GitHub`,
          ),
          el("div", { width: "100%", height: 1, backgroundColor: RULE, marginTop: 26, marginBottom: 26 }),
          el(
            "div",
            { display: "flex", fontFamily: "Archivo", fontSize: 32, fontWeight: 800, color: ACC_T, lineHeight: 1.2, letterSpacing: "-0.5px" },
            `${opts.noTest}% have no test command an agent can find`,
          ),
        ]),
      ]),

      el("div", { display: "flex", width: "100%", flexDirection: "column" }, [
        el("div", { width: "100%", height: 1, backgroundColor: RULE, marginBottom: 20 }),
        el(
          "div",
          { fontFamily: "Archivo", fontSize: 27, color: INK2 },
          "Most agent failures are a property of the repository, not the model.",
        ),
      ]),
    ],
  );
}
