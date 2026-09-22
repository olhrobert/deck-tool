#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../app"

echo "Starting dev server on http://localhost:3000"
exec pnpm dev
