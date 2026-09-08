#!/usr/bin/env bash
# 301 SUPER AI — Run QLoRA / PEFT Verification
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_PYTHON="$HOME/301-ai-research/.venv/bin/python"

if [ ! -x "$VENV_PYTHON" ]; then
    echo "ERROR: Virtual environment python not found at $VENV_PYTHON"
    exit 1
fi

echo "Running QLoRA / PEFT Training Verification..."
"$VENV_PYTHON" "$SCRIPT_DIR/test-qlora.py"
