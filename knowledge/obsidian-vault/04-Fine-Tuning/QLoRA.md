---
title: QLoRA Fine-Tuning Protocols
domain: ml-engineering
status: VERIFIED
tags:
  - qlora
  - finetuning
  - rtx2050
---

# QLoRA Fine-Tuning Protocols

**QLoRA** (Quantized Low-Rank Adaptation) reduces memory requirements by combining 4-bit NormalFloat (NF4) quantization with double quantization and paged optimizers.

## GPU VRAM Efficiency
On an **NVIDIA GeForce RTX 2050 (4GB VRAM)**, standard 16-bit LoRA exceeds memory limits for models over 1B parameters. QLoRA enables training adapters on:
- `qwen2.5-coder:1.5b`
- `gemma3:1b`
- `llama3.2:1b`

## Hyperparameter Standards
- **LoRA Rank (r)**: 8 or 16
- **Alpha**: 32
- **Target Modules**: `q_proj, v_proj, k_proj, o_proj`
- **Quantization**: NF4 with double quantization enabled.

Related notes: [[Quantization]], [[Mobile LLM Research]], and [[Cybersecurity]].
