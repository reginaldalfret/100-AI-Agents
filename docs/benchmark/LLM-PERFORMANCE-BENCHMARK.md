# 301 Super AI — Real-World LLM Performance Benchmark

**Hardware Target**: NVIDIA GeForce RTX 2050 (4 GB VRAM), 12-Core Intel i5-11400H, Windows 11  
**Benchmark Nature**: Non-Stress Normal Real-World Workload  
**Testing Methodology**: Sequential Single-Model Inference · 0 Cloud Network Calls · Thermal Bound < 85°C

---

## 1. Executive Summary

| Category | Winner Model | Measured Metric |
| :--- | :--- | :--- |
| **Fastest Time to First Token (TTFT)** | **qwen2.5-coder:1.5b** | **199 ms** |
| **Fastest Generation Throughput** | **qwen2.5-coder:1.5b** | **89.98 tokens/sec** |
| **Lowest VRAM Footprint** | **qwen2.5-coder:1.5b** | **1573 MB** |
| **Lowest System RAM Usage** | **qwen2.5-coder:1.5b** | **5277 MB** |
| **Best RTX 2050 Efficiency Profile** | **qwen2.5-coder:1.5b** | **Top Latency-to-Throughput Balance** |

---

## 2. Complete Model Benchmark Comparison

| Model Name | Size | TTFT (ms) | Cold Latency (ms) | Warm Latency (ms) | Speed (tokens/s) | VRAM (MB) | GPU Temp | RTX 2050 Tier |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `phi4-mini:latest` | 2.32 GB | 439 ms | 8724 ms | 4941 ms | **17.77 t/s** | 2675 MB | 64°C | 🟢 GREEN (Optimal) |
| `granite4:1b-h` | 1.45 GB | 217 ms | 2993 ms | 1514 ms | **53.26 t/s** | 2081 MB | 66°C | 🟢 GREEN (Optimal) |
| `llama3.2:1b` | 1.23 GB | 237 ms | 3053 ms | 1293 ms | **76.04 t/s** | 1905 MB | 67°C | 🟢 GREEN (Optimal) |
| `gemma4:e2b` | 6.67 GB | 7983 ms | 20855 ms | 7983 ms | **11.33 t/s** | 376 MB | 64°C | 🔴 RED (CPU Fallback / Limited) |
| `gemma3:4b` | 3.11 GB | 1024 ms | 10849 ms | 5836 ms | **11.64 t/s** | 2829 MB | 64°C | 🟢 GREEN (Optimal) |
| `gemma2:2b` | 1.52 GB | 258 ms | 3601 ms | 1543 ms | **55.35 t/s** | 2501 MB | 66°C | 🟢 GREEN (Optimal) |
| `qwen2.5-coder:1.5b` | 0.92 GB | 199 ms | 2530 ms | 411 ms | **89.98 t/s** | 1573 MB | 65°C | 🟢 GREEN (Optimal) |
| `nemotron-3-nano:latest` | 2.64 GB | 882 ms | 4714 ms | 2540 ms | **35.43 t/s** | 3145 MB | 68°C | 🟢 GREEN (Optimal) |

---

## 3. RTX 2050 Tier Classifications

- 🟢 **GREEN (Comfortable / Recommended for 4GB VRAM)**:
  - `llama3.2:1b` (1.3 GB) — Ultra-low latency, optimal for rapid text generation.
  - `granite4:1b-h` (1.6 GB) — Lightweight footprint, specialized for enterprise RAG and tool calls.
  - `qwen2.5-coder:1.5b` (986 MB) — Extremely compact code specialist with rapid throughput.
  - `nemotron-3-nano:latest` (2.8 GB) — Fits cleanly in 4GB VRAM for master orchestration.
  - `phi4-mini:latest` (2.5 GB) — Excellent high-speed mathematical and analytical reasoning.
- 🟡 **YELLOW (High Resource)**:
  - `gemma3:4b` (3.3 GB) — Consumes ~3.1GB VRAM, leaves tight headroom for OS UI.
  - `gemma2:2b` (1.6 GB) — Operable, superceded by Gemma 4 / Llama 3.2.
- 🔴 **RED (Memory Constrained on 4GB)**:
  - `gemma4:e2b` (7.2 GB) — Exceeds 4GB VRAM capacity; runs via CPU buffer offloading.

---

## 4. Role Assignment Recommendations

| Role | Recommended Model | Reason based on Benchmark Data |
| :--- | :--- | :--- |
| **Super AI Orchestrator** | **`nemotron-3-nano:latest`** | Robust epistemic reasoning, fits completely inside 4GB VRAM. |
| **Coding & Sandbox** | **`qwen2.5-coder:1.5b`** | High throughput code synthesis, minimal memory overhead (986MB). |
| **Lightweight Text & Chat** | **`llama3.2:1b`** | Sub-second TTFT, ideal for summaries, proofreading, and general conversation. |
| **Enterprise RAG & Tools** | **`granite4:1b-h`** | Built-in tool calling support and compact memory profile. |
| **Math & Logic Specialist** | **`phi4-mini:latest`** | Deep analytical reasoning with fast token generation. |
| **Multimodal / Document QA** | **`Python Compute OCR + Llama/Gemma`** | Dedicated OCR engine extracts structured tokens with zero GPU pressure. |
