#!/usr/bin/env bash
# 301 SUPER AI — Run Standardized Benchmark Harness
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_PYTHON="$HOME/301-ai-research/.venv/bin/python"

MODEL="${1:-/root/301-ai-research/models/test.gguf}"
OUT_DIR="${2:-$HOME/301-ai-research/benchmarks}"

"$VENV_PYTHON" "$SCRIPT_DIR/benchmark.py" --model "$MODEL" --output-dir "$OUT_DIR"
