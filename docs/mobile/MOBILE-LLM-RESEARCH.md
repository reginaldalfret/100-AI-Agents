# 301 SUPER AI — Mobile LLM Research Pipeline

## 1. End-to-End Pipeline Overview

```text
MODEL (PyTorch / Safetensors)
      │
      ▼
OPTIMIZATION (LoRA / SVD / Pruning)
      │
      ▼
QUANTIZATION (Q4_K_M, Q3_K_M, Q2_K)
      │
      ▼
MOBILE FORMAT (.gguf / .pte / MLC package)
      │
      ▼
ANDROID EDGE DEPLOYMENT
      │
      ▼
DEVICE BENCHMARK (Latency, TTFT, Battery, Temperature)
```

---

## 2. Supported Mobile Runtimes

1. **llama.cpp / llama.rn:** Native C++ lightweight inference on ARM64 Android via JNI.
2. **ExecuTorch (PyTorch Edge):** Meta's edge execution engine supporting XNNPACK, Vulkan, and Qualcomm NPU backends.
3. **MLC LLM:** Apache TVM based compilation providing cross-platform GPU/Vulkan acceleration on modern smartphones.

---

## 3. Metric Targets for Mobile Deployment

| Metric | Target (Standard Phone) | Target (High-End Phone) |
| :--- | :--- | :--- |
| **Model Size** | < 1.0 GB (Q3/Q4 1B) | < 2.0 GB (Q4 1.5B/3B) |
| **RAM Footprint** | < 1.5 GB | < 3.0 GB |
| **Inference Speed** | > 15 tokens/sec | > 35 tokens/sec |
| **TTFT** | < 400 ms | < 150 ms |
