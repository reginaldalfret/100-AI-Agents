#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_PYTHON="$HOME/301-ai-research/.venv/bin/python"

echo "============================================================"
echo "301 SUPER AI — LAUNCHING KAVIYA STYLE QLoRA TRAINING"
echo "============================================================"

"$VENV_PYTHON" "$SCRIPT_DIR/train_kaviya_style_qlora.py" \
    --model_id "HuggingFaceTB/SmolLM2-360M-Instruct" \
    --dataset_dir "$HOME/301-ai-research/training/datasets/personal-style/kaviya-style-v1" \
    --output_dir "/mnt/e/Smart Automation/100-AI-Agents/models/fine-tuned/personal-style/kaviya-style-v1" \
    --max_steps 15 \
    --batch_size 1 \
    --grad_accum 4 \
    --lr 2e-4 \
    --max_seq_len 256
