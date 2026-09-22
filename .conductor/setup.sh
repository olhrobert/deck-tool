#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [ -d app ]; then
  echo "Installing app dependencies..."
  cd app
  pnpm install --frozen-lockfile
  echo "Setup complete."
else
  echo "No app/ directory found — nothing to set up."
  exit 1
fi
