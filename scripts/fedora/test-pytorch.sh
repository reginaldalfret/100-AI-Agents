#!/usr/bin/env bash
# 301 SUPER AI — Execute PyTorch CUDA Verification
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_PYTHON="$HOME/301-ai-research/.venv/bin/python"

if [ ! -x "$VENV_PYTHON" ]; then
    echo "ERROR: Virtual environment python not found at $VENV_PYTHON"
    echo "Please create venv at ~/301-ai-research/.venv"
    exit 1
fi

echo "Running PyTorch GPU Verification..."
"$VENV_PYTHON" "$SCRIPT_DIR/gpu_test.py"
