#!/usr/bin/env bash
# 301 SUPER AI — Launch Real Local QLoRA Cybersecurity Fine-Tuning Experiment
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_PYTHON="$HOME/301-ai-research/.venv/bin/python"

echo "============================================================"
echo "301 SUPER AI — EXECUTING REAL LOCAL QLORA FINE-TUNING"
echo "============================================================"

if [ ! -x "$VENV_PYTHON" ]; then
    echo "ERROR: Research venv python not found at $VENV_PYTHON"
    exit 1
fi

"$VENV_PYTHON" "$SCRIPT_DIR/train_cybersecurity_qlora_poc.py" \
    --model_id "Qwen/Qwen2.5-0.5B" \
    --dataset_dir "$HOME/301-ai-research/training/datasets" \
    --output_dir "/mnt/e/Smart Automation/100-AI-Agents/models/fine-tuned/experiments/cybersecurity-poc-v1" \
    --max_steps 10 \
    --batch_size 1 \
    --grad_accum 4 \
    --lr 2e-4 \
    --max_seq_len 256
