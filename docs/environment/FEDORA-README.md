# 301 SUPER AI — Fedora AI Research Lab

**Environment:** Fedora Linux 44 (WSL 2)  
**Hardware Target:** NVIDIA GeForce RTX 2050 (4GB VRAM)  
**Host System:** Windows 11 Enterprise (301 Production Host)  
**Authoritative Storage Mount:** `/mnt/e/Smart Automation/100-AI-Agents`

---

## 1. Mission & Role

This directory (`~/301-ai-research/`) is the isolated, sovereign AI Research, Training, and Optimization Laboratory for the 301 SUPER AI platform.

* **Windows:** Hosts the Gateway, Web UI, Desktop application, and customer-facing inference.
* **Fedora WSL 2:** Conducts parameter-efficient fine-tuning (LoRA/QLoRA), model quantization (GGUF), benchmarking, and edge runtime exports (MLC, ExecuTorch).

---

## 2. Directory Layout

```text
~/301-ai-research/
├── .venv/            # Isolated Python 3.11.16 virtual environment
├── models/           # Working copies of research models
├── datasets/         # Research training/eval datasets
├── training/         # QLoRA fine-tuning runs and adapter checkpoints
├── quantization/     # GGUF quantization work area
├── llama.cpp/        # llama.cpp repository & compiled binaries
├── mlc/              # MLC LLM compilation workspace
├── executorch/       # ExecuTorch edge export workspace
├── benchmarks/       # Reproducible latency & throughput reports
├── experiments/      # Experiment metadata and run configs
├── scripts/          # Shell helpers and execution harnesses
└── logs/             # Execution and hardware telemetry logs
```

---

## 3. Hardware Acceleration & GPU Access

GPU passthrough is enabled via Direct3D/DXCore driver `555.97`:
```bash
/usr/lib/wsl/lib/nvidia-smi
```
* **Device:** NVIDIA GeForce RTX 2050 Laptop GPU (GA107)
* **VRAM:** 4096 MiB GDDR6
* **CUDA Driver Support:** CUDA 12.5 (PyTorch built with CUDA 12.4)

---

## 4. Workflows & Helper Scripts

All scripts are located in `/mnt/e/Smart Automation/100-AI-Agents/scripts/fedora/`:

1. **System Health Check:**
   ```bash
   bash "/mnt/e/Smart Automation/100-AI-Agents/scripts/fedora/full-health-check.sh"
   ```
2. **PyTorch Hardware Test:**
   ```bash
   bash "/mnt/e/Smart Automation/100-AI-Agents/scripts/fedora/test-pytorch.sh"
   ```
3. **QLoRA PoC Training Run:**
   ```bash
   bash "/mnt/e/Smart Automation/100-AI-Agents/scripts/fedora/test-qlora.sh"
   ```
4. **Compile llama.cpp:**
   ```bash
   bash "/mnt/e/Smart Automation/100-AI-Agents/scripts/fedora/build-llamacpp.sh" CPU
   ```
5. **GGUF Quantization:**
   ```bash
   bash "/mnt/e/Smart Automation/100-AI-Agents/scripts/fedora/quantize-model.sh" model.gguf Q4_K_M
   ```
6. **Benchmark Inference:**
   ```bash
   bash "/mnt/e/Smart Automation/100-AI-Agents/scripts/fedora/benchmark-model.sh" model.gguf
   ```
7. **Export Artifact to E: Storage:**
   ```bash
   bash "/mnt/e/Smart Automation/100-AI-Agents/scripts/fedora/export-model.sh" model.gguf quantized
   ```

---

## 5. Storage Sovereignty

* **No C: drive writes.**
* Deliverables, final models, checkpoints, and reports are synced to:
  ```text
  /mnt/e/Smart Automation/100-AI-Agents/models/{research,fine-tuned,quantized,mobile}
  ```
