# 301 SUPER AI — Windows Production + Fedora AI Research Architecture

## 1. Executive Mission & Target Architecture

This document defines the dual-environment operational model for **301 SUPER AI**:

* **Windows Workstation:** Remains the **PRIMARY PRODUCTION ENVIRONMENT**. Runs the Gateway Server, the Sovereign AI Desktop application, the Web Workbench, the Windows Ollama engine, and customer-facing agents.
* **Fedora WSL 2:** Serves as the **PRIMARY AI RESEARCH, TRAINING, & OPTIMIZATION LAB**. Hosts CUDA PyTorch, PEFT/QLoRA pipelines, llama.cpp compilation, GGUF quantization, and edge/mobile model preparation.
* **E: Drive Sovereignty:** All persistent artifacts, datasets, and models reside strictly on `E:\Smart Automation\100-AI-Agents\`.

```text
                 WINDOWS
                    │
            301 SUPER AI
                    │
        ┌───────────┼───────────┐
        │           │           │
      Website    Desktop      Ollama
        │           │           │
        └───────────┼───────────┘
                    │
              SHARED PROJECT
                    │
       E:\Smart Automation\100-AI-Agents
                    │
                    ▼
              WSL 2 FEDORA
                    │
        ┌───────────┼────────────┐
        │           │            │
      Training   Quantization  Mobile R&D
        │           │            │
      QLoRA      GGUF/Q4-Q2   MLC/ExecuTorch
        │           │            │
        └───────────┼────────────┘
                    │
                 ARTIFACTS
                    │
                    ▼
              301 MODEL FACTORY
```

---

## 2. Environment Division & Boundaries

| Domain | Windows Production | Fedora WSL 2 Research Lab |
| :--- | :--- | :--- |
| **Role** | Daily Production & Serving | Model Optimization & Training |
| **Runtime Port** | `127.0.0.1:8300` (Gateway) | Non-serving; batch worker |
| **Inference Engine** | Windows Ollama (`11434`) | `llama.cpp` test harness |
| **Hardware Access** | Display composition + Ollama | Direct CUDA acceleration (RTX 2050) |
| **Python Environment** | Python 3.12 (Host scripts) | Python 3.11.16 in `~/301-ai-research/.venv` |
| **Storage Mount** | `E:\Smart Automation\100-AI-Agents` | `/mnt/e/Smart Automation/100-AI-Agents` |
| **Temporary Builds** | Minimal (Node/Browser) | Native ext4 filesystem (`~/301-ai-research/`) |

---

## 3. Hardware Guardrails for NVIDIA RTX 2050 (4GB VRAM)

* **Supported Model Scales:** 0.5B, 1B, 1.5B (e.g. Qwen2.5-Coder 1.5B, SmolLM2 1.7B, Llama 3.2 1B).
* **3B Models:** Experimental; must use 4-bit quantization and restricted context windows (`seq_len <= 1024`).
* **7B+ Models:** Strictly unsupported for local training on 4GB VRAM.
* **Host Protection:** `.wslconfig` restricts WSL to `3800MB` RAM and `6` vCPUs, guaranteeing that Windows retains sufficient memory and compute.

---

## 4. Model Artifact Flow

1. **Source / Base Models:** Stored on `E:\...\models\cache\` or downloaded to Fedora native scratch.
2. **Fine-Tuning (QLoRA):** Runs in `~/301-ai-research/training/`, produces LoRA adapters.
3. **Quantization:** Runs via `llama-quantize` to produce Q8, Q6, Q5, Q4, Q3, Q2 variants.
4. **Export:** `export-model.sh` syncs final binaries to `E:\Smart Automation\100-AI-Agents\models\{fine-tuned,quantized,mobile}\`.
5. **Knowledge Integration:** Benchmark reports publish automatically to `knowledge/obsidian-vault/Research Reports/`.
