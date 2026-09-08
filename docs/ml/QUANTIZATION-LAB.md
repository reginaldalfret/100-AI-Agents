# 301 SUPER AI — GGUF Quantization Lab

## 1. Objectives & Policy

The GGUF Quantization Lab provides tools to convert, quantize, and inspect models into varying precision formats using `llama.cpp` inside Fedora WSL 2.

### Critical Policy:
* **Original Models:** Never overwritten.
* **Quantized Outputs:** Always written to a distinct artifact path.
* **Storage Destination:** `E:\Smart Automation\100-AI-Agents\models\quantized\<model_name>\`.

---

## 2. Quantization Profiles & Trade-Offs

| Format | Bits/Weight | Relative Size | Perplexity Penalty | Recommended Use |
| :--- | :--- | :--- | :--- | :--- |
| **Q8_0** | 8.5 | ~100% | Negligible (~0.001) | Reference baseline, high-precision desktop |
| **Q6_K** | 6.56 | ~77% | Very Low (~0.01) | High-fidelity inference on 8GB host RAM |
| **Q5_K_M**| 5.5 | ~65% | Low (~0.05) | Balanced desktop performance |
| **Q4_K_M**| 4.5 | ~53% | Moderate (~0.10) | **Default standard for 4GB VRAM & Mobile** |
| **Q3_K_M**| 3.5 | ~42% | Moderate-High | Edge / RAM-constrained mobile devices |
| **Q2_K** | 2.5 | ~31% | Significant | Experimental / extreme low-memory research |

---

## 3. Running Quantization
```bash
bash scripts/fedora/quantize-model.sh <input_fp16.gguf> Q4_K_M [output.gguf]
```
Outputs can be benchmarked using `scripts/fedora/benchmark-model.sh`.
