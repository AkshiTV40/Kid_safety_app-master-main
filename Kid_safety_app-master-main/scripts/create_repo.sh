#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/create_repo.sh <github-org-or-user> <repo-name>
ORGANIZATION=${1:-}
REPO_NAME=${2:-kid-safety-guardian}

if ! command -v git >/dev/null 2>&1; then
  echo "git is not available on this machine. Install git and retry."
  exit 1
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "gh (GitHub CLI) not found. Please install and authenticate (gh auth login) or create repo manually."
  echo "You can still initialize git and create a remote yourself."
fi

# Initialize local repo if needed
if [ ! -d .git ]; then
  git init
fi

git checkout -b recordings-improvements || git checkout recordings-improvements

git add .
git commit -m "feat: recordings viewer, upload endpoint, tests"

if command -v gh >/dev/null 2>&1; then
  if [ -n "$ORGANIZATION" ]; then
    gh repo create "$ORGANIZATION/$REPO_NAME" --public --source=. --remote=origin --push
  else
    gh repo create "$REPO_NAME" --public --source=. --remote=origin --push
  fi
  echo "Repository created and pushed via gh."
else
  echo "No GH CLI detected. You'll need to create a remote and push manually."
  echo "Run: git remote add origin <git-url> && git push -u origin recordings-improvements"
fi
