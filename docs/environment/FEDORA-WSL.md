# 301 SUPER AI — Fedora WSL 2 Setup & Operations Guide

## 1. Overview
Fedora Linux under WSL 2 is the dedicated AI Research, Training, and Optimization Environment for 301 SUPER AI.
* **Distribution Name:** `Fedora` (Fedora Linux 44)
* **Kernel:** WSL 2 Linux Kernel 6.18+ with Direct3D/DXCore GPU passthrough
* **Dedicated Research Root:** `~/301-ai-research/`
* **Authoritative Project Mount:** `/mnt/e/Smart Automation/100-AI-Agents`

---

## 2. Resource Policy
Configured in `C:\Users\ASUS\.wslconfig`:
```ini
[wsl2]
networkingMode=mirrored
memory=3800MB
processors=6
swap=2GB
pageReporting=true
```
This guarantees at least 4.5 GB RAM and 6 CPU threads are permanently reserved for Windows production services.

---

## 3. Quick Commands
* **Environment Info:** `bash scripts/fedora/env-info.sh`
* **GPU Status:** `bash scripts/fedora/gpu-info.sh`
* **PyTorch CUDA Test:** `bash scripts/fedora/test-pytorch.sh`
* **QLoRA PoC:** `bash scripts/fedora/test-qlora.sh`
* **Full Health Check:** `bash scripts/fedora/full-health-check.sh`
