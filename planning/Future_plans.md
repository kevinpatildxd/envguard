# devguard 🛡️
### One CLI to audit your entire Node.js + React project — dependencies, environment, and code quality.

> **Free. Open Source. Zero API keys required for core features.**

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Why devguard?](#2-why-devguard)
3. [Full Feature List](#3-full-feature-list)
4. [Free Tools & APIs](#4-free-tools--apis)
5. [Tech Stack](#5-tech-stack)
6. [Folder Structure](#6-folder-structure)
7. [CLI Commands & Usage](#7-cli-commands--usage)
8. [Module Breakdown](#8-module-breakdown)
   - [deps — Dependency Auditor](#81-devguard-deps)
   - [env — Environment Validator](#82-devguard-env)
   - [react:imports — Dead Import Finder](#83-devguard-reactimports)
   - [react:rerenders — Re-render Detector](#84-devguard-reactrerenders)
   - [react:hooks — Hooks Rule Linter](#85-devguard-reacthooks)
   - [react:bundle — Bundle Size Audit](#86-devguard-reactbundle)
   - [react:a11y — Accessibility Scanner](#87-devguard-reacta11y)
   - [react:server — RSC Boundary Checker](#88-devguard-reactserver)
9. [Development Roadmap](#9-development-roadmap)
10. [Phase-by-Phase Build Plan](#10-phase-by-phase-build-plan)
11. [Target Terminal Output](#11-target-terminal-output)
12. [Publishing & Growth](#12-publishing--growth)
13. [Success Milestones](#13-success-milestones)

---

## 1. Project Overview

**devguard** is a single, unified CLI tool for Node.js and React developers that audits an entire project's health in one command. Instead of juggling 5–6 separate tools, devguard gives you one clean terminal report covering dependency health, environment config safety, and React code quality — all for free, with no API keys needed for the core features.

```bash
npx devguard
```

That's it. One command. Full project audit.

---

## 2. Why devguard?

### The problem today

JavaScript developers currently need all of these just to understand their project's health:

| Problem | Current "solution" | Pain |
|---|---|---|
| Unused packages | `depcheck` (unmaintained) | Misses many cases, no alternatives |
| Outdated versions | `npm outdated` | No context, no suggestions |
| Vulnerabilities | `npm audit` | Noisy, hard to read |
| Bad `.env` config | Nothing open source | No tool exists |
| Wasted re-renders | React DevTools (manual) | No CLI, no CI integration |
| Dead imports | ESLint (heavy setup) | Requires full config |
| Bundle bloat | bundlephobia.com (manual) | No CLI automation |
| Accessibility issues | axe (browser only) | No static file scan |
| RSC boundary bugs | Nothing | Completely unsolved |

**devguard replaces all of this with one command.**

---

## 3. Full Feature List

### v1.0 — Core Modules
- ✅ Unused package detection
- ✅ Outdated version scanner
- ✅ Vulnerability checker (via OSV.dev)
- ✅ Lightweight alternative suggestions
- ✅ Missing `.env` key detection
- ✅ Insecure/placeholder value detection
- ✅ Type mismatch validation (PORT should be a number)
- ✅ URL format validation
- ✅ Weak secret detection
- ✅ CI mode with exit code 1 on errors

### v1.1 — React: Imports
- ✅ Dead component detection
- ✅ Unused import finder across all `.jsx` / `.tsx` files
- ✅ Cross-file usage mapping

### v1.2 — React: Code Quality
- ✅ Wasted re-render pattern detection
- ✅ Missing `React.memo` suggestions
- ✅ Unstable dependency array detection in `useEffect` / `useMemo` / `useCallback`
- ✅ Hooks rule violations (hooks in conditions, loops, nested functions)

### v1.3 — React: Bundle
- ✅ Heavy package detection with size data
- ✅ Lightweight alternative suggestions with size savings
- ✅ Bundle impact per import

### v2.0 — React: Advanced
- ✅ Accessibility (a11y) static scan
- ✅ Server/Client component boundary checker for Next.js App Router

---

## 4. Free Tools & APIs

> Every tool listed here is 100% free. No credit card, no API key, no rate limit issues for normal usage.

| Tool / API | Cost | Used For |
|---|---|---|
| **npm Registry API** | Free, no key | Package metadata, latest versions — called in parallel via `Promise.all()` |
| **OSV.dev API (Google)** | Free, no key | Open vulnerability database — use `/v1/querybatch` to send all packages in one POST |
| **Bundlephobia API** | Free, no key | Fallback size data for packages not in the embedded static list |
| **GitHub API (unauthed)** | ~~Free (60 req/hr)~~ **Dropped** | Replaced by embedded static alternatives list — no API call needed |
| **Node.js `fs`, `path`** | Free (built-in) | File reading and walking |
| **`@babel/parser`** | Free / MIT | AST parsing for JSX/TSX analysis |
| **`commander.js`** | Free / MIT | CLI argument parsing |
| **`chalk`** | Free / MIT | Terminal color output |
| **`ora`** | Free / MIT | Loading spinners |
| **`ignore`** | Free / MIT | Correct `.gitignore` parsing (handles negation, nested files, edge cases) |
| **`vitest`** | Free / MIT | Unit testing |
| **`tsup`** | Free / MIT | TypeScript bundler for npm |
| **GitHub Actions** | Free tier | CI/CD and npm publishing |
| **GitHub Pages** | Free | Documentation website |
| **npm registry** | Free | Package publishing |
| **Local disk cache** | Free | `~/.devguard/cache.json` — 24hr TTL; all API results cached by `name@version` key |

---

## 5. Tech Stack

```
Language        TypeScript (strict mode)
Runtime         Node.js 18+
CLI Framework   commander.js
Terminal UI     chalk + ora
AST Parser      @babel/parser (for React module analysis)
Testing         vitest
Bundler         tsup (builds CJS + ESM for npm)
CI/CD           GitHub Actions
Docs            Markdown + GitHub Pages
```

---

## 6. Folder Structure

> ✅ Structure reflects the actual project on disk. Files/folders to be added are marked with `← ADD`.

```
envguard/
├── .github/                          ← exists
│   ├── workflows/
│   │   ├── test.yml                  ← ADD: Run tests on every push
│   │   └── publish.yml               ← ADD: Publish to npm on version tag
│   └── ISSUE_TEMPLATE/               ← ADD: Bug & feature request templates
│
├── ai-workflow/                      ← AI-assisted dev notes (exists)
│
├── dist/                             ← Build output, auto-generated by tsup (exists)
│
├── node_modules/                     ← Dependencies (exists)
│
├── planning/                         ← Project planning docs (exists)
│   ├── Future_plans.md               ← React module ideas & future features (exists)
│   ├── github-setup.md               ← GitHub repo setup guide (exists)
│   ├── roadmap.md                    ← Version roadmap (exists)
│   ├── validation-rules.md           ← env validation rules reference (exists)
│   └── devguard-plan.md              ← ADD: This master plan file
│
├── src/                              ← Source code (exists)
│   ├── index.ts                      ← CLI entry point
│   ├── cli.ts                        ← ADD: commander.js setup, routes all commands
│   ├── reporter.ts                   ← ADD: Shared terminal output formatter
│   ├── types.ts                      ← ADD: Shared TypeScript interfaces
│   │
│   ├── modules/                      ← ADD: Feature modules folder
│   │   ├── deps/                     ← ADD: v1.0 — Dependency auditor
│   │   │   ├── index.ts              ← deps command entry
│   │   │   ├── unused.ts             ← Scan source files for import usage
│   │   │   ├── outdated.ts           ← npm Registry API calls
│   │   │   ├── vulns.ts              ← OSV.dev API calls
│   │   │   └── alternatives.ts       ← Lighter alternative suggestions
│   │   │
│   │   ├── env/                      ← v1.0 — Environment validator (in progress)
│   │   │   ├── index.ts              ← env command entry
│   │   │   ├── parser.ts             ← .env / .env.example file parser
│   │   │   └── rules/
│   │   │       ├── missing.ts        ← Missing required key check
│   │   │       ├── insecure.ts       ← Insecure/placeholder value check
│   │   │       ├── type.ts           ← Type mismatch check (PORT, booleans)
│   │   │       └── url.ts            ← Malformed URL check
│   │   │
│   │   └── react/                    ← ADD: v1.1+ — React audit modules
│   │       ├── imports.ts            ← v1.1: Dead import/component finder
│   │       ├── rerenders.ts          ← v1.2: Re-render pattern detector
│   │       ├── hooks.ts              ← v1.2: Hooks rule linter
│   │       ├── bundle.ts             ← v1.3: Bundle size via Bundlephobia
│   │       ├── a11y.ts               ← v2.0: Accessibility static scan
│   │       └── server.ts             ← v2.0: RSC boundary checker
│   │
│   └── utils/                        ← ADD: Shared utilities
│       ├── fileWalker.ts             ← Recursive file scanner (respects .gitignore); tracks visited inodes to prevent infinite loops from symlinks
│       ├── httpClient.ts             ← Lightweight fetch wrapper
│       └── astHelpers.ts             ← Shared AST parsing utilities
│
├── test-project/                     ← Sample project for manual testing (exists)
│
├── tests/                            ← Unit tests (exists)
│   ├── env/                          ← ADD: Tests per env rule
│   │   ├── missing.test.ts
│   │   ├── insecure.test.ts
│   │   ├── type.test.ts
│   │   └── url.test.ts
│   ├── deps/                         ← ADD: Tests for dep modules
│   │   ├── unused.test.ts
│   │   ├── outdated.test.ts
│   │   └── vulns.test.ts
│   └── react/                        ← ADD: Tests for react modules (v1.1+)
│       ├── imports.test.ts
│       ├── rerenders.test.ts
│       └── hooks.test.ts
│
├── fixtures/                         ← ADD: Sample files used by tests
│   ├── sample.env
│   ├── sample.env.example
│   ├── sample-package.json
│   └── sample-react-component.tsx
│
├── .gitignore                        ← exists
├── CONTRIBUTING                      ← exists (rename to CONTRIBUTING.md)
├── LICENSE                           ← exists
├── envguard-plan.docx                ← exists (move to planning/ folder)
├── package-lock.json                 ← exists
├── package.json                      ← exists
├── README.md                         ← exists
├── tsconfig.json                     ← exists
└── tsup.config.ts                    ← exists
```

### Quick action checklist for your repo right now

- [ ] Move `envguard-plan.docx` → `planning/envguard-plan.docx`
- [ ] Rename `CONTRIBUTING` → `CONTRIBUTING.md`
- [ ] Save this file as `planning/devguard-plan.md`
- [ ] Create `src/modules/` with `deps/`, `env/`, `react/` subfolders
- [ ] Create `src/utils/` folder
- [ ] Create `fixtures/` folder with sample `.env` files for tests
- [ ] Create `tests/env/`, `tests/deps/`, `tests/react/` subfolders
- [ ] Add `.github/workflows/test.yml` and `publish.yml`

---

## 7. CLI Commands & Usage

```bash
# Run full audit (deps + env + react if React project detected)
npx devguard

# Run only dependency audit
npx devguard deps

# Run only environment validation
npx devguard env

# Run specific React checks
npx devguard react:imports
npx devguard react:rerenders
npx devguard react:hooks
npx devguard react:bundle
npx devguard react:a11y
npx devguard react:server

# Run all React checks
npx devguard react

# Output as JSON (for CI pipelines and scripting)
npx devguard --json

# Strict mode — exit with code 1 if any errors found (for CI)
npx devguard --strict

# Target a specific env file
npx devguard env --file .env.production

# Show version
npx devguard --version
```

---

## 8. Module Breakdown

---

### 8.1 `devguard deps`

**What it does:** Full dependency health audit.

**Checks:**

| Check | How it works | API used |
|---|---|---|
| Unused packages | Walk all source files, extract imports, compare to `package.json` | None — pure AST |
| Outdated versions | Fetch all packages in parallel via `Promise.all()` | npm Registry API (free) |
| Vulnerabilities | Send all packages in a single `/v1/querybatch` POST | OSV.dev API (free) |
| Lighter alternatives | Embedded static list in source — no API call | None |

**Sample output:**
```
UNUSED PACKAGES (3)
  lodash, uuid, moment

OUTDATED (2)
  axios     3.0.0  →  3.1.2
  dotenv    15.0.0 →  16.4.7

VULNERABILITIES (1)
  express@4.18.0  CVE-2024-29041  (High)

SUGGESTIONS
  moment  →  dayjs       saves 67KB, same API
  lodash  →  native ES6  saves 72KB
```

---

### 8.2 `devguard env`

**What it does:** Validates `.env` against `.env.example` — catches config bugs before they hit production.

**Rules:**

| Rule | Severity | Example |
|---|---|---|
| Missing required key | Error | `DATABASE_URL` in example but absent in `.env` |
| Empty value | Error | `API_KEY=` (declared but blank) |
| Insecure placeholder | Error | `JWT_SECRET=secret` or `DB_PASS=changeme` |
| Undeclared key | Warning | Key in `.env` not in `.env.example` |
| Type mismatch | Warning | `PORT=abc` (should be a number) |
| Malformed URL | Warning | `DATABASE_URL=localhost` (missing protocol) |
| Weak secret length | Warning | `SECRET_KEY` under 16 characters |
| Boolean mismatch | Warning | `FEATURE_FLAG=yes` (should be `true`/`false`) |

**Sample output:**
```
ERRORS (2)
  ✗ DATABASE_URL   missing — required in .env.example
  ✗ JWT_SECRET     insecure value: 'secret'

WARNINGS (2)
  ⚠ PORT           value 'abc' is not a valid number
  ⚠ STRIPE_KEY     not declared in .env.example

PASSED (8) ✔
```

**Zero dependencies at runtime** — pure Node.js `fs` only.

---

### 8.3 `devguard react:imports`

**What it does:** Finds unused imports and dead components across your entire React codebase.

**How it works:**
1. Walk all `.jsx` / `.tsx` files using the file walker utility
2. Parse each file with `@babel/parser` to extract all import statements
3. Build a map of every imported name vs every used name in JSX/code
4. Cross-reference across files to find components defined but never used anywhere — graph traversal must maintain a `visited` set (Set\<resolvedFilePath\>) to break circular import cycles (A → B → A) that would otherwise cause infinite recursion

**Catches:**
- Imported components never used in JSX
- Utility functions imported but never called
- Entire files that are imported nowhere (dead modules)
- `import * as X` where only 1–2 properties are used

**Entry point detection:** Before marking files as dead, the scanner must first establish the import graph root. Auto-detect in this order: `src/index.tsx`, `src/main.tsx`, `app/` directory (Next.js App Router), `pages/` directory (Next.js Pages Router), `vite.config.ts` entry field. If none found, warn the user and require `--entry <file>` — do not silently guess.

**No API needed** — pure static file analysis.

---

### 8.4 `devguard react:rerenders`

**What it does:** Detects common patterns that cause unnecessary re-renders.

**Catches:**

```tsx
// ❌ Flagged: object literal in JSX prop causes re-render every time
<Component style={{ color: 'red' }} />

// ❌ Flagged: function defined inline in JSX
<Button onClick={() => handleClick(id)} />

// ❌ Flagged: component not wrapped in React.memo
export default function ExpensiveList({ items }) { ... }

// ❌ Flagged: unstable dependency in useEffect
useEffect(() => { ... }, [{ id: user.id }])  // object literal

// ✅ These pass
const style = useMemo(() => ({ color: 'red' }), [])
const handleClick = useCallback(() => ..., [id])
export default React.memo(function ExpensiveList({ items }) { ... })
```

**No API needed** — AST-based static analysis.

---

### 8.5 `devguard react:hooks`

**What it does:** Enforces React's rules of hooks — catches violations that ESLint would catch but without needing ESLint configured.

**Rules enforced:**

```tsx
// ❌ Hook inside condition
if (isLoggedIn) {
  const [data, setData] = useState(null)  // VIOLATION
}

// ❌ Hook inside loop
for (let i = 0; i < items.length; i++) {
  useEffect(() => { ... }, [])  // VIOLATION
}

// ❌ Hook inside nested function
function outer() {
  function inner() {
    const [x, setX] = useState(0)  // VIOLATION
  }
}

// ❌ Calling a hook from a non-hook, non-component function
function fetchData() {
  const [loading, setLoading] = useState(false)  // VIOLATION
}
```

Reports file path and line number for every violation.

> **Scope note:** Missing dependency array detection (`useEffect(() => { fetchUser(userId) }, [])`) is intentionally excluded. Correctly detecting missing deps requires full data-flow analysis to know whether `userId` is reactive (state/prop) vs stable (ref/constant) — pure AST cannot do this without false positives. The four checks above are reliable with AST only.

---

### 8.6 `devguard react:bundle`

**What it does:** Scans all imports and reports their bundle size impact, flagging heavy packages and suggesting lighter alternatives.

**How it works:**
1. Extract all third-party imports from source files
2. Check the embedded static list first — covers the 30 most common heavy packages with no API call
3. For packages not in the static list, query Bundlephobia API as a fallback
4. Named imports (`import { format } from 'date-fns'`) are labelled `⚠ may be tree-shaken` instead of reporting full package size as fact
5. Flag packages over configurable size threshold (default: 50KB gzipped)
6. Suggest lighter alternatives from the embedded list

**Embedded static alternatives list (no API — shipped in source):**

| Heavy Package | Size | Suggested Alternative | Saves |
|---|---|---|---|
| `moment` | 67KB | `dayjs` | ~65KB |
| `lodash` | 72KB | Native ES6 / `lodash-es` | ~60KB |
| `axios` | 13KB | Native `fetch` | ~13KB |
| `date-fns` | 78KB | `date-fns` tree-shaking fix | ~50KB |
| `jquery` | 87KB | Native DOM APIs | ~87KB |
| `styled-components` | 35KB | `CSS modules` or `Tailwind` | ~30KB |

**API used:** Bundlephobia (free, no key) — fallback only for packages not in the static list.

---

### 8.7 `devguard react:a11y`

**What it does:** Static accessibility scan of all JSX/TSX files — catches common a11y violations without a browser.

**Catches:**

```tsx
// ❌ img missing alt
<img src="logo.png" />

// ❌ button with no accessible label
<button><img src="icon.svg" /></button>

// ❌ onClick on non-interactive element
<div onClick={handleClick}>Click me</div>

// ❌ input missing label association
<input type="text" placeholder="Name" />  // no id + label

// ❌ anchor tag with no href or role
<a onClick={go}>Home</a>

// ❌ Empty link text
<a href="/about"></a>
```

Reports file, line number, rule name, and a fix suggestion for each issue.

> **Scope note:** Checks are intentionally **file-scoped only** — the same limitation ESLint has without a full type-aware setup. Two checks are excluded because they require the full rendered component tree:
> - Heading level order (h1 → h3) — headings may live across multiple component files; can't know the rendered order statically
> - Form missing submit button — the button may be in a child/sibling component
>
> Everything else in the list above works correctly at file scope.

**No API needed** — pure AST + JSX pattern matching.

---

### 8.8 `devguard react:server`

**What it does:** Checks Next.js App Router projects for Server Component / Client Component boundary violations.

**The problem it solves:**
Next.js App Router is powerful but the `"use client"` / `"use server"` boundary is easy to break — especially with AI-generated code. There is currently no clean open source CLI that catches these violations statically.

**Catches:**

```tsx
// ❌ Server component importing a client-only hook
// app/page.tsx (no "use client" directive)
import { useState } from 'react'  // VIOLATION — useState is client-only

// ❌ Server component using browser APIs
// app/layout.tsx
const width = window.innerWidth  // VIOLATION — window doesn't exist server-side

// ❌ Client component importing a server-only module
// components/Button.tsx ("use client")
import { headers } from 'next/headers'  // VIOLATION — server-only API

// ❌ Passing non-serializable props across the boundary
// Passing functions, class instances, Date objects as props from server to client

// ✅ These pass
// Server: async components, fetch, db queries, fs access
// Client: useState, useEffect, onClick, browser APIs (with "use client")
```

**Detection method:** File-level directive scanning + import graph analysis. No runtime needed. The import graph traversal must carry a `visited` set (Set\<resolvedFilePath\>) — without it, circular imports (A → B → C → A) cause infinite recursion when tracing whether a client component reaches a server-only module.

---

## 9. Development Roadmap

```
v1.0  ──── deps + env modules ──────────────────── Week 1–5
v1.1  ──── react:imports ──────────────────────── Week 6–7
v1.2  ──── react:rerenders + react:hooks ────────── Week 8–10
v1.3  ──── react:bundle ───────────────────────── Week 11–12
v2.0  ──── react:a11y + react:server ───────────── Week 13–16
```

### Version Feature Map

| Version | New Commands | Effort | APIs Added |
|---|---|---|---|
| **v1.0** | `deps`, `env`, base `devguard` | 5 weeks | npm, OSV.dev |
| **v1.1** | `react:imports` | 2 weeks | None |
| **v1.2** | `react:rerenders`, `react:hooks` | 3 weeks | None |
| **v1.3** | `react:bundle` | 2 weeks | Bundlephobia |
| **v2.0** | `react:a11y`, `react:server` | 4 weeks | None |

**Total estimated build time: ~16 weeks** at a few hours per day.

---

## 10. Phase-by-Phase Build Plan

### Phase 1 — Project Setup (Days 1–3)
- Init GitHub repo with MIT license
- TypeScript config with strict mode
- commander.js CLI skeleton
- chalk + ora terminal setup
- vitest + tsup config
- GitHub Actions: test on push, publish on tag

### Phase 2 — `env` Module (Days 4–10)
- Build `.env` / `.env.example` parser
- Implement all 8 validation rules
- Terminal reporter (color-coded errors/warnings/pass)
- `--strict` exit code, `--json` output, `--file` flag
- Write tests for every rule with fixture files

### Phase 3 — `deps` Module (Days 11–20)
- Build source file walker using `ignore` package for `.gitignore` parsing
- AST import extractor for JS/TS files
- Unused package detector (compare imports vs `package.json`)
- npm Registry API — all packages fetched in parallel via `Promise.all()`
- OSV.dev API — single `/v1/querybatch` POST for all packages at once
- Alternatives suggestion engine — embedded static list, no API call
- Local disk cache (`~/.devguard/cache.json`, 24hr TTL) wired up for all API results

### Phase 4 — Base `devguard` Command (Days 21–23)
- Auto-detect React project (check for `react` in deps)
- Run `deps` + `env` together, unified report
- Summary score at the end (e.g. "3 errors, 2 warnings")
- Polish terminal output

### Phase 5 — Ship v1.0 (Days 24–25)
- Write README with usage examples + terminal demo GIF
- Publish to npm
- Post on Dev.to, Reddit, share on social

### Phase 6 — `react:imports` (v1.1, Week 6–7)
- Add `@babel/parser` for JSX/TSX AST parsing
- Build cross-file import usage mapper with `visited: Set<string>` cycle guard
- Auto-detect entry points; warn + require `--entry` if none found
- Dead component and unused import reporter

### Phase 7 — `react:rerenders` + `react:hooks` (v1.2, Week 8–10)
- Re-render pattern detectors (inline objects, functions in JSX)
- `React.memo` suggestion engine
- Hooks rules enforcer with line-number reporting (AST-only: conditional, loop, nested function, non-component caller violations only — no missing-dep check)

### Phase 8 — `react:bundle` (v1.3, Week 11–12)
- Import extractor for third-party packages
- Embedded static size + alternatives list (covers top-30 heavy packages, zero API calls)
- Bundlephobia API as fallback for packages not in the static list
- Named import labelling (`⚠ may be tree-shaken`) to avoid misleading size reports
- Heavy package threshold system (default 50KB gzipped, configurable)

### Phase 9 — `react:a11y` + `react:server` (v2.0, Week 13–16)
- JSX accessibility rule engine (img, button, input, anchor, empty-link checks — file-scoped only; heading-order and form checks excluded)
- Next.js App Router directive scanner
- Import graph builder for server/client boundary analysis (with `visited: Set<string>` cycle guard)

---

## 11. Target Terminal Output

### Full `devguard` run output (v1.0 target)

```
$ npx devguard

devguard v1.0.0  —  scanning project...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  DEPS AUDIT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✔ Scanned 847 files in 1.2s

UNUSED PACKAGES (3)
  lodash    →  remove or replace with native ES6 (saves 72KB)
  uuid      →  remove or use crypto.randomUUID() (built-in)
  moment    →  replace with dayjs (saves 65KB, same API)

OUTDATED (2)
  axios     3.0.0   →  3.1.2
  dotenv    15.0.0  →  16.4.7

VULNERABILITIES (1)
  express@4.18.0   CVE-2024-29041  High  —  update to 4.19.0

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ENV AUDIT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ERRORS (2)
  ✗ DATABASE_URL   missing — required in .env.example
  ✗ JWT_SECRET     insecure value: 'secret'

WARNINGS (1)
  ⚠ PORT           value 'abc' is not a valid number

PASSED (9) ✔

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  3 errors    4 warnings    9 passed

  Fix errors before deploying. Run with --json for CI output.
```

---

### Future `devguard react` output (v1.2+ target)

```
$ npx devguard react

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  REACT AUDIT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DEAD IMPORTS (4)
  src/components/OldModal.tsx    —  imported nowhere
  src/utils/legacyFormat.ts      —  imported nowhere
  src/pages/TestPage.tsx         —  imported nowhere
  src/hooks/useOldAuth.ts        —  imported nowhere

RE-RENDER RISKS (3)
  src/components/UserList.tsx:14   inline object prop  { style={{ color: 'red' }} }
  src/components/Card.tsx:32       inline function     onClick={() => handle(id)}
  src/components/Feed.tsx          missing React.memo  (renders on every parent update)

HOOKS VIOLATIONS (1)
  src/components/Auth.tsx:28    useState called inside if-statement

BUNDLE WARNINGS (2)
  moment        67KB  →  use dayjs (2KB)
  styled-components  35KB  →  use CSS modules or Tailwind

A11Y ISSUES (2)
  src/components/Header.tsx:8   <img> missing alt attribute
  src/components/Nav.tsx:22     <div onClick> should be <button>
```

---

## 12. Publishing & Growth

### Getting your first users — all free

1. **npm publish** — users can run `npx devguard` instantly, no install needed
2. **README demo GIF** — record with `asciinema` (free) + convert with `agg`
3. **Dev.to post** — *"I built a free CLI that audits your entire Node.js project in one command"*
4. **Reddit** — post in r/node, r/reactjs, r/javascript, r/webdev
5. **GitHub Topics** — add: `nodejs`, `cli`, `developer-tools`, `react`, `linter`, `security`, `devtools`
6. **awesome-nodejs** — submit a PR to add devguard to the awesome list
7. **GitHub Action Marketplace** — publish a `devguard-action` for one-line CI integration
8. **Hashnode** — cross-post your Dev.to article for more reach

### npm package naming options
- `devguard` ← ideal if available
- `@yourname/devguard`
- `devguard-cli`

---

## 13. Success Milestones

| Milestone | Target | What it means |
|---|---|---|
| 🟢 First working module | Day 10 | `env` command fully works on your own project |
| 🟢 v1.0.0 on npm | Day 25 | `npx devguard` works for anyone in the world |
| 🟡 First external star | Week 5 | Someone else found it useful |
| 🟡 100 npm weekly downloads | Month 2 | Real adoption beginning |
| 🟠 500 GitHub stars | Month 4–6 | Community recognition |
| 🔴 React modules complete | Month 4 | v1.2 shipped — now covers JS + React |
| 🔴 v2.0 shipped | Month 4–5 | Full tool — deps + env + 6 React checks |
| 🏆 1000+ weekly downloads | Month 6+ | Established open source tool |

---

## Notes

- All React modules use `@babel/parser` for AST analysis — this covers both JSX and TSX with zero config
- The `--strict` flag makes devguard useful as a pre-commit hook or CI step
- Keep the core `env` module zero-dependency at runtime — do not add external packages to it
- Add a `devguard.config.js` file in v1.1 for users who want to customize thresholds and rules
- Consider a `--fix` flag in v2.0 for auto-fixing simple issues (removing unused imports, adding alt text stubs)
- **Performance & API budget (open source, zero funds):**
  - All outbound API calls use `Promise.all()` — never sequential
  - OSV.dev vulnerabilities: single `/v1/querybatch` POST, not one request per package
  - GitHub API: dropped entirely — alternatives list is embedded static data in source
  - Bundlephobia: fallback only; top-30 heavy packages covered by embedded static list
  - Local disk cache at `~/.devguard/cache.json` with 24hr TTL — keyed by `name@version`; all API results go through it, making repeated runs nearly instant and offline-friendly
  - `.gitignore` parsing: use `ignore` npm package (MIT, 0 deps) — do not re-implement
- **Guard Dog mascot (`src/buddy.ts`):** ASCII art guard dog rendered with chalk, shown at start of every scan. Three states — `idle` (scanning), `clear` (zero errors, green eyes), `error` (errors found, red eyes). Message text sits inline to the right of the dog. No external dependencies — pure chalk + Unicode characters.
- **Scope boundaries (where we intentionally stop to avoid false positives):**
  - `react:hooks` — no missing-deps-array check; requires data-flow analysis beyond pure AST
  - `react:a11y` — file-scoped only; heading-order and form checks require the full render tree
  - `react:imports` — dead module detection requires known entry points; auto-detect or ask via `--entry`
- **Loop safety (mandatory for all graph/walk code):**
  - `fileWalker.ts` — collect `fs.lstatSync(path).ino` (inode number) into a `Set<number>` before entering each directory; skip any directory whose inode is already in the set to prevent infinite loops caused by symlinks
  - `react:imports` graph traversal — pass a `visited: Set<string>` of resolved absolute file paths through every recursive call; return immediately if the current file is already in the set before processing its imports
  - `react:server` import graph traversal — same `visited: Set<string>` pattern as above; essential because client→server boundary tracing is deep and real codebases always contain circular imports

---

*Built with ❤️ using Node.js, TypeScript, and 100% free tools.*