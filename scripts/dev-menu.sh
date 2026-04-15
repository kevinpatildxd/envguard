#!/usr/bin/env bash
# Arrow-key interactive command selector using fzf
# Usage: bash scripts/dev-menu.sh

commands=(
  "build          → npm run build"
  "test           → npm test"
  "test:watch     → npm run test:watch"
  "dev            → npm run dev"
  "lint           → npm run lint"
  "env            → node dist/index.js env"
  "deps           → node dist/index.js deps"
  "react          → node dist/index.js react"
  "react:imports  → node dist/index.js react:imports"
  "react:rerenders→ node dist/index.js react:rerenders"
  "react:hooks    → node dist/index.js react:hooks"
  "react:bundle   → node dist/index.js react:bundle"
  "react:a11y     → node dist/index.js react:a11y"
  "react:server   → node dist/index.js react:server"
  "full audit     → node dist/index.js"
  "full audit json→ node dist/index.js --json"
)

selected=$(printf '%s\n' "${commands[@]}" | fzf --height=50% --border --prompt="devguard > ")

if [ -z "$selected" ]; then
  exit 0
fi

cmd=$(echo "$selected" | sed 's/.*→ //')
echo "Running: $cmd"
eval "$cmd"
