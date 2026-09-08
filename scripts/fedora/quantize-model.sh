#!/usr/bin/env bash
# 301 SUPER AI — GGUF Quantization Lab Tooling
# Supports Q8_0, Q6_K, Q5_K_M, Q4_K_M, Q3_K_M, Q2_K
set -euo pipefail

QUANTIZER="$HOME/301-ai-research/llama.cpp/build/bin/llama-quantize"

if [ ! -x "$QUANTIZER" ]; then
    echo "ERROR: llama-quantize executable not found at $QUANTIZER"
    echo "Run scripts/fedora/build-llamacpp.sh first."
    exit 1
fi

INPUT_MODEL="${1:-}"
TARGET_TYPE="${2:-Q4_K_M}"
OUTPUT_MODEL="${3:-}"

if [ -z "$INPUT_MODEL" ]; then
    echo "Usage: $0 <input_gguf_path> [quant_type] [output_gguf_path]"
    echo "Supported types: Q8_0, Q6_K, Q5_K_M, Q4_K_M, Q3_K_M, Q2_K"
    exit 1
fi

if [ -z "$OUTPUT_MODEL" ]; then
    BASE_NAME="$(basename "$INPUT_MODEL" .gguf)"
    DIR_NAME="$(dirname "$INPUT_MODEL")"
    OUTPUT_MODEL="${DIR_NAME}/${BASE_NAME}-${TARGET_TYPE}.gguf"
fi

echo "============================================================"
echo "301 SUPER AI — GGUF QUANTIZATION LAB"
echo "============================================================"
echo "Source Model: $INPUT_MODEL"
echo "Target Format: $TARGET_TYPE"
echo "Output Path:  $OUTPUT_MODEL"

# Preserve original model policy
if [ "$INPUT_MODEL" = "$OUTPUT_MODEL" ]; then
    echo "ERROR: Output path cannot overwrite input model (Sovereignty Policy)!"
    exit 1
fi

START_TIME=$(date +%s)
"$QUANTIZER" "$INPUT_MODEL" "$OUTPUT_MODEL" "$TARGET_TYPE"
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo "Quantization finished in ${DURATION}s."
ls -lh "$INPUT_MODEL" "$OUTPUT_MODEL"
echo "STATUS: QUANTIZATION COMPLETED"
