#!/usr/bin/env bash
# 301 SUPER AI — Fedora WSL 2 Environment Information
set -euo pipefail

echo "============================================================"
echo "301 SUPER AI — FEDORA WSL 2 ENVIRONMENT REPORT"
echo "============================================================"

echo "[OS & KERNEL]"
cat /etc/os-release | grep -E "^(NAME|VERSION|PRETTY_NAME)=" || true
uname -srmo

echo -e "\n[CPU & PROCESSORS]"
lscpu | grep -E "(Model name|CPU\(s\):|Thread\(s\) per core:|Core\(s\) per socket:)" || true

echo -e "\n[MEMORY & SWAP]"
free -h

echo -e "\n[STORAGE MOUNTS]"
df -h / "/mnt/e/Smart Automation/100-AI-Agents" 2>/dev/null || df -h /

echo -e "\n[PROJECT DIRECTORY]"
if [ -d "/mnt/e/Smart Automation/100-AI-Agents" ]; then
    echo "Path: /mnt/e/Smart Automation/100-AI-Agents (ACCESSIBLE)"
    ls -d "/mnt/e/Smart Automation/100-AI-Agents"/models/* 2>/dev/null || true
else
    echo "Path: /mnt/e/Smart Automation/100-AI-Agents (NOT MOUNTED)"
fi

echo -e "\n[RESEARCH ENVIRONMENT]"
if [ -d "$HOME/301-ai-research" ]; then
    echo "Research Dir: $HOME/301-ai-research (READY)"
    ls -la "$HOME/301-ai-research"
else
    echo "Research Dir: NOT FOUND"
fi
