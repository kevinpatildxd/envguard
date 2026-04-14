# EnvGuard — Claude Code Workflow Tips

## Ground Rules

### Git commits are YOUR responsibility
Claude should never commit code on your behalf. After Claude writes or edits files, you review the diff and commit yourself:
```bash
git diff
git add <specific files>
git commit -m "your message"
```
If Claude offers to commit, decline and do it manually.

---

## How to use Claude Code effectively for this project

### Start each session with context
Open Claude Code in the envguard directory and say:
```
Read planning/roadmap.md and tell me what's left to build.
```

### Build one rule at a time
Don't ask Claude to build all rules at once. Go rule by rule:
```
Build the missing-key rule. Use the types from src/types.ts.
Write the rule, then write a vitest test for it using fixtures.
```

### Always ask for tests alongside code
```
Write src/rules/weak-secret.ts and a corresponding test in tests/rules/weak-secret.test.ts
```

### Use Claude to write fixture files
```
Create test fixture files in tests/fixtures/:
- complete.env (all keys present, all valid)
- missing-keys.env (missing DATABASE_URL and JWT_SECRET)
- insecure.env (DB_PASS=changeme, JWT_SECRET=secret)
- type-mismatch.env (PORT=abc, TIMEOUT=xyz)
```

### Review before moving on
After each phase, ask:
```
Review the current src/ folder. Does everything match the plan in planning/roadmap.md?
What's missing or inconsistent?
```

### Before publishing to npm
```
Check package.json for envguard. Make sure: name, version, description, main, bin, files,
keywords, license, and repository fields are all correct for npm publishing.
```
