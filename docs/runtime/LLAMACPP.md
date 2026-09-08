# 301 SUPER AI — llama.cpp Runtime Architecture

## 1. Role in 301 SUPER AI

* **Development Target:** Fedora WSL 2 (`~/301-ai-research/llama.cpp`).
* **Capabilities:** GGUF inference, CPU AVX2 acceleration, CUDA GPU offloading, multi-level quantization (`llama-quantize`).
* **Artifact Output:** Standalone GGUF files for Windows Ollama and edge mobile testing.

## 2. Compilation
```bash
bash scripts/fedora/build-llamacpp.sh CPU
# or with CUDA acceleration:
bash scripts/fedora/build-llamacpp.sh CUDA
```
Binaries are placed in `~/301-ai-research/llama.cpp/build/bin/`.
