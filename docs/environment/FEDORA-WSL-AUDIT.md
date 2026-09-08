# 301 SUPER AI — Fedora WSL 2 AI Research Environment Audit Report

**Date:** 2026-09-06  
**System Host:** REGINALD (Windows 11 x64)  
**Project Root (Windows):** `E:\Smart Automation\100-AI-Agents`  
**Project Root (WSL View):** `/mnt/e/Smart Automation/100-AI-Agents`  
**Audit Purpose:** Comprehensive, non-destructive system baseline assessment for the Fedora WSL 2 AI Research / Training / Optimization architecture.

---

## 1. Operating System & Windows Host Details

| Property | Value | Notes |
| :--- | :--- | :--- |
| **OS Type** | Windows_NT x64 | Windows 11 Enterprise / Pro |
| **OS Version** | `10.0.26200` | Modern Windows 11 build |
| **Windows Build** | `26200.9278` | Windows 11 24H2 Insider/Release Preview |
| **Kernel Architecture** | x86_64 | 64-bit multi-core architecture |
| **System Virtualization** | Enabled | Hardware virtualization (VT-x) and VM Platform active |

---

## 2. Hardware Resources & Compute Profiling

### 2.1 CPU & System RAM
* **Processor (CPU):** 11th Gen Intel(R) Core(TM) i5-11400H @ 2.70GHz
* **Cores / Threads:** 6 Physical Cores / 12 Logical Processors
* **Base Clock:** 2.70 GHz (Max Turbo ~4.50 GHz)
* **Total Usable Host RAM:** `8.30 GB` visible physical RAM
* **Host Free RAM at Audit:** `1.32 GB` (Preserving host stability is paramount)
* **Resource Safety Policy:** WSL memory allocation must be strictly capped (e.g. 3.5 GB to 4.0 GB max) to prevent Windows host memory exhaustion.

### 2.2 Dedicated NVIDIA GPU & Hardware Acceleration
* **GPU Model:** NVIDIA GeForce RTX 2050 (Laptop GPU, GA107 Ampere architecture)
* **GPU Memory (VRAM):** `4096 MiB (4.0 GB)` GDDR6
* **Windows Driver Version:** `555.97` (WDDM Driver Model)
* **Driver CUDA Capability:** Up to `CUDA 12.5` supported
* **Power Cap / State:** 70W max (operating at ~3W–4W idle, temp ~57°C–58°C)
* **Host Processes on GPU:** Minimal desktop composition (`msedge`, `ArmouryCrateKeyControl`), leaving ~3980 MiB VRAM free.

---

## 3. WSL 2 Subsystem & Installed Distributions

### 3.1 WSL Subsystem Status
* **WSL Core Version:** `2.7.11.0` (Latest modern package)
* **Linux Kernel Version:** `6.18.33.2-microsoft-standard-WSL2`
* **WSLg Version:** `1.0.73.2` (Wayland/X11 GUI support ready)
* **Direct3D / DXCore:** `1.611.1-81528511` / `10.0.26100.1` (Direct GPU passthrough enabled)
* **Default WSL Version:** `2`

### 3.2 Registered WSL Distributions
| Distribution Name | State | WSL Version | OS Release / Variant |
| :--- | :--- | :--- | :--- |
| **Fedora** | Registered / Running | 2 | Fedora Linux 44 (WSL) — Kernel 6.18.33.2 |
| **Ubuntu** | Registered / Running | 2 | Ubuntu Linux |

> [!IMPORTANT]
> **No Duplicate Distributions:** Fedora is already safely installed and registered under WSL 2 as `Fedora`. No unregistration or duplicate installation is needed or performed.

---

## 4. Storage Sovereignty & Disk Audit

| Drive | Total Space | Used Space | Free Space | Mount / Path | Usage Classification |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **C:\** | 156.42 GB | 152.47 GB | **3.95 GB** | `C:\` | **CRITICAL:** High utilization. Strict Zero-C:\ policy enforced. No models, datasets, or heavy build trees here. |
| **E:\** | 148.38 GB | 90.63 GB | **57.75 GB** | `E:\` (`/mnt/e`) | **AUTHORITATIVE PROJECT STORAGE:** Models, fine-tuned adapters, quantized GGUF weights, datasets, knowledge base. |
| **Fedora Root** | 1007.0 GB | 2.00 GB | **954.0 GB** | `/` (ext4) | **LOCAL LINUX RESEARCH FILESYSTEM:** Linux Python virtual environment, temporary compiler builds, scratch space. |

---

## 5. GPU Visibility Inside Fedora WSL 2

Executing `/usr/lib/wsl/lib/nvidia-smi` inside Fedora produces clean GPU discovery:
```text
+-----------------------------------------------------------------------------------------+
| NVIDIA-SMI 555.51                 Driver Version: 555.97         CUDA Version: 12.5     |
|-----------------------------------------+------------------------+----------------------+
| GPU  Name                 Persistence-M | Bus-Id          Disp.A | Volatile Uncorr. ECC |
|   0  NVIDIA GeForce RTX 2050        On  |   00000000:01:00.0 Off |                  N/A |
| N/A   57C    P8              3W /   66W |      92MiB /   4096MiB |      0%      Default |
+-----------------------------------------+------------------------+----------------------+
```
* **Status:** GPU passthrough via `libcuda.so.1` and `/dev/dxg` is active and functional.
* **VRAM Available in Fedora:** 4004 MiB free.
* **CUDA Target:** Driver 555.97 supports CUDA versions up to 12.5. PyTorch should be installed targeting CUDA 12.4 / 12.1 for maximum binary compatibility.

---

## 6. Development Toolchains & Environment Audit

### 6.1 Windows Host Toolchain
* **Ollama (Windows Production):** Installed at `C:\Users\ASUS\AppData\Local\Programs\Ollama\ollama.exe` (Serving all 12 production models from `E:\Smart Automation\100-AI-Agents\models\ollama`). Remains the primary production inference runtime.
* **Docker Desktop:** Installed at `C:\Program Files\Docker\Docker\resources\bin\docker.exe`.
* **Python (Windows):** Python 3.12 and 3.11 available for Windows gateway/orchestrator.
* **Node.js:** Node.js v22+ running production Gateway (Port 8300) and Desktop app.
* **NVCC (Windows):** Not installed on Windows host (not required; WSL manages CUDA internally).

### 6.2 Fedora Research Toolchain
* **System Python:** Python 3.14.3 (Fedora 44 standard)
* **Compilers:** `gcc` (15.x), `g++` (15.x), `make` available in `/usr/sbin/`
* **Package Manager:** `dnf` / `rpm`
* **Isolated Research Python:** Installed `uv` package & Python manager, provisioning isolated Python 3.11.16 (`cpython-3.11.16-linux-x86_64-gnu`) specifically for PyTorch CUDA, bitsandbytes, and QLoRA compatibility.
* **Storage Mounting:** `/mnt/e/Smart Automation/100-AI-Agents` directly readable and writable from Fedora.

---

## 7. Audit Conclusions & Architecture Boundaries

1. **Production System Safety:** Windows remains 100% untouched. Ollama, Gateway, Website (port 8300), and all 301 agents remain primary on Windows.
2. **Resource Throttling:** WSL memory will be limited in `.wslconfig` (e.g., 3800MB RAM, 1GB Swap) to maintain Windows host headroom.
3. **Hardware-Matched Research:** RTX 2050 (4GB VRAM) targets 0.5B, 1B, and 1.5B models (e.g. Qwen2.5-Coder 1.5B, SmolLM2 1.7B, Llama 3.2 1B) for QLoRA training and quantization experiments.
4. **Authoritative Artifact Flow:** Fedora compiles, trains, and quantizes models inside its fast native virtual filesystem (`~/301-ai-research/`), then exports deliverables to `E:\Smart Automation\100-AI-Agents\models\`.
