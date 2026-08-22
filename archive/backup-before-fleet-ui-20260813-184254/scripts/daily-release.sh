#!/usr/bin/env bash

set -Eeuo pipefail

PROJECT_ROOT="/home/ai/100-to-1/100-to-1-automation"
CONTROLLER="$PROJECT_ROOT/release-controller"

cd "$PROJECT_ROOT"

echo
echo "=================================================="
echo "100 → 1 DAILY RELEASE"
echo "Started: $(date '+%Y-%m-%d %H:%M:%S %Z')"
echo "=================================================="

exec /usr/bin/node "$CONTROLLER/src/index.js"
