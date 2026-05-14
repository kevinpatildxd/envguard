# Changelog

All notable changes to devguard are documented here.

## [3.3.0] — 2026-04-xx
### Added
- `devguard env --schema`: generate `env.schema.ts` with Zod types inferred from `.env.example`
- `devguard init --hooks`: install a pre-commit hook that runs `devguard --strict`
- `.devguard.json` config file support (keys: `strict`, `json`, `env.depth`, `react.threshold`)

## [3.2.0]
### Added
- `devguard env --scan-git`: scan git history for accidentally committed `.env` files
- `--depth <n>`: configure how many commits to scan (default: 50)

## [3.1.0]
### Added
- `--sarif`: write a SARIF 2.1.0 report (`devguard.sarif`) compatible with GitHub Code Scanning
- `--score`: print only the project health score (0–100), for CI gate usage
- ASCII mascot (DevGuard dog) in the CLI output

## [3.0.0]
### Added
- `devguard react` and all sub-commands: `react:imports`, `react:rerenders`, `react:hooks`, `react:bundle`, `react:a11y`, `react:server`, `react:secrets`
- Static bundle size database for 30+ common packages with Bundlephobia API fallback
- React Server Component boundary detection

## [2.0.0]
### Added
- `devguard deps`: dependency auditing module
- Unused package detection via AST import analysis
- Outdated version checking against npm registry
- Vulnerability scanning via OSV.dev batch API
- License classification (MIT/ISC/Apache vs GPL/AGPL)
- Supply chain risk checks (install scripts, abandonment, single-maintainer)
- Duplicate version detection from lockfile
- Lighter-weight alternative suggestions for 24 heavy packages
- 24-hour local HTTP cache at `~/.devguard/cache.json`

## [1.0.0]
### Added
- Initial release: `.env` file validation against `.env.example`
- Rules: missing-key, empty-value, insecure-defaults, weak-secret, type-mismatch, malformed-url, boolean-mismatch, undeclared-key
- CLI flags: `--strict`, `--json`, `--file`, `--example`
- Published as `@kevinpatil/devguard` on npm
