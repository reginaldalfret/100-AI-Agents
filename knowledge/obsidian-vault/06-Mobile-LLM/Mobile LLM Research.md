---
title: Mobile & Edge LLM Research
domain: mobile-computing
status: RESEARCH
tags:
  - mobile
  - edge
  - quantization
---

# Mobile & Edge LLM Research

Deploying language models on mobile and edge devices requires extreme parameter efficiency and sub-4-bit weights.

## Edge Deployment Architectures
1. **Liquid Neural Networks**: `LiquidAI/lfm2.5-350m` provides continuous-time adaptive inference with minimal memory footprint.
2. **RWKV Recurrent Architecture**: `mollysama/rwkv-7-g1d:0.4b` achieves constant-memory sequential inference without KV cache ballooning.
3. **Hardware Accelerators**: ARM NEON and Apple Metal support.

Refer to [[Quantization]] for GGUF formats and [[QLoRA]] for parameter-efficient adaptation.
