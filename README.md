# devguard

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/kevinpatildxd/devguard/actions/workflows/test.yml/badge.svg)](https://github.com/kevinpatildxd/devguard/actions/workflows/test.yml)
[![npm version](https://img.shields.io/npm/v/%40kevinpatil%2Fdevguard.svg)](https://www.npmjs.com/package/@kevinpatil/devguard)
[![npm downloads](https://img.shields.io/npm/dm/%40kevinpatil%2Fdevguard.svg)](https://www.npmjs.com/package/@kevinpatild/devguard)

One command to guard your project before it ships.

Validates env files, audits dependencies, and checks React code quality — all in one fast CLI. No config files. No API keys. Works offline, in Docker, everywhere.

---

## What it checks

| Module | Command | What it catches |
|---|---|---|
| **env** | `devguard env` | Missing keys, insecure defaults, type mismatches, weak secrets, cross-env inconsistencies |
| **deps** | `devguard deps` | Unused packages, outdated versions, vulnerabilities (OSV.dev), bloated alternatives |
| **react** | `devguard react` | Dead imports, re-render risks, hook violations, bundle size, accessibility, RSC boundaries |

Run all checks at once:

```bash
npx @kevinpatil/devguard
```

---

## Install

```bash
npm install --save-dev @kevinpatil/devguard
```

Or run without installing:

```bash
npx @kevinpatil/devguard
```

---

## Usage

```bash
# Run all checks (env + deps + react if React project detected)
npx @kevinpatil/devguard

# Env validation only
npx @kevinpatil/devguard env

# Dependency audit only
npx @kevinpatil/devguard deps

# React code quality only
npx @kevinpatil/devguard react

# Output results as JSON (any command)
npx @kevinpatil/devguard --json
npx @kevinpatil/devguard env --json
npx @kevinpatil/devguard deps --json

# Exit with code 1 if any errors found (for CI)
npx @kevinpatil/devguard --strict
npx @kevinpatil/devguard env --strict
```

---

## env module

Validates your `.env` files against `.env.example` before your app ships.

```bash
npx @kevinpatil/devguard env

devguard — found 2 env file(s)

── .env ────────────────────────────────────
  ERRORS (2)
    ✗ DATABASE_URL — Missing required key (defined in .env.example)
    ✗ JWT_SECRET — Insecure placeholder value: 'secret'
  WARNINGS (2)
    ⚠ PORT — Expected a number but got 'abc'
    ⚠ STRIPE_KEY — Key is not declared in .env.example

── .env.staging ────────────────────────────
  ✔ All checks passed

── Cross-environment consistency ──────────
  ⚡ REDIS_URL — present in [.env] but missing in [.env.staging]

✗ 2 error(s) across 2 file(s)
⚡ 1 cross-env inconsistency issue(s)
```

### env rules

| Rule | Severity | Description |
|---|---|---|
| `missing-key` | ERROR | Key in `.env.example` is absent from `.env` |
| `empty-value` | ERROR | Key present but has no value |
| `insecure-defaults` | ERROR | Value matches a known insecure placeholder (`changeme`, `secret`, `todo`…) |
| `undeclared-key` | WARNING | Key in `.env` but not in `.env.example` |
| `weak-secret` | WARNING | Secret key is too short or has low entropy |
| `type-mismatch` | WARNING | Numeric key (`PORT`, `TIMEOUT`…) has a non-numeric value |
| `malformed-url` | WARNING | URL key has a missing or unrecognized protocol |
| `boolean-mismatch` | WARNING | Boolean key (`FEATURE_*`, `ENABLE_*`…) has a non-boolean value |

### Getting started (no `.env.example` yet)

```bash
npx @kevinpatil/devguard env --init
```

Generates `.env.example` from your existing `.env` with all values blanked. Commit it so teammates know what keys are required.

---

## deps module

Audits your project dependencies for issues that slow you down or put you at risk.

```bash
npx @kevinpatil/devguard deps

── DEPS AUDIT ──────────────────────────────
  UNUSED (2)
    ✗ moment — imported nowhere in your source
    ✗ lodash — imported nowhere in your source
  OUTDATED (1)
    ⚠ axios — 0.27.0 → 1.7.2
  VULNERABILITIES (1)
    ✗ express@4.18.0 — CVE-2024-29041  High
  ALTERNATIVES (1)
    ⚠ moment — 67KB, consider date-fns (13KB) or dayjs (2KB)
```

---

## react module

Audits React code quality across imports, performance patterns, hooks, bundle size, accessibility, and server component boundaries.

```bash
npx @kevinpatil/devguard react

── REACT AUDIT ─────────────────────────────
  IMPORTS
    ✗ src/components/OldModal.tsx — imported nowhere
    ⚠ src/utils/helpers.ts — formatDate imported but never used
  RERENDERS
    ⚠ src/pages/Home.tsx:42 — inline object in JSX prop causes re-renders
    ⚠ src/pages/Home.tsx:58 — inline arrow function in onClick prop
  HOOKS
    ✗ src/components/Form.tsx:31 — hook called inside if block
  BUNDLE
    ⚠ moment — 67KB, consider date-fns or dayjs
  A11Y
    ✗ src/components/Avatar.tsx:12 — <img> missing alt attribute
  SERVER
    ✗ src/app/Dashboard.tsx — server component uses useState (client-only hook)
```

### react subcommands

```bash
npx @kevinpatil/devguard react:imports     # dead components and unused imports
npx @kevinpatil/devguard react:rerenders   # re-render risk patterns
npx @kevinpatil/devguard react:hooks       # hooks rules violations
npx @kevinpatil/devguard react:bundle      # bundle size analysis
npx @kevinpatil/devguard react:a11y        # accessibility checks
npx @kevinpatil/devguard react:server      # RSC boundary violations
```

---

## CI Integration

### GitHub Actions

```yaml
- name: Run devguard
  run: npx @kevinpatil/devguard --strict
```

### Any CI

```bash
npx @kevinpatil/devguard --strict   # exits with code 1 if any errors found
```

### JSON output for custom pipelines

```bash
npx @kevinpatil/devguard --json | jq '.files[].issues[] | select(.severity == "error")'
```

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

---

## License

MIT © [Kevin Patil](https://github.com/kevinpatildxd)
