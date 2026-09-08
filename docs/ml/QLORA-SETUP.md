# 301 SUPER AI — QLoRA Fine-Tuning Setup & Guide

## 1. Overview & Hardware Sizing

QLoRA (Quantized Low-Rank Adaptation) enables parameter-efficient fine-tuning of Large Language Models on consumer-grade hardware. For the **NVIDIA GeForce RTX 2050 (4096 MiB VRAM)**, memory budgets are strictly calculated:

| Model Scale | Precision | VRAM Footprint | Training Status |
| :--- | :--- | :--- | :--- |
| **0.5B (Qwen2.5 0.5B)** | 4-bit NormalFloat (NF4) | ~1.1 GB | **SAFE** (Fast iteration) |
| **1.0B - 1.5B (Qwen / Llama 3.2 1B)** | 4-bit NormalFloat (NF4) | ~1.8 - 2.4 GB | **SAFE** (Recommended target) |
| **3B (Phi-4 Mini / Granite 3B)** | 4-bit NF4 + Gradient Checkpointing | ~3.4 - 3.7 GB | **TIGHT** (seq_len <= 512) |
| **7B+** | Any | > 5.5 GB | **UNSUPPORTED** |

## 2. Configuration Parameters
* **Rank ($r$):** 8 or 16
* **Alpha ($\alpha$):** 16 or 32
* **Target Modules:** `q_proj`, `v_proj`, `k_proj`, `o_proj`
* **Optimizer:** `paged_adamw_8bit` or `AdamW`
* **LoRA Dropout:** 0.05
* **Double Quantization:** Enabled (`bnb_4bit_use_double_quant=True`)
* **Compute Dtype:** `torch.float16` or `torch.bfloat16`

## 3. Verification Workflow
Execute the verification harness inside Fedora WSL 2:
```bash
bash scripts/fedora/test-qlora.sh
```
Adapters are saved to `~/301-ai-research/training/checkpoints/` and exported to `E:\Smart Automation\100-AI-Agents\models\fine-tuned\`.
