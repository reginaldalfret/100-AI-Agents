# SOVEREIGN AI WORKBENCH — PERFORMANCE & HARDWARE Q&A FOR SIH JUDGES

---

### Q1: "How fast are your local models running on this machine?"
**A:** On our testbed (NVIDIA GeForce RTX 2050 4GB VRAM, 8GB RAM):
- **Qwen 2.5 Coder 1.5B:** **89.32 tokens/second** (12 ms TTFT).
- **Google Gemma 2 2B:** **54.92 tokens/second** (40 ms TTFT).
- **NVIDIA Nemotron 3 Nano 4B:** **35.10 tokens/second** (136 ms TTFT).
- **Local In-Process Vision/OCR Engine:** **61 ms median latency**.

### Q2: "What is the difference between Google Gemma 2 2B and your In-Process Vision Engine?"
**A:** They serve complementary roles in our pipeline:
1. **In-Process Vision & OCR Engine:** Optimized for sub-100ms high-throughput digitization of scanned ultrasonic inspection sheets and P&ID drawings (450 MB VRAM).
2. **Google Gemma 2 2B:** Used for deep semantic reasoning over visual defects, corrosion under insulation assessment, and equipment identification QA (2,351 MB VRAM).

### Q3: "How do you run multiple open-weight models within only 4GB VRAM?"
**A:** We use **single-slot sequential model execution (`MAX_MODEL_CONCURRENCY = 1`)**. The platform dynamically acquires GPU slots with Ollama `keep_alive` memory swapping, keeping peak memory below 3.5GB VRAM and completely preventing out-of-memory crashes.

### Q4: "Are these benchmark numbers measured locally or pulled from the internet?"
**A:** Every single metric is **empirically measured directly on this machine** via `scripts/benchmark/run-model-benchmark.js` and logged with exact GPU VRAM/RAM telemetry to `docs/benchmark/results.json`.

### Q5: "What is your zero-egress guarantee?"
**A:** All inference runs on `127.0.0.1:11434`. Our egress monitor verifies that exactly **0 external network calls** occur throughout the entire multi-model pipeline.
