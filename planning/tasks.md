# devguard — Task Tracker

> Update this file daily. Move tasks between sections as you work on them.
> Format: `- [ ]` = todo · `- [~]` = in progress · `- [x]` = done

---

## 🔥 Currently Working On

> Drop 1–3 tasks here when you sit down to work. Remove them once done or blocked.

- [ ] _(empty — pick something from the backlog below)_

---

## Tier 1 — Highest ROI (do these first)

These have the biggest impact on stars, downloads, and adoption.

### 🏆 Health Score
- [ ] Design scoring weights (errors = -10pts, warnings = -3pts, base = 100)
- [ ] Aggregate existing check counts into a 0–100 score
- [ ] Print large colored score at end of every full run
- [ ] Add `--score` flag to show score-only output (no details)
- [ ] Test: score of 100 on a clean project, score drops correctly on issues

### ⚡ GitHub Actions Marketplace
- [ ] Create `.github/actions/devguard-action/action.yml`
- [ ] Write shell wrapper that runs `npx @kevinpatil/devguard --strict`
- [ ] Add `branding` block (icon + color) for Marketplace listing
- [ ] Write `action.README.md` with usage examples
- [ ] Publish to GitHub Actions Marketplace
- [ ] Add badge + usage snippet to main README

### 📜 License Audit (`devguard deps --licenses`)
- [ ] Fetch license field from npm Registry API for each dep
- [ ] Build list of "dangerous" licenses for commercial projects (GPL-2.0, GPL-3.0, AGPL-3.0)
- [ ] Print license table: package → license → status (OK / WARN / FLAG)
- [ ] Add `--licenses` flag to `devguard deps` command
- [ ] Write tests with mocked npm API responses
- [ ] Document in README

### 🔐 Git Secret Scan (`devguard env --scan-git`)
- [ ] Run `git log --diff-filter=A --name-only` to find commits that added `.env*` files
- [ ] Run `git show <hash>:.env` for each hit and check for real secret values
- [ ] Report: commit hash, file name, key names found
- [ ] Add `--scan-git` flag and `--depth <n>` option (default: last 50 commits)
- [ ] Write tests using a temp git repo fixture
- [ ] Document in README with "why this matters" blurb

---

## Tier 2 — Strong Growth

### 📋 SARIF Output (`--sarif`)
- [ ] Research SARIF v2.1.0 schema (GitHub docs)
- [ ] Build SARIF serializer from existing `AuditResult` type
- [ ] Add `--sarif` flag alongside existing `--json`
- [ ] Test: upload SARIF artifact in GitHub Actions and confirm PR annotations appear
- [ ] Document in README CI section

### 🔧 Auto-fix Unused Deps (`devguard deps --fix`)
- [ ] After unused package detection, prompt user: "Remove these 3 packages? (y/N)"
- [ ] On confirm: update `package.json` + run `npm uninstall <pkg>`
- [ ] Add `--fix` flag (skip prompt, auto-apply)
- [ ] Add `--dry-run` flag (show what would change, don't apply)
- [ ] Write tests

### 🛡️ Supply Chain Risk (`devguard deps --supply-chain`)
- [ ] Fetch `scripts.preinstall` / `scripts.postinstall` from npm Registry for each dep
- [ ] Flag packages with install scripts (warn, not error — many are legitimate)
- [ ] Flag packages with 0 contributors in last 2 years (check `time` field in registry response)
- [ ] Flag packages with a single maintainer (supply chain risk signal)
- [ ] Add to default `devguard deps` output as a new section
- [ ] Write tests

### 🪝 Pre-commit Hook Setup (`devguard init --hooks`)
- [ ] Detect if Husky is installed (`node_modules/.bin/husky` exists)
- [ ] If Husky: write `.husky/pre-commit` with `npx @kevinpatil/devguard env --strict`
- [ ] If no Husky: write `.git/hooks/pre-commit` directly + `chmod +x`
- [ ] Print confirmation with instructions to verify
- [ ] Add `devguard init` command to CLI
- [ ] Document in README

---

## Tier 3 — Power User Features

### 🧬 Zod Schema Generation (`devguard env --schema`)
- [ ] Parse `.env.example` keys and infer types (PORT → `z.coerce.number()`, URL → `z.string().url()`, etc.)
- [ ] Generate `env.schema.ts` with Zod validators
- [ ] Add `--schema` flag to `devguard env`
- [ ] Write tests for type inference logic
- [ ] Write a blog post / Dev.to article about this feature

### 🕵️ Hardcoded Secrets in Source (`devguard react:secrets`)
- [ ] Define regex patterns for common secret formats (API keys, Bearer tokens, AWS keys, private keys)
- [ ] Walk all `.ts` / `.tsx` / `.js` / `.jsx` files and scan string literals
- [ ] Flag: file path + line number + matched pattern (not the secret value itself)
- [ ] Add `react:secrets` command to CLI
- [ ] Write tests with fixture files
- [ ] Document in README

### ⚙️ Config File Support (`devguard.config.ts`)
- [ ] Design config schema: `rules`, `thresholds`, `exclude`, `entry`
- [ ] Write config loader (`src/utils/config.ts`) that finds `devguard.config.ts` or `.devguard.json`
- [ ] Pass config through to each module runner
- [ ] Write tests for config loading
- [ ] Document all config options in README

### 🔄 Duplicate Deps Detection (`devguard deps --duplicates`)
- [ ] Parse `package-lock.json` and find packages listed at multiple versions
- [ ] Report: package name → versions found → locations
- [ ] Add `--duplicates` flag to `devguard deps`
- [ ] Write tests with a fixture lock file

---

## Quick Wins (< 2 hours each)

- [ ] Record terminal demo GIF with `asciinema` + convert with `agg` — add to README
- [ ] Add GitHub Topics to repo: `cli` `developer-tools` `linter` `security` `dotenv` `react` `devtools`
- [ ] Submit devguard to `awesome-nodejs` list (open a PR)
- [ ] Post on r/node, r/reactjs, r/webdev
- [ ] Write Dev.to article: "I built a free CLI that audits your entire Node.js project in one command"
- [ ] Cross-post to Hashnode
- [ ] Submit to Product Hunt
- [ ] Add `devguard` (no scope) as a package alias if name is available on npm

---

## Done ✅

> Move completed tasks here with the date finished.

- [x] env validation module (missing keys, insecure defaults, type mismatch, weak secrets, boolean mismatch, malformed URL, empty value, undeclared key)
- [x] deps module (unused packages, outdated versions, OSV.dev vulns, alternatives)
- [x] react:imports — dead component and unused import finder
- [x] react:rerenders — inline object/function detection
- [x] react:hooks — hooks rule linter
- [x] react:bundle — heavy package detection via Bundlephobia
- [x] react:a11y — accessibility static scan
- [x] react:server — RSC boundary checker
- [x] `--json` and `--strict` flags
- [x] `devguard env --init` (generate .env.example from .env)
- [x] Cross-env consistency check
- [x] ASCII guard dog mascot (buddy.ts)
- [x] GitHub Pages documentation site
- [x] CI workflow (test on push)

---

## Blocked / On Hold

> Tasks that are waiting on something external.

_(empty)_

---

## Notes

- Keep "Currently Working On" to max 3 items — more than that and nothing ships
- Tier 1 tasks ship first. Don't start Tier 2 until at least 2 Tier 1 items are done
- After each shipped feature: update README, bump version, publish to npm
