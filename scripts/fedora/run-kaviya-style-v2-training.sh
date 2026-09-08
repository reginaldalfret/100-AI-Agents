#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_PYTHON="$HOME/301-ai-research/.venv/bin/python"

echo "============================================================"
echo "301 SUPER AI — LAUNCHING KAVIYA STYLE v2 QLoRA TRAINING"
echo "============================================================"

"$VENV_PYTHON" "$SCRIPT_DIR/train_kaviya_style_v2_qlora.py" \
    --model_id "HuggingFaceTB/SmolLM2-360M-Instruct" \
    --dataset_dir "$HOME/301-ai-research/training/datasets/personal-style/kaviya-style-v2" \
    --output_dir "/mnt/e/Smart Automation/100-AI-Agents/models/fine-tuned/personal-style/kaviya-style-v2" \
    --max_steps 140 \
    --batch_size 2 \
    --grad_accum 2 \
    --lr 3e-4 \
    --max_seq_len 256
