---
title: 301 Super AI Architecture
domain: engineering
status: VERIFIED
tags:
  - architecture
  - orchestrator
  - airgapped
---

# 301 Super AI Architecture

The **301 Super AI** platform operates a multi-tiered sovereign local AI orchestrator.

## Core Pillars
1. **Zero External Egress**: 100% air-gapped local execution with 0 external network calls.
2. **Hardware Constraints**: Single GPU mutex lock on [[NVIDIA GeForce RTX 2050]] with 4GB VRAM. Parallel lock-free CPU execution on Intel Core i5-11400H.
3. **Knowledge Layer**: Integrated with [[Obsidian Knowledge Bridge]] and local vector store.
4. **Local Runtime**: Powered by local [[Ollama]] daemon on port 11434 with zero cloud dependencies.

## Related Systems
- See [[Quantization]] for 4-bit and 8-bit quantization standards.
- Refer to [[QLoRA]] for domain-specific fine-tuning protocols.
