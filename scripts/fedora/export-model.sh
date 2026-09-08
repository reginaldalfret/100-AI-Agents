#!/usr/bin/env bash
# 301 SUPER AI — Export Linux Artifacts to Authoritative Windows E: Storage
set -euo pipefail

SOURCE_FILE="${1:-}"
CATEGORY="${2:-research}" # research, fine-tuned, quantized, mobile
TARGET_ROOT="/mnt/e/Smart Automation/100-AI-Agents/models"

if [ -z "$SOURCE_FILE" ] || [ ! -f "$SOURCE_FILE" ]; then
    echo "Usage: $0 <source_file> [research|fine-tuned|quantized|mobile]"
    exit 1
fi

DEST_DIR="$TARGET_ROOT/$CATEGORY"
mkdir -p "$DEST_DIR"

FILENAME="$(basename "$SOURCE_FILE")"
DEST_PATH="$DEST_DIR/$FILENAME"

echo "Exporting: $SOURCE_FILE -> $DEST_PATH"
cp "$SOURCE_FILE" "$DEST_PATH"
echo "Export verified: $(ls -lh "$DEST_PATH")"
echo "STATUS: ARTIFACT EXPORT SUCCESSFUL"
