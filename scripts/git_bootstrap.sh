#!/usr/bin/env bash
set -euo pipefail

REMOTE_URL="${1:-}"

if ! command -v git >/dev/null 2>&1; then
  echo "git not found"
  exit 1
fi

# init repo if needed
if [ ! -d ".git" ]; then
  git init
fi

# ensure develop branch
current=$(git branch --show-current || echo "")
if [ -z "$current" ]; then
  git checkout -b develop
else
  git checkout -B develop
fi

git add .
git commit -m "chore(init): scaffold browser content editor" -m "Initial structure:
- React+TS app via Vite
- Scenes & Dialogs editors (MVP)
- Zod types + JSON Schemas
- Docs (tech spec, milestones, contributing)
- Samples
- Git bootstrap scripts"

if [ -n "$REMOTE_URL" ]; then
  if git remote get-url origin >/dev/null 2>&1; then
    git remote set-url origin "$REMOTE_URL"
  else:
    git remote add origin "$REMOTE_URL"
  fi
  git push -u origin develop
fi

echo "Repository initialized on 'develop'."
