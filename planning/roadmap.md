# EnvGuard — Project Roadmap

## v1.0.0 (MVP — ~3 weeks)

### Phase 1: Setup & Parser (Days 1–4)
- [ ] Init repo with TypeScript + tsup
- [ ] Add commander.js + chalk
- [ ] Write `.env` parser (`src/parser.ts`)
- [ ] Write `.env.example` parser
- [ ] Basic CLI entry point (`src/index.ts`)

### Phase 2: Core Validation Rules (Days 5–9)
- [ ] Missing keys rule
- [ ] Undeclared/extra keys rule
- [ ] Empty value rule
- [ ] Insecure defaults rule (changeme, secret, todo, 1234)
- [ ] Weak secret length rule
- [ ] Type mismatch rule (PORT, TIMEOUT)
- [ ] Malformed URL rule
- [ ] Boolean mismatch rule (yes/no vs true/false)

### Phase 3: CLI Output & Flags (Days 10–12)
- [ ] Color-coded reporter (`src/reporter.ts`)
- [ ] `--strict` flag (exit code 1 for errors)
- [ ] `--json` flag (machine-readable output for CI)
- [ ] `--env` flag (target a named env file)

### Phase 4: Ship (Days 13–15)
- [ ] vitest unit tests for every rule
- [ ] Fixture `.env` files for testing
- [ ] README with usage, CI integration examples
- [ ] GitHub Actions: test on push, publish on tag
- [ ] Publish v1.0.0 to npm

---

## v1.1.0 (Post-launch ideas)
- [ ] `--fix` flag — interactive prompts to fill missing keys
- [ ] `envguard.config.ts` — zod-style schema support
- [ ] VS Code extension
- [ ] GitHub Action marketplace listing
- [ ] Docker `.env` / multi-stage env support
