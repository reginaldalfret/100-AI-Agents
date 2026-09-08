#!/usr/bin/env bash
# 301 SUPER AI — Clone and Build llama.cpp inside Fedora WSL 2
set -euo pipefail

LLAMA_DIR="$HOME/301-ai-research/llama.cpp"
BUILD_TYPE="${1:-CPU}" # CPU or CUDA

echo "============================================================"
echo "301 SUPER AI — LLAMA.CPP BUILD PIPELINE (Target: $BUILD_TYPE)"
echo "============================================================"

# Clone if not already present
if [ ! -d "$LLAMA_DIR/.git" ]; then
    echo "Cloning llama.cpp repository..."
    git clone --depth 1 https://github.com/ggerganov/llama.cpp "$LLAMA_DIR"
else
    echo "llama.cpp repository already present at $LLAMA_DIR"
fi

cd "$LLAMA_DIR"

if [ "$BUILD_TYPE" = "CUDA" ]; then
    echo "Configuring CMake for CUDA Acceleration..."
    cmake -B build -DGGML_CUDA=ON -DCMAKE_BUILD_TYPE=Release
else
    echo "Configuring CMake for CPU Inference..."
    cmake -B build -DCMAKE_BUILD_TYPE=Release
fi

echo "Building llama.cpp binaries with $(nproc) threads..."
cmake --build build --config Release -j "$(nproc)" --target llama-cli llama-quantize

echo "Build complete! Checking executables:"
ls -la build/bin/llama-cli build/bin/llama-quantize 2>/dev/null || ls -la build/bin/* 2>/dev/null || true
echo "STATUS: LLAMA.CPP BUILD SUCCESSFUL"
