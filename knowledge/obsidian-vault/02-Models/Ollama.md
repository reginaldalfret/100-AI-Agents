---
title: Local Ollama Management
domain: infrastructure
status: VERIFIED
tags:
  - ollama
  - models
  - local
---

# Local Ollama Management

The local Ollama server serves all 12 on-premise foundation and specialist models.

## Service Configuration
- Endpoint: `http://127.0.0.1:11434`
- Models Path: `E:\Smart Automation\100-AI-Agents\models\ollama`
- GPU VRAM Guard: Handles single-model execution on RTX 2050 (4GB).
- Process Port: Protected against `EADDRINUSE` race conditions during supervisor auto-healing.

## Key Local Models
- **nemotron-3-nano:latest**: 2.8GB VRAM reasoning orchestrator.
- **qwen2.5-coder:1.5b**: 986MB coding specialist with Q4_K_M quantization.
- **llama3.2:1b**: Fast 1.3GB general conversational model.
- **LiquidAI/lfm2.5-350m**: Ultra-fast zero-VRAM CPU model.

See also [[Quantization]] and [[301 Architecture]].
