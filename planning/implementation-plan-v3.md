# devguard — Implementation Plan v3+ (Post-v2.0 Features)

> This plan covers every new feature from the tasks.md backlog.
> The previous plan (implementation-plan.md) covers v1.0 → v2.0.
> Start here once v2.0.0 is shipped and on npm.
>
> **How to read this:** Each phase = one feature branch. Every git command is
> in its own code block — triple-click to select, paste into terminal.

---

## Branch Strategy (same as always)

```
main        ← stable releases only
develop     ← integration branch, all features merge here first
feature/*   ← one branch per feature, always branch off develop
```

Never commit directly to `main`. Every feature branch → PR → develop → CI green → merge.

---

## Version Plan

| Phase | Feature | Version |
|---|---|---|
| 9  | Health Score | v2.1.0 |
| 10 | GitHub Actions Marketplace action | v2.2.0 |
| 11 | License Audit | v2.3.0 |
| 12 | Git Secret Scan | v2.4.0 |
| 13 | SARIF Output | v2.5.0 |
| 14 | Auto-fix Unused Deps | v2.6.0 |
| 15 | Supply Chain Risk | v2.7.0 |
| 16 | Pre-commit Hook Setup | v2.8.0 |
| 17 | Zod Schema Generation | v3.0.0 |
| 18 | Hardcoded Secrets in Source | v3.1.0 |
| 19 | Config File Support | v3.2.0 |
| 20 | Duplicate Deps Detection | v3.3.0 |

---

## Two Repositories Involved

| Repo | Purpose | URL |
|---|---|---|
| `devguard` (this repo) | Main CLI tool | `github.com/kevinpatildxd/devguard` |
| `devguard-action` (new repo) | GitHub Actions Marketplace action | `github.com/kevinpatildxd/devguard-action` |

The `devguard-action` repo is created fresh in Phase 10. It is a thin wrapper — it just calls `npx @kevinpatil/devguard` with the right flags.

---

---

## Phase 9 — Health Score (`devguard --score`) — v2.1.0

**What it does:** Aggregates all existing check results into a 0–100 score shown at the end of every full run. No new detection logic — just math on counts we already have.

**Scoring formula:**
- Start at 100
- Each error: -10 points
- Each warning: -3 points
- Floor at 0 (never goes negative)

**Output:**
```
  Project Health Score
  ─────────────────────
  ████████████████░░░░  82 / 100
  3 errors · 6 warnings
```

### Step 1 — Branch

```bash
git checkout develop && git pull
```

```bash
git checkout -b feature/health-score
```

---

### Step 2 — Add score calculator to reporter.ts

**What to build:** Add `printHealthScore(errors: number, warnings: number)` to `src/reporter.ts`.

- Score = Math.max(0, 100 - (errors * 10) - (warnings * 3))
- Color the number: green ≥ 80, yellow 50–79, red < 50
- Print a filled progress bar using chalk (filled = `█`, empty = `░`, width = 20 chars)

```bash
git add src/reporter.ts
```

```bash
git commit -m "feat: add printHealthScore to reporter — weighted error/warning formula"
```

---

### Step 3 — Call printHealthScore in root command

**What to change in `src/cli.ts`:** After `printSummary()` in the root `devguard` command action, call `printHealthScore(totalErrors, totalWarnings)`.

Also add `--score` flag to the root command: when passed, skip all detail output and print score only.

```bash
git add src/cli.ts
```

```bash
git commit -m "feat: print health score at end of full devguard run, add --score flag"
```

---

### Step 4 — Tests

Write `tests/reporter/health-score.test.ts`:
- Score 100 when 0 errors, 0 warnings
- Score 90 when 1 error
- Score 0 when 10+ errors (floor)
- Score colors correct per threshold

```bash
git add tests/reporter/
```

```bash
git commit -m "test: health score calculator unit tests"
```

---

### Step 5 — Push, PR, merge

```bash
git push -u origin feature/health-score
```

```bash
gh pr create --title "feat: project health score (0-100)" --body "Aggregates existing check results into a weighted 0-100 score. Errors cost 10pts, warnings cost 3pts. Printed as a colored progress bar at the end of every full run. Adds --score flag for score-only output." --base develop
```

> Wait for CI to go green, then:

```bash
gh pr merge --merge
```

```bash
git checkout develop && git pull
```

---

### Step 6 — Live test

```bash
npm run build
```

```bash
node dist/index.js
```

> Confirm score appears at the bottom with correct color.

```bash
node dist/index.js --score
```

> Confirm only the score prints, no other output.

---

### Step 7 — Ship v2.1.0

```bash
git checkout develop
```

```bash
# Edit package.json version field to "2.1.0"
```

```bash
git add package.json
```

```bash
git commit -m "chore: bump version to 2.1.0"
```

```bash
git checkout main && git merge develop --no-ff -m "release: v2.1.0 — health score"
```

```bash
git tag v2.1.0
```

```bash
git push origin main && git push origin v2.1.0
```

```bash
git checkout develop
```

> Tag push triggers `publish.yml` → CI → npm publish automatically.

---

---

## Phase 10 — GitHub Actions Marketplace Action — v2.2.0

**What it does:** Publishes a `devguard-action` to the GitHub Actions Marketplace so any project can add devguard to CI with 3 lines of YAML. This involves a **separate GitHub repo** (`devguard-action`).

### Step 1 — Create the devguard-action repo on GitHub

**Human tasks:**
1. Go to https://github.com/new
2. Repo name: `devguard-action`
3. Description: `Run devguard project health checks in GitHub Actions`
4. Visibility: Public
5. License: MIT
6. Click Create repository

Clone it locally (in a different folder from the main devguard repo):

```bash
cd ~/Desktop/myprojects
```

```bash
git clone https://github.com/kevinpatildxd/devguard-action.git
```

```bash
cd devguard-action
```

---

### Step 2 — Create the action files

**Create `action.yml`** (this is the file GitHub Marketplace reads):

```yaml
name: 'devguard'
description: 'Validate env files, audit dependencies, and check React code quality in one command'
author: 'kevinpatildxd'

branding:
  icon: 'shield'
  color: 'green'

inputs:
  strict:
    description: 'Exit with code 1 if any errors are found'
    required: false
    default: 'true'
  command:
    description: 'devguard command to run (default: full audit). Options: env, deps, react'
    required: false
    default: ''
  args:
    description: 'Extra CLI arguments (e.g. --json, --score, --file .env.production)'
    required: false
    default: ''

outputs:
  score:
    description: 'Project health score (0-100)'

runs:
  using: 'composite'
  steps:
    - name: Run devguard
      shell: bash
      run: |
        CMD="npx --yes @kevinpatil/devguard"
        if [ -n "${{ inputs.command }}" ]; then
          CMD="$CMD ${{ inputs.command }}"
        fi
        if [ "${{ inputs.strict }}" = "true" ]; then
          CMD="$CMD --strict"
        fi
        if [ -n "${{ inputs.args }}" ]; then
          CMD="$CMD ${{ inputs.args }}"
        fi
        echo "Running: $CMD"
        $CMD
```

**Create `README.md`** for the action repo:

```markdown
# devguard-action

Run [devguard](https://github.com/kevinpatildxd/devguard) in GitHub Actions.

## Usage

### Full audit (env + deps + react)

    - name: Run devguard
      uses: kevinpatildxd/devguard-action@v1

### Env only (strict mode)

    - name: Validate env
      uses: kevinpatildxd/devguard-action@v1
      with:
        command: env
        strict: 'true'

### Deps only

    - name: Audit deps
      uses: kevinpatildxd/devguard-action@v1
      with:
        command: deps

## Inputs

| Input | Required | Default | Description |
|---|---|---|---|
| `strict` | No | `true` | Exit code 1 on errors |
| `command` | No | `` | Subcommand (env, deps, react, etc.) |
| `args` | No | `` | Extra CLI flags |
```

---

### Step 3 — Commit and tag the action repo

```bash
git add action.yml README.md LICENSE
```

```bash
git commit -m "feat: initial devguard-action for GitHub Actions Marketplace"
```

```bash
git push origin main
```

```bash
git tag v1.0.0
```

```bash
git push origin v1.0.0
```

---

### Step 4 — Publish to GitHub Marketplace

**Human tasks:**
1. Go to the `devguard-action` repo on GitHub
2. Click the **Releases** tab → **Draft a new release**
3. Choose tag `v1.0.0`
4. Check the box: **Publish this Action to the GitHub Marketplace**
5. Fill in:
   - **Primary category:** Continuous Integration
   - **Secondary category:** Testing
6. Add release notes (copy from README)
7. Click **Publish release**

> The action is now live at: `github.com/marketplace/actions/devguard`

---

### Step 5 — Add the action badge + usage to devguard main README

Back in the main devguard repo:

```bash
cd ~/Desktop/myprojects/envguard
```

```bash
git checkout develop && git pull
```

```bash
git checkout -b feature/action-docs
```

Add to `README.md` under the CI Integration section:

```markdown
### GitHub Actions (Marketplace)

    - name: Run devguard
      uses: kevinpatildxd/devguard-action@v1
```

Add badge at the top of README:

```markdown
[![GitHub Action](https://img.shields.io/badge/GitHub_Action-available-2088FF?logo=githubactions)](https://github.com/marketplace/actions/devguard)
```

```bash
git add README.md
```

```bash
git commit -m "docs: add devguard-action Marketplace usage and badge to README"
```

```bash
git push -u origin feature/action-docs
```

```bash
gh pr create --title "docs: add GitHub Actions Marketplace integration" --body "Adds action badge and usage example to README. The devguard-action is now live on the Marketplace." --base develop
```

```bash
gh pr merge --merge
```

```bash
git checkout develop && git pull
```

---

### Step 6 — Bump version in main repo to v2.2.0

```bash
# Edit package.json version to "2.2.0"
```

```bash
git add package.json
```

```bash
git commit -m "chore: bump version to 2.2.0"
```

```bash
git checkout main && git merge develop --no-ff -m "release: v2.2.0 — GitHub Actions Marketplace action"
```

```bash
git tag v2.2.0
```

```bash
git push origin main && git push origin v2.2.0
```

```bash
git checkout develop
```

---

---

## Phase 11 — License Audit (`devguard deps --licenses`) — v2.3.0

**What it does:** Fetches the license for every installed dependency from the npm registry and flags GPL/AGPL packages that are problematic in commercial projects.

**Output:**
```
── LICENSE AUDIT ───────────────────────────────
  ✗ mongoose@8.0.0      — AGPL-3.0  (use with caution in commercial projects)
  ⚠ sequelize@6.37.0   — MIT        ✔
  ⚠ express@4.19.0     — MIT        ✔
```

### Step 1 — Branch

```bash
git checkout develop && git pull
```

```bash
git checkout -b feature/license-audit
```

---

### Step 2 — Build the license fetcher

**Create `src/modules/deps/licenses.ts`:**

- Read all deps from `package.json` (`dependencies` + `devDependencies`)
- For each package, fetch `https://registry.npmjs.org/<name>/latest` (already cached by httpClient)
- Extract the `license` field from the response
- Classify:
  - `MIT`, `ISC`, `BSD-*`, `Apache-2.0` → OK (green)
  - `GPL-2.0`, `GPL-3.0` → WARNING (yellow — restrictive copyleft)
  - `AGPL-3.0` → ERROR (red — network copyleft, affects SaaS)
  - `UNLICENSED`, `SEE LICENSE IN FILE`, `CUSTOM` → WARNING (yellow — unknown)

```bash
git add src/modules/deps/licenses.ts
```

```bash
git commit -m "feat(deps): license fetcher — classifies MIT/BSD/GPL/AGPL from npm registry"
```

---

### Step 3 — Add `--licenses` flag to deps command

In `src/cli.ts`, add `.option('--licenses', 'include license audit in deps output')` to the `deps` command.

In `src/modules/deps/index.ts`, call `runLicenses()` when the flag is set.

```bash
git add src/cli.ts src/modules/deps/index.ts
```

```bash
git commit -m "feat(deps): wire --licenses flag into deps command"
```

---

### Step 4 — Tests

Write `tests/deps/licenses.test.ts`:
- Mock npm registry responses for MIT, AGPL-3.0, unlicensed packages
- Verify classification logic
- Verify output counts (errors vs warnings)

```bash
git add tests/deps/licenses.test.ts
```

```bash
git commit -m "test(deps): license audit unit tests with mocked registry responses"
```

---

### Step 5 — Push, PR, merge, ship

```bash
git push -u origin feature/license-audit
```

```bash
gh pr create --title "feat(deps): license audit with --licenses flag" --body "Fetches license for all deps from npm registry. Flags AGPL-3.0 as error, GPL-2.0/3.0 and UNLICENSED as warnings. Uses existing httpClient disk cache." --base develop
```

```bash
gh pr merge --merge && git checkout develop && git pull
```

```bash
# Edit package.json version to "2.3.0"
git add package.json && git commit -m "chore: bump version to 2.3.0"
git checkout main && git merge develop --no-ff -m "release: v2.3.0 — license audit"
git tag v2.3.0 && git push origin main && git push origin v2.3.0
git checkout develop
```

**Live test:**

```bash
node dist/index.js deps --licenses
```

---

---

## Phase 12 — Git Secret Scan (`devguard env --scan-git`) — v2.4.0

**What it does:** Scans the git commit history for commits that accidentally added `.env*` files and checks if they contained real secret values.

**Output:**
```
── GIT SECRET SCAN ─────────────────────────────
  ✗ Commit a3f2c1b (2026-03-14) added .env
    Keys found: DATABASE_URL, JWT_SECRET, STRIPE_SECRET_KEY
    → Run: git filter-repo --path .env --invert-paths
```

### Step 1 — Branch

```bash
git checkout develop && git pull
```

```bash
git checkout -b feature/git-secret-scan
```

---

### Step 2 — Build the git scanner

**Create `src/modules/env/gitScan.ts`:**

1. Run `git log --diff-filter=A --pretty=format:"%H %ad %s" --date=short -- ".env*"` using `child_process.execSync`
2. For each commit hash found, run `git show <hash>:.env` (or the specific filename)
3. Parse the file content — check if any value looks like a real secret (non-empty, not a placeholder)
4. Use the same insecure-value detection logic from the `env` module (reuse `src/modules/env/rules/insecure.ts`)
5. Report: commit hash (short), date, filename, list of key names found (never print the values themselves)
6. Suggest the `git filter-repo` remediation command

**Handle errors gracefully:**
- If `git` is not installed: print a warning and skip
- If not in a git repo: print a warning and skip
- If `git show` fails (file was deleted): skip that commit

```bash
git add src/modules/env/gitScan.ts
```

```bash
git commit -m "feat(env): git history secret scanner — checks commits that added .env files"
```

---

### Step 3 — Add `--scan-git` flag + `--depth` option

In `src/cli.ts`, add to the `env` command:
```
.option('--scan-git', 'scan git history for accidentally committed .env files')
.option('--depth <n>', 'number of commits to scan (default: 50)', '50')
```

In `src/modules/env/index.ts`, call `runGitScan(depth)` when `--scan-git` is set.

```bash
git add src/cli.ts src/modules/env/index.ts
```

```bash
git commit -m "feat(env): add --scan-git and --depth flags to env command"
```

---

### Step 4 — Tests

Write `tests/env/git-scan.test.ts`:
- Create a temp directory, `git init`, make commits that add/modify/delete a `.env` file
- Run the scanner against it
- Verify it catches the commit that added the `.env`
- Verify it does NOT report commits that only modified or deleted it

```bash
git add tests/env/git-scan.test.ts
```

```bash
git commit -m "test(env): git secret scan with temp git repo fixture"
```

---

### Step 5 — Push, PR, merge, ship

```bash
git push -u origin feature/git-secret-scan
```

```bash
gh pr create --title "feat(env): git history secret scan (--scan-git)" --body "Scans git log for commits that added .env files. Reports commit hash, date, and key names found. Suggests git filter-repo remediation. Handles missing git gracefully." --base develop
```

```bash
gh pr merge --merge && git checkout develop && git pull
```

```bash
# Edit package.json version to "2.4.0"
git add package.json && git commit -m "chore: bump version to 2.4.0"
git checkout main && git merge develop --no-ff -m "release: v2.4.0 — git secret scan"
git tag v2.4.0 && git push origin main && git push origin v2.4.0
git checkout develop
```

**Live test:**

```bash
node dist/index.js env --scan-git
```

```bash
node dist/index.js env --scan-git --depth 100
```

---

---

## Phase 13 — SARIF Output (`--sarif`) — v2.5.0

**What it does:** Adds a `--sarif` output flag that serializes all devguard results into SARIF v2.1.0 format. When this is uploaded as a GitHub Actions artifact, GitHub displays violations as inline annotations directly in the PR diff.

**GitHub Actions usage:**
```yaml
- name: Run devguard
  uses: kevinpatildxd/devguard-action@v1
  with:
    args: '--sarif'

- name: Upload SARIF
  uses: github/codeql-action/upload-sarif@v3
  with:
    sarif_file: devguard.sarif
```

### Step 1 — Branch

```bash
git checkout develop && git pull
```

```bash
git checkout -b feature/sarif-output
```

---

### Step 2 — Build the SARIF serializer

**Create `src/utils/sarif.ts`:**

SARIF v2.1.0 structure needed:
```json
{
  "$schema": "https://json.schemastore.org/sarif-2.1.0.json",
  "version": "2.1.0",
  "runs": [{
    "tool": { "driver": { "name": "devguard", "version": "x.x.x", "rules": [] } },
    "results": []
  }]
}
```

Each `ValidationResult` / `DepsIssue` / `ReactIssue` maps to a SARIF `result`:
- `ruleId`: the rule name (e.g. `missing-key`, `unused-dep`)
- `level`: `"error"` or `"warning"` (maps from `severity`)
- `message.text`: the issue message
- `locations`: for React issues (have file + line), fill `physicalLocation.artifactLocation.uri` + `region.startLine`; for env/deps issues (no file), omit locations

Write the serialized JSON to `devguard.sarif` in the current directory.

```bash
git add src/utils/sarif.ts
```

```bash
git commit -m "feat: SARIF v2.1.0 serializer — maps all issue types to SARIF result format"
```

---

### Step 3 — Wire `--sarif` flag

In `src/cli.ts`, add `.option('--sarif', 'write results to devguard.sarif (GitHub Code Scanning format)')` to the root command and all subcommands.

When `--sarif` is set: collect all results, serialize, write to `devguard.sarif`, print confirmation message.

```bash
git add src/cli.ts
```

```bash
git commit -m "feat: wire --sarif flag across all devguard commands"
```

---

### Step 4 — Update devguard-action to support SARIF upload

In the `devguard-action` repo (separate repo, already cloned at `~/Desktop/myprojects/devguard-action`):

```bash
cd ~/Desktop/myprojects/devguard-action
```

Update `action.yml` to add a `sarif` input and an upload step:

```yaml
inputs:
  sarif:
    description: 'Upload results to GitHub Code Scanning (requires write permissions)'
    required: false
    default: 'false'

runs:
  using: 'composite'
  steps:
    - name: Run devguard
      shell: bash
      run: |
        # ... (existing run step, add --sarif when sarif=true)

    - name: Upload SARIF to GitHub Code Scanning
      if: inputs.sarif == 'true'
      uses: github/codeql-action/upload-sarif@v3
      with:
        sarif_file: devguard.sarif
```

```bash
git add action.yml
git commit -m "feat: add sarif input — uploads devguard.sarif to GitHub Code Scanning"
git push origin main
git tag v1.1.0 && git push origin v1.1.0
```

---

### Step 5 — Tests + push + PR + ship in main repo

```bash
cd ~/Desktop/myprojects/envguard
```

Write `tests/utils/sarif.test.ts`:
- Mock a set of env errors, deps issues, and react issues
- Run the serializer
- Verify output is valid SARIF v2.1.0 JSON (schema check)
- Verify severity maps correctly

```bash
git add tests/utils/ src/utils/sarif.ts
```

```bash
git push -u origin feature/sarif-output
```

```bash
gh pr create --title "feat: --sarif output for GitHub Code Scanning integration" --body "Serializes all issue types to SARIF v2.1.0. Write devguard.sarif to CWD. Displays inline PR annotations when uploaded via github/codeql-action/upload-sarif. Also updated devguard-action@v1.1.0 to support sarif input." --base develop
```

```bash
gh pr merge --merge && git checkout develop && git pull
```

```bash
# Edit package.json version to "2.5.0"
git add package.json && git commit -m "chore: bump version to 2.5.0"
git checkout main && git merge develop --no-ff -m "release: v2.5.0 — SARIF output for GitHub Code Scanning"
git tag v2.5.0 && git push origin main && git push origin v2.5.0
git checkout develop
```

---

---

## Phase 14 — Auto-fix Unused Deps (`devguard deps --fix`) — v2.6.0

**What it does:** After detecting unused packages, prompts the user to remove them. On confirm, removes from `package.json` and runs `npm uninstall`.

**Output:**
```
UNUSED PACKAGES (3)
  lodash, uuid, moment

Remove these packages? (y/N) > y

  Running: npm uninstall lodash uuid moment
  ✔ Done — 3 packages removed
```

### Step 1 — Branch

```bash
git checkout develop && git pull
```

```bash
git checkout -b feature/deps-fix
```

---

### Step 2 — Build the fix runner

**Create `src/modules/deps/fix.ts`:**

- Accept a list of package names to remove
- If `--dry-run`: print what would be removed, do nothing
- If interactive (default): prompt `Remove these X packages? (y/N)` using `process.stdin`
- If `--fix` (non-interactive): skip prompt, auto-apply
- On confirm: run `npm uninstall <pkg1> <pkg2> ...` using `child_process.execSync`
- Catch errors (e.g. package already removed) and print them gracefully

```bash
git add src/modules/deps/fix.ts
```

```bash
git commit -m "feat(deps): fix runner — interactive prompt + npm uninstall for unused packages"
```

---

### Step 3 — Wire `--fix` and `--dry-run` flags

In `src/cli.ts`, add to the `deps` command:
```
.option('--fix', 'remove unused packages (will prompt for confirmation)')
.option('--dry-run', 'show what --fix would do without making changes')
```

```bash
git add src/cli.ts src/modules/deps/index.ts
```

```bash
git commit -m "feat(deps): wire --fix and --dry-run flags"
```

---

### Step 4 — Tests

Write `tests/deps/fix.test.ts`:
- Use a temp directory with a fake `package.json`
- Mock `npm uninstall` (don't actually run npm in tests)
- Verify `--dry-run` makes no changes
- Verify `--fix` calls uninstall with correct package list

```bash
git add tests/deps/fix.test.ts
```

```bash
git commit -m "test(deps): --fix and --dry-run with temp package.json fixture"
```

---

### Step 5 — Push, PR, merge, ship

```bash
git push -u origin feature/deps-fix
```

```bash
gh pr create --title "feat(deps): --fix flag to auto-remove unused packages" --body "Interactive confirmation prompt before running npm uninstall on unused packages. --dry-run shows changes without applying. --fix skips prompt for CI use." --base develop
```

```bash
gh pr merge --merge && git checkout develop && git pull
```

```bash
# Edit package.json version to "2.6.0"
git add package.json && git commit -m "chore: bump version to 2.6.0"
git checkout main && git merge develop --no-ff -m "release: v2.6.0 — deps --fix auto-remove unused packages"
git tag v2.6.0 && git push origin main && git push origin v2.6.0
git checkout develop
```

**Live test:**

```bash
node dist/index.js deps --dry-run
```

```bash
node dist/index.js deps --fix
```

---

---

## Phase 15 — Supply Chain Risk (`devguard deps --supply-chain`) — v2.7.0

**What it does:** Flags packages that pose supply chain risk: packages with install scripts (common attack vector), abandoned packages, and single-maintainer packages.

**Output:**
```
── SUPPLY CHAIN RISKS ──────────────────────────
  ✗ node-ipc@10.1.2       — has postinstall script (potential attack vector)
  ⚠ left-pad@1.3.0        — no updates in 3+ years (abandoned)
  ⚠ some-pkg@2.0.0        — single maintainer, no 2FA signal
```

### Step 1 — Branch

```bash
git checkout develop && git pull
```

```bash
git checkout -b feature/supply-chain
```

---

### Step 2 — Build the supply chain checker

**Create `src/modules/deps/supplyChain.ts`:**

For each dep, fetch `https://registry.npmjs.org/<name>` (full metadata, not `/latest`):

1. **Install scripts check:** Look at `versions[latest].scripts.preinstall` and `postinstall`. If present → ERROR with explanation.
2. **Abandoned check:** Look at `time[latest]`. If `Date.now() - lastPublished > 2 years` → WARNING.
3. **Single maintainer check:** Look at `maintainers` array length. If length === 1 → WARNING.

Use httpClient (already cached) — no new API dependencies.

```bash
git add src/modules/deps/supplyChain.ts
```

```bash
git commit -m "feat(deps): supply chain risk checker — install scripts, abandoned, single-maintainer"
```

---

### Step 3 — Wire `--supply-chain` flag

In `src/cli.ts`, add `.option('--supply-chain', 'check for supply chain risk signals')` to the `deps` command.

```bash
git add src/cli.ts src/modules/deps/index.ts
```

```bash
git commit -m "feat(deps): wire --supply-chain flag"
```

---

### Step 4 — Tests + push + PR + ship

Write `tests/deps/supply-chain.test.ts` with mocked npm registry responses.

```bash
git add tests/deps/supply-chain.test.ts
git push -u origin feature/supply-chain
```

```bash
gh pr create --title "feat(deps): supply chain risk signals (--supply-chain)" --body "Flags packages with install scripts (error), abandoned packages 2+ years old (warning), and single-maintainer packages (warning). Uses npm registry full metadata." --base develop
```

```bash
gh pr merge --merge && git checkout develop && git pull
```

```bash
# Edit package.json version to "2.7.0"
git add package.json && git commit -m "chore: bump version to 2.7.0"
git checkout main && git merge develop --no-ff -m "release: v2.7.0 — supply chain risk checker"
git tag v2.7.0 && git push origin main && git push origin v2.7.0
git checkout develop
```

---

---

## Phase 16 — Pre-commit Hook Setup (`devguard init --hooks`) — v2.8.0

**What it does:** One command wires devguard as a pre-commit hook. Detects Husky automatically. No manual setup required.

**Output:**
```
devguard init --hooks

  Detected Husky — writing .husky/pre-commit
  ✔ Hook installed

  devguard env --strict will run before every commit.
  To test it: git commit --allow-empty -m "test hook"
```

### Step 1 — Branch

```bash
git checkout develop && git pull
```

```bash
git checkout -b feature/init-hooks
```

---

### Step 2 — Build the hook installer

**Create `src/modules/init/hooks.ts`:**

1. Check if `node_modules/.bin/husky` exists → Husky detected
2. If Husky:
   - Check if `.husky/` directory exists; if not, print a warning to run `npx husky init` first
   - Write `.husky/pre-commit` with content: `npx @kevinpatil/devguard env --strict`
   - Run `chmod +x .husky/pre-commit`
3. If no Husky:
   - Write `.git/hooks/pre-commit` with content:
     ```bash
     #!/bin/sh
     npx @kevinpatil/devguard env --strict
     ```
   - Run `chmod +x .git/hooks/pre-commit`
4. Print confirmation and the command to test it

```bash
git add src/modules/init/hooks.ts
```

```bash
git commit -m "feat(init): hook installer — auto-detects Husky, falls back to .git/hooks"
```

---

### Step 3 — Add `devguard init` command to CLI

In `src/cli.ts`:

```typescript
program
  .command('init')
  .description('Set up devguard integrations — pre-commit hooks, config file')
  .option('--hooks', 'install devguard as a pre-commit hook')
  .action((opts) => {
    if (opts.hooks) runInitHooks();
  });
```

```bash
git add src/cli.ts
```

```bash
git commit -m "feat: add devguard init command with --hooks flag"
```

---

### Step 4 — Tests + push + PR + ship

Write `tests/init/hooks.test.ts`:
- Create a temp git repo with and without Husky
- Run the hook installer
- Verify the correct file is written with correct content
- Verify the file is executable

```bash
git add tests/init/ src/modules/init/
git push -u origin feature/init-hooks
```

```bash
gh pr create --title "feat: devguard init --hooks — one-command pre-commit setup" --body "Detects Husky automatically. Falls back to .git/hooks/pre-commit. Runs devguard env --strict before every commit. Zero manual setup." --base develop
```

```bash
gh pr merge --merge && git checkout develop && git pull
```

```bash
# Edit package.json version to "2.8.0"
git add package.json && git commit -m "chore: bump version to 2.8.0"
git checkout main && git merge develop --no-ff -m "release: v2.8.0 — devguard init --hooks"
git tag v2.8.0 && git push origin main && git push origin v2.8.0
git checkout develop
```

**Live test:**

```bash
node dist/index.js init --hooks
```

```bash
git commit --allow-empty -m "test hook"
```

> Confirm devguard env runs before the commit completes.

---

---

## Phase 17 — Zod Schema Generation (`devguard env --schema`) — v3.0.0

**What it does:** Reads `.env.example` and generates a `env.schema.ts` file with Zod validators. Teams get type-safe `process.env` with zero manual work.

**Output (`env.schema.ts`):**
```typescript
import { z } from 'zod';

export const envSchema = z.object({
  PORT: z.coerce.number(),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  ENABLE_CACHE: z.enum(['true', 'false']).transform(v => v === 'true'),
  API_KEY: z.string(),
});

export type Env = z.infer<typeof envSchema>;
```

### Step 1 — Branch

```bash
git checkout develop && git pull
```

```bash
git checkout -b feature/env-schema
```

---

### Step 2 — Build the type inferrer

**Create `src/modules/env/schemaGen.ts`:**

For each key in `.env.example`, infer the Zod type using the same heuristics as the existing type-mismatch rule:

| Key pattern | Inferred type |
|---|---|
| `PORT`, `TIMEOUT`, `*_COUNT`, `*_SIZE` | `z.coerce.number()` |
| `*_URL`, `*_URI` | `z.string().url()` |
| `*_SECRET`, `*_KEY`, `*_TOKEN` (and min length check) | `z.string().min(32)` |
| `ENABLE_*`, `FEATURE_*`, `IS_*`, `*_ENABLED` | `z.enum(['true', 'false']).transform(...)` |
| Anything else | `z.string()` |

Then generate the TypeScript file as a string and write it to `env.schema.ts`.

```bash
git add src/modules/env/schemaGen.ts
```

```bash
git commit -m "feat(env): Zod schema generator — infers types from .env.example key patterns"
```

---

### Step 3 — Wire `--schema` flag

In `src/cli.ts`, add `.option('--schema', 'generate env.schema.ts with Zod validators from .env.example')` to the `env` command.

```bash
git add src/cli.ts src/modules/env/index.ts
```

```bash
git commit -m "feat(env): wire --schema flag to env command"
```

---

### Step 4 — Tests + push + PR + ship

Write `tests/env/schema-gen.test.ts`:
- Test that `PORT` → `z.coerce.number()`
- Test that `DATABASE_URL` → `z.string().url()`
- Test that `JWT_SECRET` → `z.string().min(32)`
- Test that `ENABLE_CACHE` → `z.enum(['true', 'false'])`
- Test that unknown keys → `z.string()`
- Test that output file is valid TypeScript

```bash
git add tests/env/schema-gen.test.ts
git push -u origin feature/env-schema
```

```bash
gh pr create --title "feat(env): Zod schema generation (--schema)" --body "Generates env.schema.ts from .env.example with Zod validators. Infers types from key name patterns (PORT→number, *_URL→url, *_SECRET→min(32), ENABLE_*→boolean enum)." --base develop
```

```bash
gh pr merge --merge && git checkout develop && git pull
```

```bash
# Edit package.json version to "3.0.0"
git add package.json && git commit -m "chore: bump version to 3.0.0"
git checkout main && git merge develop --no-ff -m "release: v3.0.0 — Zod schema generation"
git tag v3.0.0 && git push origin main && git push origin v3.0.0
git checkout develop
```

**Live test:**

```bash
node dist/index.js env --schema
```

```bash
cat env.schema.ts
```

---

---

## Phase 18 — Hardcoded Secrets in Source (`devguard react:secrets`) — v3.1.0

**What it does:** Scans all `.ts`, `.tsx`, `.js`, `.jsx` files for string literals that look like hardcoded API keys, tokens, or credentials.

**Output:**
```
── HARDCODED SECRETS ───────────────────────────
  ✗ src/api/client.ts:12   — possible API key in string literal
      pattern matched: sk-[a-z0-9]{32,}
  ✗ src/config.ts:8        — possible AWS access key
      pattern matched: AKIA[A-Z0-9]{16}
```

Note: print only the file + line + pattern name. Never print the matched value.

### Step 1 — Branch

```bash
git checkout develop && git pull
```

```bash
git checkout -b feature/react-secrets
```

---

### Step 2 — Build the secret pattern scanner

**Create `src/modules/react/secrets.ts`:**

Define patterns as a static array of `{ name: string, regex: RegExp }`:

| Pattern name | Regex |
|---|---|
| OpenAI API key | `/sk-[a-zA-Z0-9]{32,}/` |
| AWS Access Key | `/AKIA[A-Z0-9]{16}/` |
| AWS Secret | `/[0-9a-zA-Z\/+]{40}/` (only in `AWS_SECRET` context) |
| GitHub token | `/ghp_[a-zA-Z0-9]{36}/` |
| Google API key | `/AIza[0-9A-Za-z\-_]{35}/` |
| Stripe key | `/sk_live_[a-zA-Z0-9]{24,}/` |
| Private key block | `/-----BEGIN (RSA )?PRIVATE KEY-----/` |
| Bearer token | `/Bearer [a-zA-Z0-9\-._~+\/]{20,}/` |
| Generic high-entropy string | Only flag if key name includes `secret`, `token`, `key`, `password`, `credential` AND value is 20+ chars |

Walk all source files using `fileWalker`, parse with `@babel/parser`, extract all `StringLiteral` AST nodes, test each against patterns.

```bash
git add src/modules/react/secrets.ts
```

```bash
git commit -m "feat(react:secrets): hardcoded secret detector — API keys, tokens, private keys"
```

---

### Step 3 — Wire `react:secrets` command

In `src/cli.ts`:
```typescript
program
  .command('react:secrets')
  .description('Scan source files for hardcoded API keys, tokens, and credentials')
  .option('--json', 'output results as JSON')
  .action((opts) => {
    runReactSecrets({ json: !!opts.json });
  });
```

Also add it to the `react` umbrella command.

```bash
git add src/cli.ts
```

```bash
git commit -m "feat: add react:secrets command to CLI and react umbrella"
```

---

### Step 4 — Tests + push + PR + ship

Write `tests/react/secrets.test.ts` with fixture files containing:
- A real-looking OpenAI key in a string
- A real-looking GitHub token
- Normal strings that should NOT be flagged
- Verify line numbers are correct

```bash
git add tests/react/ src/modules/react/secrets.ts
git push -u origin feature/react-secrets
```

```bash
gh pr create --title "feat(react:secrets): hardcoded secret detector in source files" --body "Scans all TS/TSX/JS/JSX files for string literals matching known secret patterns (OpenAI, AWS, GitHub, Stripe, etc.). Reports file + line + pattern name. Never prints matched values." --base develop
```

```bash
gh pr merge --merge && git checkout develop && git pull
```

```bash
# Edit package.json version to "3.1.0"
git add package.json && git commit -m "chore: bump version to 3.1.0"
git checkout main && git merge develop --no-ff -m "release: v3.1.0 — hardcoded secret detector"
git tag v3.1.0 && git push origin main && git push origin v3.1.0
git checkout develop
```

---

---

## Phase 19 — Config File Support (`devguard.config.ts`) — v3.2.0

**What it does:** Allows users to customize devguard behavior — disable rules, set thresholds, exclude paths — without CLI flags.

**Example `devguard.config.ts`:**
```typescript
import { defineConfig } from '@kevinpatil/devguard';

export default defineConfig({
  env: {
    rules: {
      'weak-secret': 'off',
      'undeclared-key': 'warn',
    },
    exclude: ['.env.test'],
  },
  deps: {
    bundleThreshold: 100,          // kB, default 50
    exclude: ['devDependencies'],
  },
  react: {
    entry: 'src/main.tsx',
    exclude: ['src/stories/**'],
  },
});
```

### Step 1 — Branch

```bash
git checkout develop && git pull
```

```bash
git checkout -b feature/config-file
```

---

### Step 2 — Build config loader

**Create `src/utils/config.ts`:**

1. Look for `devguard.config.ts` then `.devguard.json` in `process.cwd()`
2. For `.ts` files: use `require` with `ts-node/register` if available; fall back to a note that ts-node is needed, or use a JSON config instead
3. For `.json` files: `JSON.parse(fs.readFileSync(...))`
4. Validate the config shape (check for unknown keys, warn but don't error)
5. Export `loadConfig(): DevguardConfig` and a `defineConfig` helper (type-only, returns input as-is)

**Add `DevguardConfig` type to `src/types.ts`.**

```bash
git add src/utils/config.ts src/types.ts
```

```bash
git commit -m "feat: config file loader — devguard.config.ts and .devguard.json support"
```

---

### Step 3 — Thread config through all module runners

Update each module runner (`runEnv`, `runDeps`, `runReactImports`, etc.) to accept an optional `config` parameter and apply relevant settings.

In `src/cli.ts`, call `loadConfig()` once at the top of each command action and pass the result down.

```bash
git add src/cli.ts src/modules/
```

```bash
git commit -m "feat: thread config object through all module runners"
```

---

### Step 4 — Export `defineConfig` from package

In `src/index.ts` (or a dedicated `src/config.ts`), export `defineConfig` so users can import it.

Update `tsup.config.ts` to ensure `defineConfig` is exported in both CJS and ESM builds.

```bash
git add src/index.ts tsup.config.ts
```

```bash
git commit -m "feat: export defineConfig helper for typed config files"
```

---

### Step 5 — Tests + push + PR + ship

Write `tests/utils/config.test.ts`:
- Test loading a valid `.devguard.json`
- Test missing config file returns defaults
- Test that disabled rules are skipped
- Test that excluded paths are respected

```bash
git add tests/utils/config.test.ts
git push -u origin feature/config-file
```

```bash
gh pr create --title "feat: devguard.config.ts support" --body "Config file loader supports devguard.config.ts and .devguard.json. Allows disabling rules, setting thresholds, excluding paths, and setting React entry point. Exports defineConfig for TypeScript autocompletion." --base develop
```

```bash
gh pr merge --merge && git checkout develop && git pull
```

```bash
# Edit package.json version to "3.2.0"
git add package.json && git commit -m "chore: bump version to 3.2.0"
git checkout main && git merge develop --no-ff -m "release: v3.2.0 — config file support"
git tag v3.2.0 && git push origin main && git push origin v3.2.0
git checkout develop
```

---

---

## Phase 20 — Duplicate Deps Detection (`devguard deps --duplicates`) — v3.3.0

**What it does:** Parses `package-lock.json` and finds packages installed at multiple versions. Common in monorepos and after bad merges.

**Output:**
```
── DUPLICATE PACKAGES ──────────────────────────
  ⚠ react           16.14.0  and  18.2.0  (2 versions)
  ⚠ @types/node     18.0.0   and  20.11.0  (2 versions)
```

### Step 1 — Branch

```bash
git checkout develop && git pull
```

```bash
git checkout -b feature/deps-duplicates
```

---

### Step 2 — Build the duplicate detector

**Create `src/modules/deps/duplicates.ts`:**

1. Read `package-lock.json` from `process.cwd()`
2. Walk the `packages` object (lock file v2/v3 format) — each key is a path like `node_modules/foo` or `node_modules/foo/node_modules/bar`
3. Build a `Map<packageName, Set<version>>`
4. Flag any package where the Set has more than 1 version
5. Also handle lock file v1 format (`dependencies` key) for older projects

```bash
git add src/modules/deps/duplicates.ts
```

```bash
git commit -m "feat(deps): duplicate package version detector from package-lock.json"
```

---

### Step 3 — Wire `--duplicates` flag + tests + push + PR + ship

In `src/cli.ts`, add `.option('--duplicates', 'find packages installed at multiple versions')` to the `deps` command.

Write `tests/deps/duplicates.test.ts` with fixture lock files (v1 and v2 format).

```bash
git add src/cli.ts src/modules/deps/duplicates.ts tests/deps/duplicates.test.ts
```

```bash
git push -u origin feature/deps-duplicates
```

```bash
gh pr create --title "feat(deps): duplicate package version detector (--duplicates)" --body "Parses package-lock.json (v1 and v2/v3 format) to find packages installed at multiple versions. Common in monorepos and after bad merges." --base develop
```

```bash
gh pr merge --merge && git checkout develop && git pull
```

```bash
# Edit package.json version to "3.3.0"
git add package.json && git commit -m "chore: bump version to 3.3.0"
git checkout main && git merge develop --no-ff -m "release: v3.3.0 — duplicate deps detector"
git tag v3.3.0 && git push origin main && git push origin v3.3.0
git checkout develop
```

**Live test:**

```bash
node dist/index.js deps --duplicates
```

---

---

## Quick Wins — No Feature Branch Needed

These are small enough to commit directly to `develop` (no feature branch required).

### Demo GIF

```bash
# Record terminal session
asciinema rec devguard-demo.cast

# Convert to GIF (install agg first: cargo install agg)
agg devguard-demo.cast docs/demo.gif
```

```bash
git add docs/demo.gif README.md
git commit -m "docs: add terminal demo GIF to README"
git push origin develop
```

---

### GitHub Topics

**Human task:** Go to the repo homepage → gear icon next to "About" → add:

```
cli  developer-tools  linter  security  dotenv  react  devtools
nodejs  typescript  npm-package  environment-variables
```

---

### awesome-nodejs submission

**Human task:**
1. Fork https://github.com/sindresorhus/awesome-nodejs
2. Add devguard under "Command-line apps" section
3. Open a PR with title: "Add devguard — project health CLI (env + deps + React)"

---

---

## CI/CD Summary — What Triggers What

| Event | Workflow | Checks |
|---|---|---|
| Push to `feature/*` | `test.yml` | build + typecheck + tests |
| PR opened → `develop` | `test.yml` | build + typecheck + tests (blocks merge if red) |
| Push to `develop` | `test.yml` | build + typecheck + tests |
| Merge `develop` → `main` | `test.yml` | build + typecheck + tests |
| Push tag `v*.*.*` | `publish.yml` | tests → npm publish |
| devguard-action tag push | _(none — manual marketplace release)_ | Manual release on GitHub |

---

## Complete Repo Setup Reference

### Main repo: `devguard`

```
github.com/kevinpatildxd/devguard
Branch protection: main (require PR, require CI green)
Secrets: NPM_TOKEN
Topics: cli, developer-tools, linter, security, dotenv, react, devtools
```

### Action repo: `devguard-action`

```
github.com/kevinpatildxd/devguard-action
Branch protection: main (require PR)
Marketplace: https://github.com/marketplace/actions/devguard
Versioning: semver tags (v1.0.0, v1.1.0, etc.)
              + floating major tag (v1) updated on each minor release:
```

```bash
# After each devguard-action release, update the floating v1 tag:
git tag -f v1
git push origin v1 --force
```

> The floating `v1` tag lets users write `uses: kevinpatildxd/devguard-action@v1`
> and automatically get minor/patch updates without changing their workflow files.
