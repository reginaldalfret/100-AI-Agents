#!/usr/bin/env bash
# 301 SUPER AI — Fedora WSL 2 NVIDIA GPU & Driver Info
set -euo pipefail

echo "============================================================"
echo "301 SUPER AI — NVIDIA GPU ACCELERATION PROFILE"
echo "============================================================"

if command -v nvidia-smi &>/dev/null; then
    nvidia-smi
elif [ -x "/usr/lib/wsl/lib/nvidia-smi" ]; then
    /usr/lib/wsl/lib/nvidia-smi
else
    echo "ERROR: nvidia-smi not found in PATH or /usr/lib/wsl/lib"
    exit 1
fi

echo -e "\n[CUDA DRIVER PASSTHROUGH]"
ls -l /usr/lib/wsl/lib/libcuda.so* 2>/dev/null || echo "libcuda.so not detected in /usr/lib/wsl/lib"
ls -l /dev/dxg 2>/dev/null || echo "/dev/dxg DirectX GPU device driver not detected"
