# devguard — Implementation Plan

> Covers every phase from repo rename through v2.0 ship.
> Each section lists who does what (AI = Claude, Human = you), git commands, and live test steps.

---

## How to Use This Plan

Every git command in this file is in its own code block — triple-click any block to select the full command, then paste into your terminal.

For interactive command selection during development, install `fzf` once:

```bash
sudo apt install fzf
```

Then run any npm script interactively:

```bash
npm run | fzf | xargs npm run
```

Or use the dev menu script (added in Phase 0):

```bash
bash scripts/dev-menu.sh
```

---

## Branch Strategy (applies to all phases)

```
main        ← stable releases only, protected
develop     ← integration branch, all features merge here first
feature/*   ← one branch per feature, branch off develop
```

Rules:
- Never commit directly to `main`
- Every `feature/*` branch merges into `develop` via PR
- `develop` merges into `main` only at phase ship points (v1.0, v1.1, etc.)
- CI must be green before any merge

---

## Phase 0 — Repo Rename + Branch Setup + CI/CD Skeleton

### 0.1 Rename repo from envguard → devguard

**Human tasks:**
1. Go to GitHub → your repo → Settings → scroll to "Danger Zone" → Rename repository → type `devguard` → confirm
2. Update the local remote URL:

```bash
git remote set-url origin https://github.com/kevinpatildxd/devguard.git
```

3. Verify:

```bash
git remote -v
```

**AI tasks:**
- Update `package.json` name field from `envguard` to `devguard`
- Update any internal references to `envguard` in `README.md` and source files
- Update CLI binary name in `package.json` bin field

**Git commands after rename:**

```bash
git add package.json README.md
```

```bash
git commit -m "chore: rename package from envguard to devguard"
```

---

### 0.2 Create branch structure

```bash
git checkout -b develop
```

```bash
git push -u origin develop
```

---

### 0.3 Add GitHub Actions CI/CD

**AI tasks:** Write two workflow files.

`test.yml` — runs on every push and PR to `develop` and `main`:
- `npm ci`
- `npm run build`
- `npm test`

`publish.yml` — runs on version tag push (`v*.*.*`):
- runs tests first
- `npm publish` on pass

**Human tasks:**
- ~~Add `NPM_TOKEN` secret to GitHub repo~~ — **already done in envguard, secrets carry over on rename. No action needed.**

**Git commands:**

```bash
git checkout -b feature/ci-cd-setup
```

```bash
git add .github/
```

```bash
git commit -m "ci: add test and publish GitHub Actions workflows"
```

```bash
git push -u origin feature/ci-cd-setup
```

```bash
gh pr create --title "ci: add test and publish GitHub Actions workflows" --body "Adds test.yml covering develop + main with build step, updates publish.yml to run tests before publishing, removes old ci.yml." --base develop
```

```bash
gh pr merge --merge
```

```bash
git checkout develop && git pull
```

---

### 0.4 Add dev menu script

**AI tasks:** Create `scripts/dev-menu.sh` — an fzf-powered menu listing all npm scripts.

**Git commands:**

```bash
git checkout -b feature/dev-menu
```

```bash
git add scripts/dev-menu.sh
```

```bash
git commit -m "chore: add fzf dev menu script for interactive command selection"
```

```bash
git push -u origin feature/dev-menu
```

```bash
gh pr create --title "chore: add fzf dev menu script" --body "Adds scripts/dev-menu.sh — interactive fzf-powered command selector for all devguard npm scripts." --base develop
```

```bash
gh pr merge --merge
```

```bash
git checkout develop && git pull
```

**Live test after Phase 0:**

```bash
bash scripts/dev-menu.sh
```

Confirm the menu appears, arrow keys work, and selected scripts run correctly.

---

### Phase 0 push to main

```bash
git checkout main
```

```bash
git merge develop --no-ff -m "chore: phase 0 — repo rename, branch setup, CI/CD"
```

```bash
git push origin main
```

```bash
git checkout develop
```

---

## Phase 1 — Project Scaffolding

### 1.1 TypeScript + tsup + vitest config

**AI tasks:**
- Verify/harden `tsconfig.json` strict mode
- Verify `tsup.config.ts` builds CJS + ESM
- Set up `vitest.config.ts`
- Create `src/types.ts` with shared interfaces

**Human tasks:**
- Run the build and confirm output lands in `dist/`

```bash
git checkout -b feature/project-scaffold
```

```bash
git add src/types.ts tsup.config.ts vitest.config.ts
```

```bash
git commit -m "chore: add shared types and verified build config"
```

---

### 1.2 commander.js CLI skeleton

**AI tasks:**
- Wire up `src/cli.ts` with commander.js
- Register placeholder commands: `env`, `deps`, `react`
- Connect `src/index.ts` entry point

**Human tasks:**
- Run `npm run build && node dist/index.js --help`
- Confirm all commands appear in help output

**Git commands:**

```bash
git add src/cli.ts src/index.ts
```

```bash
git commit -m "feat: CLI skeleton with commander.js — env, deps, react stubs"
```

---

### 1.3 Guard Dog Mascot — design and approve

> **Mascot decision: Guard Dog** — friendly, protective, unique for a CLI tool. Shown at scan start and reacts to results.

**AI tasks:**
- Create `scripts/preview-buddy.ts` — standalone chalk-only script, no module connections
- Design the guard dog in three states using chalk colors + Unicode block chars:

**Idle / scanning state** (shown at start of every run):
```
   / \__
  (    @\___    devguard v1.0.0
  /         O   scanning your project...
 /   (_____/
/_____/   U
```

**All clear state** (shown when zero errors):
```
   / \__
  ( ^  @\___    all clear! your project
  /         O   looks great  ✔
 /   (_____/
/_____/   U
```

**Errors found state** (shown when errors exist):
```
   / \__
  ( ò  @\___    found some issues.
  /         O   fix errors before deploy.
 /   (_____/
/_____/   U
```

- Colors: chalk yellow for `@`, chalk white for body, chalk red eyes on error state, chalk green eyes on clear state
- The dog sits to the left, the message text sits to the right inline

**Human tasks:**
- Run the buddy preview:

```bash
npx ts-node scripts/preview-buddy.ts
```

- Check all three states — sizing, colors, alignment, message wording
- Request any shape/color/text changes (Claude edits and you re-run)
- Once happy: **"buddy approved"**

**Git commands — after approval only:**

```bash
git add scripts/preview-buddy.ts
```

```bash
git commit -m "chore: guard dog buddy preview — approved design"
```

---

### 1.4 UI Preview — design and approve terminal output

> **This step produces a file that MUST be deleted before Phase 2 starts.**
> Nothing here connects to any real module. It is purely visual text using chalk.

**AI tasks:**
- Create `scripts/preview-ui.ts` — a standalone script that prints every output pattern the tool will ever produce, using chalk for colors, with realistic-looking text (not real data)
- The guard dog idle state appears at the very top of the preview
- Patterns to cover:
  - Guard dog + version header (idle state)
  - Section header (DEPS AUDIT, ENV AUDIT, REACT AUDIT separators)
  - Error line (`✗ KEY_NAME   reason text`)
  - Warning line (`⚠ KEY_NAME   reason text`)
  - Passed count line (`PASSED (9) ✔`)
  - Unused package line with suggestion
  - Outdated version line (`axios  3.0.0 → 3.1.2`)
  - Vulnerability line (`express@4.18.0  CVE-2024-29041  High`)
  - Dead import line (`src/components/OldModal.tsx  — imported nowhere`)
  - Re-render risk line with file and column
  - Bundle warning line with size and alternative
  - Summary block (`3 errors  4 warnings  9 passed`)
  - Guard dog error state at the bottom with final footer

**Human tasks:**
- Run the full UI preview:

```bash
npx ts-node scripts/preview-ui.ts
```

- Review every line — colors, spacing, alignment, symbols, wording
- Request any changes (Claude edits the script and you re-run)
- Once approved: **"UI approved"**

**Git commands — after approval only:**

```bash
git add scripts/preview-ui.ts
```

```bash
git commit -m "chore: full UI preview script — approved terminal output design"
```

---

### 1.5 Build reporter.ts + buddy.ts from approved designs — then delete previews

**AI tasks:**
- Build `src/reporter.ts` from scratch, matching the approved output exactly
- Build `src/buddy.ts` — exports `printBuddy(state: 'idle' | 'clear' | 'error')` using the approved dog design
- `reporter.ts` exports: `printHeader()`, `printError()`, `printWarning()`, `printPassed()`, `printSummary()`
- Delete both preview scripts completely — zero trace remains

**Human tasks:**
- Confirm both preview scripts are gone:

```bash
ls scripts/
```

**Git commands:**

```bash
git add src/reporter.ts src/buddy.ts
```

```bash
git rm scripts/preview-buddy.ts scripts/preview-ui.ts
```

```bash
git commit -m "feat: reporter.ts and buddy.ts built from approved designs — preview scripts removed"
```

---

### 1.6 fileWalker + httpClient + astHelpers utilities

**AI tasks:**
- `src/utils/fileWalker.ts` — recursive walker using `ignore` package for `.gitignore`; inode Set for symlink cycle prevention
- `src/utils/httpClient.ts` — thin fetch wrapper with 24hr disk cache at `~/.devguard/cache.json`
- `src/utils/astHelpers.ts` — shared `@babel/parser` setup with JSX + TypeScript plugins enabled

**Human tasks:**
- Run `npm test` — all utility unit tests must pass

**Git commands:**

```bash
git add src/utils/
```

```bash
git commit -m "feat(utils): fileWalker with inode cycle guard, httpClient with disk cache, astHelpers"
```

```bash
git push -u origin feature/project-scaffold
```

```bash
gh pr create --title "feat: project scaffolding — types, build config, utilities" --body "Adds shared types, verified tsup/vitest config, fileWalker, httpClient with disk cache, and astHelpers." --base develop
```

```bash
gh pr merge --merge
```

```bash
git checkout develop && git pull
```

**Live test after Phase 1:**

```bash
npm run build
```

```bash
node dist/index.js --help
```

```bash
node dist/index.js --version
```

---

### Phase 1 push to main

```bash
git checkout main
```

```bash
git merge develop --no-ff -m "feat: phase 1 — project scaffolding complete"
```

```bash
git push origin main
```

```bash
git checkout develop
```

---

## Phase 2 — `env` Module (v1.0)

```bash
git checkout -b feature/env-module
```

### 2.1 Parser

**AI tasks:** `src/modules/env/parser.ts` — reads `.env` and `.env.example`, returns typed key-value maps

**Human tasks:** Verify it correctly parses `test-project/.env` without errors

**Git commands:**

```bash
git add src/modules/env/parser.ts
```

```bash
git commit -m "feat(env): add .env and .env.example parser"
```

---

### 2.2 Validation rules

**AI tasks:** Implement all 8 rules in `src/modules/env/rules/`:

| File | Rule |
|---|---|
| `missing.ts` | Key in example but absent in `.env` |
| `insecure.ts` | Placeholder values (secret, changeme, etc.) |
| `type.ts` | PORT not a number, boolean mismatch |
| `url.ts` | Malformed URL (missing protocol) |

Plus: empty value, undeclared key, weak secret length checks.

**Human tasks:** Run against `test-project/.env` — confirm each rule fires correctly

**Git commands:**

```bash
git add src/modules/env/rules/
```

```bash
git commit -m "feat(env): implement all 8 validation rules"
```

---

### 2.3 env command wiring + reporter output

**AI tasks:**
- `src/modules/env/index.ts` — runs all rules, collects results
- Wire into `src/cli.ts` `env` command
- `--file`, `--strict`, `--json` flags

**Human tasks:**
- Run `node dist/index.js env` against `test-project/`
- Confirm errors/warnings/passed output is correct and color-coded
- Run `node dist/index.js env --json` — confirm valid JSON output
- Run `node dist/index.js env --strict` — confirm exit code 1 on errors

**Git commands:**

```bash
git add src/modules/env/index.ts
```

```bash
git commit -m "feat(env): wire env command with --file, --strict, --json flags"
```

---

### 2.4 env tests

**AI tasks:** Write tests in `tests/env/` with fixture files in `fixtures/`

**Human tasks:** Run `npm test` — all env tests must pass

**Git commands:**

```bash
git add tests/env/ fixtures/
```

```bash
git commit -m "test(env): add unit tests for all 8 validation rules"
```

```bash
git push -u origin feature/env-module
```

```bash
gh pr create --title "feat(env): env validation module with 8 rules" --body "Parser, all 8 validation rules, CLI wiring with --file/--strict/--json flags, and unit tests." --base develop
```

```bash
gh pr merge --merge
```

```bash
git checkout develop && git pull
```

**Live test after Phase 2:**

```bash
node dist/index.js env --file test-project/.env
```

```bash
node dist/index.js env --json
```

```bash
node dist/index.js env --strict; echo "Exit code: $?"
```

---

### Phase 2 push to main

```bash
git checkout main
```

```bash
git merge develop --no-ff -m "feat: phase 2 — env module complete (v1.0 partial)"
```

```bash
git push origin main
```

```bash
git checkout develop
```

---

## Phase 3 — `deps` Module (v1.0)

```bash
git checkout -b feature/deps-module
```

### 3.1 AST import extractor

**AI tasks:** Walk all JS/TS source files, extract third-party import names, compare to `package.json` dependencies → return unused list

**Human tasks:** Run against `test-project/` and spot-check the unused list

**Git commands:**

```bash
git add src/modules/deps/unused.ts
```

```bash
git commit -m "feat(deps): AST import extractor and unused package detector"
```

---

### 3.2 Outdated versions — npm Registry (parallel)

**AI tasks:** `src/modules/deps/outdated.ts` — fetch all packages in parallel via `Promise.all()`, compare current vs latest; results go through disk cache

**Human tasks:** Run and confirm output is fast (should finish in 2–3s for a 50-package project)

**Git commands:**

```bash
git add src/modules/deps/outdated.ts
```

```bash
git commit -m "feat(deps): parallel npm registry checks for outdated versions with disk cache"
```

---

### 3.3 Vulnerabilities — OSV.dev batch

**AI tasks:** `src/modules/deps/vulns.ts` — single `/v1/querybatch` POST with all packages, parse CVE results

**Human tasks:** Run and confirm vuln results match `npm audit` output for `test-project/`

**Git commands:**

```bash
git add src/modules/deps/vulns.ts
```

```bash
git commit -m "feat(deps): OSV.dev batch vulnerability check — single POST for all packages"
```

---

### 3.4 Alternatives suggestion — embedded static list

**AI tasks:** `src/modules/deps/alternatives.ts` — embedded static TS object of heavy→light package pairs (no API call), cross-referenced against unused/detected packages

**Human tasks:** Confirm moment/lodash/axios suggestions appear when those are in `package.json`

**Git commands:**

```bash
git add src/modules/deps/alternatives.ts
```

```bash
git commit -m "feat(deps): embedded static alternatives list — no API call required"
```

---

### 3.5 deps command wiring + tests

**AI tasks:**
- `src/modules/deps/index.ts` — runs all checks, collects results
- Wire into `src/cli.ts` `deps` command
- `tests/deps/` with fixture `package.json` files

**Human tasks:**
- Run `node dist/index.js deps`
- Run `npm test` — all deps tests must pass

**Git commands:**

```bash
git add src/modules/deps/index.ts tests/deps/
```

```bash
git commit -m "feat(deps): wire deps command and add unit tests"
```

```bash
git push -u origin feature/deps-module
```

```bash
gh pr create --title "feat(deps): deps module — unused, outdated, vulns, alternatives" --body "AST import extractor, parallel npm registry checks, OSV.dev batch vuln scan, static alternatives list, and unit tests." --base develop
```

```bash
gh pr merge --merge
```

```bash
git checkout develop && git pull
```

**Live test after Phase 3:**

```bash
node dist/index.js deps
```

```bash
node dist/index.js deps --json
```

---

### Phase 3 push to main

```bash
git checkout main
```

```bash
git merge develop --no-ff -m "feat: phase 3 — deps module complete"
```

```bash
git push origin main
```

```bash
git checkout develop
```

---

## Phase 4 — Base `devguard` Command + v1.0 Ship

```bash
git checkout -b feature/base-command
```

### 4.1 Root devguard command

**AI tasks:**
- Auto-detect React project (check for `react` in `package.json` deps)
- Run `deps` + `env` together in parallel
- Unified summary report: `X errors, Y warnings, Z passed`
- Polish terminal output (separators, spacing, colors)

**Human tasks:**
- Run `node dist/index.js` in `test-project/`
- Confirm both audits run and summary appears at the bottom

**Git commands:**

```bash
git add src/cli.ts src/reporter.ts
```

```bash
git commit -m "feat: root devguard command — runs deps + env with unified summary"
```

```bash
git push -u origin feature/base-command
```

```bash
gh pr create --title "feat: root devguard command with unified summary" --body "Auto-detects React projects, runs deps + env in parallel, outputs unified error/warning/passed summary." --base develop
```

```bash
gh pr merge --merge
```

```bash
git checkout develop && git pull
```

---

### 4.2 README + npm publish (v1.0.0)

**Human tasks:**
- Record terminal demo GIF with `asciinema`
- Update README with usage examples and the GIF
- Bump version in `package.json` to `1.0.0`

**Git commands:**

```bash
git add README.md package.json
```

```bash
git commit -m "docs: update README for v1.0.0 with usage examples"
```

```bash
git tag v1.0.0
```

```bash
git push origin develop
```

```bash
git push origin v1.0.0
```

> Tag push triggers `publish.yml` → CI runs tests → publishes to npm automatically

### Phase 4 push to main

```bash
git checkout main
```

```bash
git merge develop --no-ff -m "release: v1.0.0 — deps + env modules"
```

```bash
git push origin main
```

```bash
git checkout develop
```

**Live test after Phase 4 (v1.0 ship):**

```bash
npx devguard@1.0.0
```

```bash
npx devguard@1.0.0 env --strict
```

```bash
npx devguard@1.0.0 deps --json
```

---

## Phase 5 — `react:imports` (v1.1)

```bash
git checkout -b feature/react-imports
```

### 5.1 Entry point detection

**AI tasks:**
- Auto-detect project entry: `src/index.tsx`, `src/main.tsx`, `app/`, `pages/`, `vite.config.ts`
- If none found: warn user, require `--entry <file>` flag — do not guess

**Git commands:**

```bash
git add src/modules/react/imports.ts
```

```bash
git commit -m "feat(react:imports): entry point auto-detection with --entry fallback"
```

---

### 5.2 Cross-file import graph with cycle guard

**AI tasks:**
- Build full import graph from entry point outward
- `visited: Set<string>` of resolved absolute paths passed through every recursive call — return immediately if already visited
- Map every imported name vs every used name in JSX/code

**Human tasks:** Run against a React project that has circular imports — confirm it doesn't hang

**Git commands:**

```bash
git add src/modules/react/imports.ts
```

```bash
git commit -m "feat(react:imports): cross-file import graph with visited-set cycle guard"
```

---

### 5.3 Dead component + unused import reporter + tests

**AI tasks:**
- Flag files imported nowhere
- Flag named imports unused in their own file
- `tests/react/imports.test.ts` with fixture React files

**Human tasks:**
- Run `node dist/index.js react:imports` against `test-project/`
- Run `npm test` — all react:imports tests must pass

**Git commands:**

```bash
git add src/modules/react/imports.ts tests/react/ fixtures/
```

```bash
git commit -m "feat(react:imports): dead component and unused import reporter with tests"
```

```bash
git push -u origin feature/react-imports
```

```bash
gh pr create --title "feat(react:imports): dead component and unused import detector" --body "Entry point auto-detection, cross-file import graph with visited-set cycle guard, dead component and unused import reporter with tests." --base develop
```

```bash
gh pr merge --merge
```

```bash
git checkout develop && git pull
```

**Live test after Phase 5:**

```bash
node dist/index.js react:imports
```

```bash
node dist/index.js react:imports --entry src/main.tsx
```

---

### Phase 5 push + tag (v1.1.0)

**Human tasks:** Bump `package.json` version to `1.1.0`

```bash
git add package.json
```

```bash
git commit -m "chore: bump version to 1.1.0"
```

```bash
git checkout main
```

```bash
git merge develop --no-ff -m "release: v1.1.0 — react:imports module"
```

```bash
git tag v1.1.0
```

```bash
git push origin main
```

```bash
git push origin v1.1.0
```

```bash
git checkout develop
```

---

## Phase 6 — `react:rerenders` + `react:hooks` (v1.2)

```bash
git checkout -b feature/react-code-quality
```

### 6.1 Re-render pattern detector

**AI tasks:**
- Detect inline object literals in JSX props `style={{ color: 'red' }}`
- Detect inline arrow functions in JSX props `onClick={() => fn()}`
- Detect components missing `React.memo` wrapper
- Detect object/array literals in `useEffect`/`useMemo`/`useCallback` dep arrays

**Human tasks:** Run against `test-project/` and confirm no false positives on simple components

**Git commands:**

```bash
git add src/modules/react/rerenders.ts
```

```bash
git commit -m "feat(react:rerenders): inline object/function and missing memo detection"
```

---

### 6.2 Hooks rule linter (AST-only, scoped)

**AI tasks:** Detect only what pure AST can do reliably:
- Hook called inside `if`/`else` block
- Hook called inside `for`/`while`/`do` loop
- Hook called inside a nested function
- Hook called from a non-hook, non-component function name

> Missing deps array check is intentionally excluded — requires data-flow analysis

**Human tasks:** Run against a file with known hook violations, confirm line numbers are correct

**Git commands:**

```bash
git add src/modules/react/hooks.ts
```

```bash
git commit -m "feat(react:hooks): AST-only hooks rule linter (conditional, loop, nested function violations)"
```

---

### 6.3 Wire commands + tests

**AI tasks:**
- Wire `react:rerenders` and `react:hooks` into `src/cli.ts`
- `tests/react/rerenders.test.ts` and `tests/react/hooks.test.ts`

**Human tasks:**
- Run `node dist/index.js react:rerenders`
- Run `node dist/index.js react:hooks`
- Run `npm test` — all tests must pass

**Git commands:**

```bash
git add tests/react/ fixtures/
```

```bash
git commit -m "test(react): add rerenders and hooks unit tests"
```

```bash
git push -u origin feature/react-code-quality
```

```bash
gh pr create --title "feat(react): rerenders pattern detector and hooks linter" --body "Detects inline objects/functions in JSX props, missing memo wrappers, and hook rule violations (conditional, loop, nested function)." --base develop
```

```bash
gh pr merge --merge
```

```bash
git checkout develop && git pull
```

**Live test after Phase 6:**

```bash
node dist/index.js react:rerenders
```

```bash
node dist/index.js react:hooks
```

---

### Phase 6 push + tag (v1.2.0)

**Human tasks:** Bump `package.json` version to `1.2.0`

```bash
git add package.json
```

```bash
git commit -m "chore: bump version to 1.2.0"
```

```bash
git checkout main
```

```bash
git merge develop --no-ff -m "release: v1.2.0 — react:rerenders and react:hooks"
```

```bash
git tag v1.2.0
```

```bash
git push origin main
```

```bash
git push origin v1.2.0
```

```bash
git checkout develop
```

---

## Phase 7 — `react:bundle` (v1.3)

```bash
git checkout -b feature/react-bundle
```

### 7.1 Embedded static package list

**AI tasks:**
- Create `src/modules/react/bundleData.ts` — static TS object with size + alternative for top-30 heavy packages
- Extract all third-party imports from source files

**Git commands:**

```bash
git add src/modules/react/bundleData.ts
```

```bash
git commit -m "feat(react:bundle): embedded static size and alternatives list for top-30 packages"
```

---

### 7.2 Bundlephobia fallback + named import labelling

**AI tasks:**
- For packages not in static list: query Bundlephobia via httpClient (cached)
- Named imports (`import { x } from 'pkg'`) labelled `⚠ may be tree-shaken` — not reported as full size
- Flag packages over 50KB threshold (configurable)

**Human tasks:** Run against a project using `moment` and `lodash` — confirm output shows correct sizes and suggestions

**Git commands:**

```bash
git add src/modules/react/bundle.ts
```

```bash
git commit -m "feat(react:bundle): Bundlephobia fallback + named import tree-shaking label"
```

---

### 7.3 Wire + tests

**AI tasks:**
- Wire `react:bundle` into `src/cli.ts`
- `tests/react/bundle.test.ts`

**Human tasks:**
- Run `node dist/index.js react:bundle`
- Run `npm test` — all tests must pass

**Git commands:**

```bash
git add tests/react/bundle.test.ts
```

```bash
git commit -m "test(react:bundle): add bundle size unit tests"
```

```bash
git push -u origin feature/react-bundle
```

```bash
gh pr create --title "feat(react:bundle): bundle size analyzer" --body "Static size list for top-30 packages, Bundlephobia fallback with disk cache, named import tree-shaking labels, 50KB threshold warnings." --base develop
```

```bash
gh pr merge --merge
```

```bash
git checkout develop && git pull
```

**Live test after Phase 7:**

```bash
node dist/index.js react:bundle
```

```bash
node dist/index.js react:bundle --json
```

---

### Phase 7 push + tag (v1.3.0)

**Human tasks:** Bump `package.json` version to `1.3.0`

```bash
git add package.json
```

```bash
git commit -m "chore: bump version to 1.3.0"
```

```bash
git checkout main
```

```bash
git merge develop --no-ff -m "release: v1.3.0 — react:bundle module"
```

```bash
git tag v1.3.0
```

```bash
git push origin main
```

```bash
git push origin v1.3.0
```

```bash
git checkout develop
```

---

## Phase 8 — `react:a11y` + `react:server` (v2.0)

```bash
git checkout -b feature/react-advanced
```

### 8.1 react:a11y — file-scoped accessibility scan

**AI tasks:** Implement file-scoped JSX checks only:
- `<img>` missing `alt`
- `<button>` with no accessible label
- `<div onClick>` — should be `<button>`
- `<input>` missing label association
- `<a>` with no `href` or `role`
- Empty link text `<a href="..."></a>`

> Heading level order and form submit checks are excluded — require cross-file render tree

**Human tasks:** Run against `test-project/` — confirm flagged items are real issues (no false positives on design-system wrappers)

**Git commands:**

```bash
git add src/modules/react/a11y.ts
```

```bash
git commit -m "feat(react:a11y): file-scoped JSX accessibility scanner (img, button, input, anchor checks)"
```

---

### 8.2 react:server — RSC boundary checker

**AI tasks:**
- Scan for `"use client"` / `"use server"` directives at top of files
- Build import graph (with `visited: Set<string>` cycle guard) to trace cross-boundary violations
- Flag: server component importing client-only hook (`useState`, `useEffect`, etc.)
- Flag: server component using browser API (`window`, `document`, `localStorage`)
- Flag: client component importing `next/headers`, `next/server` server-only modules

**Human tasks:** Run against a Next.js App Router project — confirm violations are real and cycle guard doesn't hang

**Git commands:**

```bash
git add src/modules/react/server.ts
```

```bash
git commit -m "feat(react:server): RSC boundary checker with import graph cycle guard"
```

---

### 8.3 Wire + tests + `react` umbrella command

**AI tasks:**
- Wire `react:a11y` and `react:server` into `src/cli.ts`
- `react` umbrella command runs all react sub-checks
- `tests/react/a11y.test.ts` and `tests/react/server.test.ts`

**Human tasks:**
- Run `node dist/index.js react` — confirm all checks run in sequence
- Run `npm test` — all tests must pass

**Git commands:**

```bash
git add tests/react/ src/cli.ts
```

```bash
git commit -m "feat: react umbrella command + a11y and server tests"
```

```bash
git push -u origin feature/react-advanced
```

```bash
gh pr create --title "feat(react): a11y scanner and RSC boundary checker" --body "File-scoped JSX accessibility checks (img, button, input, anchor), RSC boundary checker with import graph cycle guard, react umbrella command." --base develop
```

```bash
gh pr merge --merge
```

```bash
git checkout develop && git pull
```

**Live test after Phase 8:**

```bash
node dist/index.js react
```

```bash
node dist/index.js react:a11y
```

```bash
node dist/index.js react:server
```

```bash
node dist/index.js --json
```

---

### Phase 8 push + tag (v2.0.0)

**Human tasks:** Bump `package.json` version to `2.0.0`

```bash
git add package.json
```

```bash
git commit -m "chore: bump version to 2.0.0"
```

```bash
git checkout main
```

```bash
git merge develop --no-ff -m "release: v2.0.0 — react:a11y and react:server — full tool complete"
```

```bash
git tag v2.0.0
```

```bash
git push origin main
```

```bash
git push origin v2.0.0
```

```bash
git checkout develop
```

---

## CI/CD — What Happens on Each Action

| Action | What triggers | What must pass |
|---|---|---|
| Push to `feature/*` | `test.yml` | Build + tests |
| Open PR → `develop` | `test.yml` | Build + tests (block merge if red) |
| Push to `develop` | `test.yml` | Build + tests |
| Merge `develop` → `main` | `test.yml` | Build + tests |
| Push `v*.*.*` tag | `publish.yml` | Tests → npm publish |

> If CI is red on a feature branch, fix it before opening the PR. Never force-merge.

---

## Task Division Summary

| Area | AI (Claude) | Human |
|---|---|---|
| Writing source files | All modules, utils, tests | Review, spot-check |
| Writing workflow files | Both `.github/workflows/` files | Add `NPM_TOKEN` secret |
| Repo rename | `package.json` + code references | GitHub Settings rename + remote URL |
| Live testing | Cannot test | Run every live test block |
| npm publish | `publish.yml` triggers it | Bump version, push tag |
| README + demo GIF | README content | Record GIF with asciinema |
| Dependency decisions | Research + implement | Approve choices |
| Git commits | Provide exact commands | Run them |
| Branch PRs | Cannot open | Open PR on GitHub, merge after CI |

---

## Dev Menu Script (scripts/dev-menu.sh)

```bash
#!/usr/bin/env bash
# Arrow-key interactive command selector using fzf
# Usage: bash scripts/dev-menu.sh

commands=(
  "build          → npm run build"
  "test           → npm test"
  "test:watch     → npm run test:watch"
  "dev            → npm run dev"
  "lint           → npm run lint"
  "env            → node dist/index.js env"
  "deps           → node dist/index.js deps"
  "react          → node dist/index.js react"
  "react:imports  → node dist/index.js react:imports"
  "react:rerenders→ node dist/index.js react:rerenders"
  "react:hooks    → node dist/index.js react:hooks"
  "react:bundle   → node dist/index.js react:bundle"
  "react:a11y     → node dist/index.js react:a11y"
  "react:server   → node dist/index.js react:server"
  "full audit     → node dist/index.js"
  "full audit json→ node dist/index.js --json"
)

selected=$(printf '%s\n' "${commands[@]}" | fzf --height=50% --border --prompt="devguard > ")

if [ -z "$selected" ]; then
  exit 0
fi

cmd=$(echo "$selected" | sed 's/.*→ //')
echo "Running: $cmd"
eval "$cmd"
```

> Run it: `bash scripts/dev-menu.sh`
> Arrow keys to navigate, Enter to run, Esc to cancel.
