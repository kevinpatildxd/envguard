# devguard — Roadmap

## ✅ Shipped

### v1.0.0 — ENV Validator (MVP)
- [x] TypeScript + tsup + commander.js + chalk setup
- [x] `.env` and `.env.example` parser
- [x] Missing keys, empty value, insecure defaults, weak secrets rules
- [x] Type mismatch, malformed URL, boolean mismatch, undeclared key rules
- [x] Color-coded reporter (`src/reporter.ts`)
- [x] `--strict`, `--json`, `--file` CLI flags
- [x] Vitest unit tests + fixture `.env` files
- [x] GitHub Actions CI + npm publish on tag
- [x] Published to npm as `@kevinpatil/devguard`

### v2.0.0 — DEPS Auditor
- [x] Unused packages (AST-based import analysis)
- [x] Outdated versions (npm registry)
- [x] Vulnerabilities (OSV.dev batch API)
- [x] License classification (permissive/copyleft/AGPL)
- [x] Supply chain risks (install scripts, abandonment, single-maintainer)
- [x] Duplicate versions (lockfile analysis)
- [x] Lighter-weight alternatives (24 packages)
- [x] 24-hour local HTTP cache (`~/.devguard/cache.json`)
- [x] `--licenses`, `--supply-chain`, `--duplicates`, `--fix`, `--dry-run` flags

### v3.0.0 — REACT Auditor
- [x] `react:imports` — dead imports and dead files (entry-point graph traversal)
- [x] `react:rerenders` — inline object/function props, missing React.memo, unstable dep arrays
- [x] `react:hooks` — Rules of Hooks violations (conditional, loop, nested, invalid caller)
- [x] `react:bundle` — heavy package warnings (static list + Bundlephobia fallback)
- [x] `react:a11y` — JSX accessibility checks (img alt, button, input, anchor)
- [x] `react:server` — React Server Component boundary violations
- [x] `react:secrets` — hardcoded credentials in source files

### v3.1.0 — SARIF + Health Score
- [x] `--sarif` flag — SARIF 2.1.0 report for GitHub Code Scanning
- [x] `--score` flag — health score (0–100) for CI
- [x] ASCII mascot (`src/buddy.ts`)

### v3.2.0 — Git History Scanning
- [x] `--scan-git` — scans git history for committed `.env` files
- [x] `--depth <n>` — configurable commit depth (default: 50)

### v3.3.0 — Zod Schema Generation + Init Hooks
- [x] `--schema` flag — generates `env.schema.ts` with Zod types from `.env.example`
- [x] `init --hooks` — installs pre-commit hook that runs `devguard --strict`
- [x] `.devguard.json` config file support

---

## 🔜 Planned

- [ ] `--no-memo` flag for `react:rerenders` (skip noisy missing-memo check) — done in v3.3.x
- [ ] pnpm and yarn lockfile support in `deps --duplicates`
- [ ] Concurrency limit on npm registry calls (prevent rate limiting on large monorepos)
- [ ] VS Code extension
- [ ] `--watch` mode — re-run on file change
- [ ] Docker / multi-stage `.env` support
