# EnvGuard — Validation Rules Reference

## Severity Levels
- **ERROR** — blocks deployment in `--strict` mode (exit code 1)
- **WARNING** — shown but does not block

---

## Rule Definitions

| Rule | Severity | Trigger Condition | Example |
|---|---|---|---|
| `missing-key` | ERROR | Key in `.env.example` not in `.env` | `DATABASE_URL` missing |
| `empty-value` | ERROR | Key exists but value is blank | `API_KEY=` |
| `insecure-default` | ERROR | Value matches known insecure pattern | `DB_PASS=changeme` |
| `undeclared-key` | WARNING | Key in `.env` not in `.env.example` | `MY_SECRET` undeclared |
| `weak-secret` | WARNING | Secret-like key under 16 characters | `SECRET_KEY=abc123` |
| `type-mismatch` | WARNING | Numeric key has non-numeric value | `PORT=abc` |
| `malformed-url` | WARNING | URL key missing protocol or malformed | `DATABASE_URL=localhost` |
| `boolean-mismatch` | WARNING | Boolean key has non-boolean value | `FEATURE_FLAG=yes` |

---

## Insecure Default Patterns
```
changeme, change_me, todo, secret, password, 1234, 12345,
123456, test, example, placeholder, dummy, fake, temp
```

## Secret Key Name Patterns (trigger weak-secret check)
```
*_SECRET, *_KEY, *_TOKEN, *_PASSWORD, *_PASS, *_PWD, JWT_*, API_*
```

## Numeric Key Name Patterns (trigger type-mismatch check)
```
PORT, TIMEOUT, MAX_*, MIN_*, LIMIT, RETRY_*, WORKERS, THREADS
```

## URL Key Name Patterns (trigger malformed-url check)
```
*_URL, *_URI, *_HOST, DATABASE_*, REDIS_*, MONGO_*
```
