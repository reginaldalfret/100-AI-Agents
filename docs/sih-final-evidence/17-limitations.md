# 17 — HONEST TECHNICAL LIMITATIONS & CONSTRAINTS

### 1. Hardware Concurrency (4GB VRAM Baseline)
- The local GPU is an NVIDIA RTX 2050 (4GB VRAM). To prevent memory thrashing or out-of-memory crashes, heavy model inference must run with bounded concurrency (`MAX_CONCURRENT_MODELS=1`).

### 2. Extremely Degraded Handwriting
- Heavily degraded handwritten cursive notes with low contrast are assigned low confidence scores and escalated to human visual confirmation rather than hallucinating false numerical values.

### 3. Engineering Drawing Interpretation
- P&ID schematic understanding focuses on tag isolation (`TK-101`, `HX-204`, `PSV-101A`), line specifications, and safety valve interlocks. It is intended as an engineering aid, not a replacement for certified piping engineers.

### 4. Air-Gapped Model Weight Updates
- Model weights (GGUF/Ollama) are static on local disk. Updates must be provisioned via physical USB/intranet deployment packages in compliance with refinery air-gap protocols.
