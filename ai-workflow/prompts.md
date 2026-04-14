# EnvGuard — AI Workflow Prompts

A collection of reusable prompts for building envguard with Claude Code.

---

## Bootstrap / Setup

```
Set up the envguard project in the current directory.
Use Node.js 18+, TypeScript strict mode, tsup for bundling, commander.js for CLI args,
chalk for colored output, and vitest for tests.
Create: package.json, tsconfig.json, tsup.config.ts, and the src/ folder structure
from the plan: index.ts, parser.ts, validator.ts, reporter.ts, types.ts, and a rules/ folder.
```

---

## Parser

```
Write src/parser.ts for envguard.
It should read a .env file (or .env.example) and return a Map<string, string> of key-value pairs.
Handle: blank lines, comment lines (#), keys with no value (KEY=), quoted values, inline comments.
Export two functions: parseEnvFile(filePath: string) and parseEnvExample(filePath: string).
```

---

## Validation Rules

```
Write src/rules/missing-key.ts for envguard.
It receives the parsed example Map and the parsed env Map.
It returns an array of ValidationResult (from src/types.ts) with severity ERROR
for every key in example that is absent from env.
```

```
Write src/rules/insecure-defaults.ts for envguard.
Check every key in the env Map. If the value matches any known insecure placeholder
(changeme, secret, todo, 1234, password, test, example, placeholder, dummy, fake, temp),
return a ValidationResult with severity ERROR.
```

```
Write src/rules/type-mismatch.ts for envguard.
For keys that are expected to be numbers (PORT, TIMEOUT, MAX_*, MIN_*, LIMIT, WORKERS, THREADS),
check if the value is actually a valid integer. If not, return a WARNING result.
```

---

## Reporter

```
Write src/reporter.ts for envguard.
It receives an array of ValidationResult.
Print grouped output: ERRORS first (red), then WARNINGS (yellow), then PASSED count (green).
Use chalk for colors. At the end print a summary line like "2 errors found. Fix them before deploying."
```

---

## Tests

```
Write vitest tests for src/rules/missing-key.ts.
Use fixture files from tests/fixtures/: a .env.example with 5 keys and a .env missing 2 of them.
Test: correct error count, correct key names in results, no false positives when all keys present.
```

---

## CI / GitHub Actions

```
Write a GitHub Actions workflow for envguard at .github/workflows/ci.yml.
It should: run on push and pull_request to main, set up Node 18, install deps, run tsc --noEmit, run vitest.
Also write a separate publish.yml that triggers on version tags (v*.*.*), builds with tsup, and publishes to npm.
```
