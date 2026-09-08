#!/usr/bin/env bash
# 301 SUPER AI — Complete Fedora WSL 2 Research Environment Health Check
set -euo pipefail

echo "============================================================"
echo "301 SUPER AI — FULL SYSTEM & RESEARCH HEALTH CHECK"
echo "============================================================"

echo -e "\n[1. OS & DISTRO]"
cat /etc/os-release | grep PRETTY_NAME
uname -r

echo -e "\n[2. PROCESSORS & MEMORY]"
echo "Logical CPUs: $(nproc)"
free -h | awk 'NR==2{printf "RAM: Total: %s, Available: %s\n", $2, $7}'

echo -e "\n[3. NVIDIA GPU & CUDA]"
if [ -x "/usr/lib/wsl/lib/nvidia-smi" ]; then
    /usr/lib/wsl/lib/nvidia-smi --query-gpu=name,driver_version,memory.total,memory.free --format=csv,noheader
else
    echo "NVIDIA SMI: NOT FOUND"
fi

echo -e "\n[4. LINUX TOOLCHAIN]"
echo "GCC: $(gcc --version 2>&1 | head -n 1)"
echo "CMake: $(cmake --version 2>&1 | head -n 1)"
echo "Ninja: $(ninja --version 2>&1 | head -n 1)"
echo "Git: $(git --version 2>&1 | head -n 1)"

echo -e "\n[5. PYTHON RESEARCH RUNTIME]"
VENV_PY="$HOME/301-ai-research/.venv/bin/python"
if [ -x "$VENV_PY" ]; then
    echo "Python: $("$VENV_PY" --version)"
    "$VENV_PY" -c "
try:
    import torch
    print(f'PyTorch: {torch.__version__} (CUDA: {torch.cuda.is_available()})')
    if torch.cuda.is_available():
        print(f'CUDA Device: {torch.cuda.get_device_name(0)}')
except ImportError:
    print('PyTorch: Not installed yet')
try:
    import transformers
    print(f'Transformers: {transformers.__version__}')
except ImportError:
    print('Transformers: Not installed')
try:
    import peft
    print(f'PEFT: {peft.__version__}')
except ImportError:
    print('PEFT: Not installed')
try:
    import bitsandbytes as bnb
    print(f'bitsandbytes: {bnb.__version__}')
except ImportError:
    print('bitsandbytes: Not installed')
"
else
    echo "Python Venv: NOT FOUND at $VENV_PY"
fi

echo -e "\n[6. PROJECT STORAGE INTEGRATION]"
if [ -d "/mnt/e/Smart Automation/100-AI-Agents" ]; then
    echo "Windows E: Mount: OK (/mnt/e/Smart Automation/100-AI-Agents)"
    echo "Models Dir: $(ls -d "/mnt/e/Smart Automation/100-AI-Agents/models"/* 2>/dev/null | wc -l) categories ready"
else
    echo "Windows E: Mount: MISSING"
fi

echo -e "\n[7. LLAMA.CPP / QUANTIZATION STATUS]"
if [ -x "$HOME/301-ai-research/llama.cpp/build/bin/llama-cli" ]; then
    echo "llama-cli: READY"
else
    echo "llama-cli: SOURCE / BUILD IN PROGRESS"
fi

echo -e "\n============================================================"
echo "HEALTH CHECK COMPLETED"
echo "============================================================"
