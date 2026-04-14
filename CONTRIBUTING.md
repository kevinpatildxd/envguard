# Contributing to envguard

Thanks for your interest in contributing! Here's everything you need to get started.

## Getting Started

1. **Fork** the repository on GitHub
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/envguard.git
   cd envguard
   ```
3. **Install dependencies:**
   ```bash
   npm install
   ```
4. **Verify everything works:**
   ```bash
   npm test
   ```

## Making Changes

- Always branch off `main`:
  ```bash
  git checkout -b feat/your-feature-name
  ```
- One feature or fix per PR — keep it focused
- Add or update tests for any logic you change
- Make sure `npm test` and `npx tsc --noEmit` both pass before opening a PR

## Code Style

- TypeScript strict mode — no `any`, no type suppressions
- No external runtime dependencies — envguard is zero-dependency by design
- Each validation rule lives in its own file under `src/rules/`
- Keep functions small and single-purpose

## Running Tests

```bash
npm test          # run all tests
npm run typecheck # TypeScript type check only
npm run build     # compile with tsup
```

## Submitting a Pull Request

1. Push your branch to your fork
2. Open a PR against `main` on this repo
3. Fill out the PR template
4. CI must pass before the PR can be merged

## Reporting Bugs

Use the [bug report template](.github/ISSUE_TEMPLATE/bug_report.md) when opening an issue.

## Requesting Features

Use the [feature request template](.github/ISSUE_TEMPLATE/feature_request.md) when opening an issue.
