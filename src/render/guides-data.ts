/**
 * One entry per language, every number measured from the crawl on 25 Aug 2026.
 *
 * These pages only earn their place because they say something specific and
 * true. Generic advice repeated eight times is the thin content that gets a
 * site classified as low value, which would cost more than the pages gain.
 */
export interface Guide {
  slug: string;
  language: string;
  /** How the query is usually typed. */
  title: string;
  median: number;
  sample: number;
  /** Most common zero-scoring checks, with the share of repos failing each. */
  worst: Array<[string, number]>;
  install: string;
  testCmd: string;
  /** The AGENTS.md this ecosystem should ship. */
  example: string;
  /** What this ecosystem specifically gets wrong, in prose. */
  note: string;
}

export const GUIDES: Guide[] = [
  {
    slug: "typescript",
    language: "TypeScript",
    title: "How to write an AGENTS.md for a TypeScript project",
    median: 71,
    sample: 173,
    worst: [["Instruction quality", 47], ["Environment config", 45], ["Agent instruction file", 43]],
    install: "pnpm install",
    testCmd: "pnpm test",
    example: `# AGENTS.md

## Setup
pnpm install

## Commands
pnpm dev          # local server on :3000
pnpm test         # full suite, must pass before any commit
pnpm typecheck    # tsc --noEmit
pnpm lint

## Conventions
- Tests sit beside the file they cover, as *.test.ts.
- Strict mode is on. Do not widen types to make an error go away.

## Gotchas
- Copy .env.example before running anything that touches the database.`,
    note: `TypeScript scores best of any language, and it is mostly the ecosystem doing the work: a lockfile comes free, tests have a conventional home, and the scripts block already names commands. What TypeScript repos actually miss is instructions. 43% ship no agent instruction file at all, and among those that do, nearly half never name a command, which is the only part an agent can act on. The other frequent gap is environment config: 45% document no environment, so an agent installs cleanly and then fails at runtime with an error it cannot diagnose.`,
  },
  {
    slug: "python",
    language: "Python",
    title: "How to write an AGENTS.md for a Python project",
    median: 60,
    sample: 214,
    worst: [["Pinned runtime version", 84], ["Instruction quality", 70], ["Agent instruction file", 66]],
    install: "uv sync",
    testCmd: "pytest",
    example: `# AGENTS.md

## Setup
uv sync

## Commands
uv run pytest             # full suite, must pass before any commit
uv run ruff check .       # lint
uv run mypy src           # type check

## Conventions
- Tests live in tests/, named test_*.py.
- Dependencies are managed with uv. Do not pip install into the environment.

## Gotchas
- Requires Python 3.12. See .python-version.`,
    note: `Python's defining problem is the runtime. 84% of Python repositories pin no version at all, which means an agent picks whatever python resolves to and gets failures that have nothing to do with the change it made. A .python-version file costs one line and removes an entire class of confusion. The second problem is the same one everywhere: two thirds ship no agent instructions, and most of the rest never name a command.`,
  },
  {
    slug: "go",
    language: "Go",
    title: "How to write an AGENTS.md for a Go project",
    median: 70,
    sample: 77,
    worst: [["Instruction quality", 51], ["Agent instruction file", 49], ["Environment config", 44]],
    install: "go mod download",
    testCmd: "go test ./...",
    example: `# AGENTS.md

## Setup
go mod download

## Commands
go test ./...        # full suite, must pass before any commit
go build ./...
golangci-lint run

## Conventions
- Tests sit beside the code they cover, as *_test.go.
- Errors are wrapped with %w, never swallowed.

## Gotchas
- Anything under internal/ is not importable from outside this module.`,
    note: `Go scores well because its toolchain removes most of the decisions: go.sum pins dependencies, go test ./... is universal, and the compiler type checks every build. That last point matters for how this is scored, because a separate type checker is not applicable to Go and is excluded rather than counted against it. What is left is instructions. Half of Go repositories ship none, and among those that do, half never name a command.`,
  },
  {
    slug: "rust",
    language: "Rust",
    title: "How to write an AGENTS.md for a Rust project",
    median: 63,
    sample: 57,
    worst: [["Lint and format rules", 58], ["Instruction quality", 58], ["Agent instruction file", 51]],
    install: "cargo build",
    testCmd: "cargo test",
    example: `# AGENTS.md

## Setup
cargo build

## Commands
cargo test           # full suite, must pass before any commit
cargo clippy -- -D warnings
cargo fmt --check

## Conventions
- Unit tests sit in the file they cover, integration tests in tests/.
- Clippy warnings are errors in CI. Do not allow-by-default to silence one.

## Gotchas
- The toolchain is pinned in rust-toolchain.toml. Do not override it.`,
    note: `Rust gets dependency pinning and compiler-enforced types for free, and like Go a separate type checker is not applicable and is excluded from its total. The recurring gap is tooling config: 58% commit no clippy or rustfmt configuration, so an agent has no way to know the house style and its output drifts from yours in ways review has to catch by hand.`,
  },
  {
    slug: "javascript",
    language: "JavaScript",
    title: "How to write an AGENTS.md for a JavaScript project",
    median: 60,
    sample: 104,
    worst: [["Static type checking", 76], ["Instruction quality", 70], ["Agent instruction file", 69]],
    install: "npm ci",
    testCmd: "npm test",
    example: `# AGENTS.md

## Setup
npm ci

## Commands
npm test          # full suite, must pass before any commit
npm run lint
npm start

## Conventions
- Tests sit beside the file they cover, as *.test.js.
- CommonJS in src/, ES modules in scripts/. Do not mix within a directory.

## Gotchas
- Copy .env.example before running anything that needs configuration.`,
    note: `JavaScript scores eleven points below TypeScript, and most of the gap is the absence of a type checker: 76% have none, so an agent gets a runtime surprise where TypeScript would have handed it a compile error. Adding checkJs with JSDoc types recovers much of that without rewriting anything. Otherwise the pattern is familiar: seven in ten ship no agent instructions.`,
  },
  {
    slug: "java",
    language: "Java",
    title: "How to write an AGENTS.md for a Java project",
    median: 44,
    sample: 40,
    worst: [["Lint and format rules", 100], ["Deterministic install", 92], ["Test command is discoverable", 92]],
    install: "./mvnw verify -DskipTests",
    testCmd: "./mvnw test",
    example: `# AGENTS.md

## Setup
./mvnw verify -DskipTests

## Commands
./mvnw test           # full suite, must pass before any commit
./mvnw spotless:check
./mvnw package

## Conventions
- Tests mirror the package under src/test/java.
- Use the wrapper, never a system-installed maven.

## Gotchas
- Requires JDK 21. See .java-version.`,
    note: `Java scores second lowest, and the reasons are unusually consistent. Every single Java repository measured commits no lint or format configuration. 92% pin no dependency lockfile, and the same share offer no test command an agent can discover, because Maven and Gradle conventions live in build files an agent has to interpret rather than in a place it looks first. Naming the commands in an AGENTS.md is worth more here than in any other ecosystem, precisely because nothing else exposes them.`,
  },
  {
    slug: "cpp",
    language: "C++",
    title: "How to write an AGENTS.md for a C++ project",
    median: 42,
    sample: 41,
    worst: [["Pinned runtime version", 88], ["Deterministic install", 78], ["Test command is discoverable", 78]],
    install: "cmake -B build && cmake --build build",
    testCmd: "ctest --test-dir build",
    example: `# AGENTS.md

## Setup
cmake -B build -DCMAKE_BUILD_TYPE=Debug
cmake --build build -j

## Commands
ctest --test-dir build      # full suite, must pass before any commit
cmake --build build --target format

## Conventions
- Headers in include/, sources in src/, tests in tests/.
- Anything in third_party/ is vendored. Do not edit it.

## Gotchas
- Requires a C++20 compiler. Older toolchains fail with confusing template errors.`,
    note: `C++ scores lowest of the languages measured, and none of it is about code quality. There is no standard package manager, so 78% commit nothing that pins dependencies. There is no conventional test command, so the same share leave an agent with no way to verify a change. And 88% pin no toolchain version, which in C++ means an agent can hit template errors that have nothing to do with its edit. This is the ecosystem where writing the commands down changes the most.`,
  },
];

export const guideBySlug = (slug: string): Guide | undefined => GUIDES.find((g) => g.slug === slug);
