# SOVEREIGN AI WORKBENCH — PERFORMANCE & HARDWARE Q&A FOR SIH JUDGES

---

### Q1: "How fast are your local models running on this machine?"
**A:** On our testbed (NVIDIA GeForce RTX 2050 4GB VRAM, 8GB RAM), **NVIDIA Nemotron 3 Nano 4B** generates reasoning and multi-agent plans at **~20 tokens/second**, while **Qwen2.5-Coder 1.5B** executes sandbox calculations at **~40 tokens/second**. Multimodal OCR and defect visual extraction process in **under 250 milliseconds**.

### Q2: "How do you run 3 specialized models within only 4GB VRAM?"
**A:** We enforce a **Sequential Model Execution Pipeline** with single-slot memory management (`MAX_CONCURRENCY = 1`). When the router transitions from vision extraction to engineering calculation to executive synthesis, it dynamically acquires the GPU slot with `keep_alive: 0` swapping, preventing VRAM overflow while maintaining sub-second transition latencies.

### Q3: "Why choose multiple specialized models instead of a single massive LLM?"
**A:** A single 70B parameter model requires 40GB+ VRAM (datacenter GPUs), making it impossible to deploy at edge refinery units. By orchestrating three right-sized, open-weight models (Nemotron 4B for reasoning, Gemma/Vision for OCR, and Qwen 1.5B for code), we achieve higher domain accuracy, lower latency, and 100% on-premise execution on commercial laptop hardware.

### Q4: "Are these benchmark numbers measured locally or pulled from the internet?"
**A:** Every single metric is **measured directly on this physical machine** via our automated benchmarking lab (`scripts/benchmark/run-model-benchmark.js`) and saved with GPU VRAM/RAM telemetry to `docs/benchmark/results.json`.

### Q5: "What happens if a model fails or encounters missing data?"
**A:** The **Autonomous Replanner** detects the anomaly, gracefully reassigns subtasks to the local fallback orchestrator (Agent 101), injects missing parameter queries into the DAG, and pauses at the Human-In-The-Loop checkpoint if critical safety thresholds are breached.
