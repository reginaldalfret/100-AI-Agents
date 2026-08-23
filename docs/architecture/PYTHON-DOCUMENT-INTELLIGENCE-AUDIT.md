# Python Document Intelligence Architecture Audit

> **Platform:** Sovereign AI Workbench (101 Super AI Agents)  
> **Subsystem:** Python Compute Layer  
> **Target Problem Statement:** SIH 26117 — Sovereign On-Premise Industrial AI Workbench

---

## 1. Executive Summary

This document establishes the official responsibility split between Node.js and Python for the 101 Super AI Agents platform:

- **Node.js Core**: Owns API Gateway, Agent Runtime, Multi-Agent Orchestration (Agent 101), True Token Streaming, State Persistence, Artifact Registry, and User Governance.
- **Python Compute Layer**: Owns advanced document parsing (PDF, DOCX, XLSX, PPTX), layout detection, table extraction, OCR confidence scoring, image preprocessing (deskew, denoise, contrast), P&ID vector feature extraction, Pandas/NumPy analytics, and deterministic engineering calculation verification.
- **Ollama Engine**: Local LLM and Multimodal Vision inference (Gemma 3, Nemotron 3, Qwen 2.5 Coder).
- **Browser**: Interactive Liquid Glass UI, SVG/PNG chart rendering, and artifact workspace.
