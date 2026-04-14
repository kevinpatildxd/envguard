# EnvGuard — Human vs AI Task Split

## Legend
- 🤖 AI (Claude handles this — files, code, configs)
- 🧑 Human (requires browser, terminal auth, or external service)

---

## Phase 0: GitHub & npm Setup

| Task | Who |
|---|---|
| Create repo on github.com | 🧑 |
| Add repo topics on github.com | 🧑 |
| Generate npm Automation token (90 days) | 🧑 |
| Add `NPM_TOKEN` secret in GitHub repo settings | 🧑 |
| Set up branch protection after first CI run | 🧑 |
| Create `.github/workflows/ci.yml` | 🤖 |
| Create `.github/workflows/publish.yml` | 🤖 |
| Create `LICENSE` | 🤖 |
| Create `CONTRIBUTING.md` | 🤖 |
| Create `.github/ISSUE_TEMPLATE/bug_report.md` | 🤖 |
| Create `.github/ISSUE_TEMPLATE/feature_request.md` | 🤖 |
| Create `.github/PULL_REQUEST_TEMPLATE.md` | 🤖 |
| Create `.gitignore` | 🤖 |
| First commit and push to GitHub | 🧑 |

---

## Phase 1: Project Setup & Parser (Days 1–4)

| Task | Who |
|---|---|
| Init `package.json` with correct fields | 🤖 |
| Create `tsconfig.json` (strict mode) | 🤖 |
| Create `tsup.config.ts` | 🤖 |
| Create `src/` folder structure | 🤖 |
| Write `src/types.ts` | 🤖 |
| Write `src/parser.ts` | 🤖 |
| Write `src/index.ts` (CLI entry) | 🤖 |
| Run `npm install` to install dependencies | 🧑 |
| Verify CLI runs locally (`node dist/index.js`) | 🧑 |

---

## Phase 2: Validation Rules (Days 5–9)

| Task | Who |
|---|---|
| Write `src/rules/missing-key.ts` | 🤖 |
| Write `src/rules/empty-value.ts` | 🤖 |
| Write `src/rules/insecure-defaults.ts` | 🤖 |
| Write `src/rules/undeclared-key.ts` | 🤖 |
| Write `src/rules/weak-secret.ts` | 🤖 |
| Write `src/rules/type-mismatch.ts` | 🤖 |
| Write `src/rules/malformed-url.ts` | 🤖 |
| Write `src/rules/boolean-mismatch.ts` | 🤖 |
| Write `src/validator.ts` (orchestrates all rules) | 🤖 |
| Create fixture `.env` files for manual testing | 🤖 |
| Run the tool against your own project to sanity check | 🧑 |

---

## Phase 3: CLI Output & Flags (Days 10–12)

| Task | Who |
|---|---|
| Write `src/reporter.ts` (color-coded output) | 🤖 |
| Add `--strict` flag (exit code 1) | 🤖 |
| Add `--json` flag (machine-readable output) | 🤖 |
| Add `--env` flag (target named env file) | 🤖 |
| Manually test terminal output looks correct | 🧑 |

---

## Phase 4: Tests, Docs & Ship (Days 13–15)

| Task | Who |
|---|---|
| Write vitest tests for every rule | 🤖 |
| Write `README.md` with usage + CI examples | 🤖 |
| Run `npm test` and confirm all pass | 🧑 |
| Run `npx tsc --noEmit` and confirm no errors | 🧑 |
| Bump version to `1.0.0` in `package.json` | 🤖 |
| Push and create version tag (`git push --tags`) | 🧑 |
| Confirm GitHub Actions publish workflow succeeds | 🧑 |
| Verify `npx envguard` works after npm publish | 🧑 |

---

## Post-Launch

| Task | Who |
|---|---|
| Post on Dev.to / Reddit / social | 🧑 |
| Submit PR to awesome-nodejs list | 🧑 |
| Regenerate npm token every 90 days | 🧑 |
| Implement new feature requests | 🤖 |
| Triage issues opened on GitHub | 🧑 |
