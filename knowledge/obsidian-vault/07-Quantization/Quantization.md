---
title: Quantization Formats & Benchmarks
domain: optimization
status: VERIFIED
tags:
  - quantization
  - gguf
  - q4_k_m
---

# Quantization Formats & Benchmarks

Quantization converts 16-bit floating-point weights (FP16) to lower bit representations to maximize throughput and minimize VRAM.

## GGUF Quantization Types
- **Q4_K_M**: 4-bit medium k-quant. Optimal balance of perplexity retention and memory footprint. Used across all GPU models in 301 Super AI.
- **Q8_0**: 8-bit standard quantization for high-precision CPU models.
- **FP16**: Full precision baseline (requires ~2GB VRAM per 1B parameters).

## RTX 2050 Benchmarks
- `nemotron-3-nano:latest` (Q4_K_M): 34.2 tokens/sec, 735ms TTFT.
- `qwen2.5-coder:1.5b` (Q4_K_M): 58.2 tokens/sec, 160ms TTFT.
- `llama3.2:1b` (Q4_K_M): 62.5 tokens/sec, 135ms TTFT.

See [[Ollama]], [[301 Architecture]], and [[QLoRA]].
