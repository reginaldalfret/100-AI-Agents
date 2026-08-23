# PDF Content-First & Page-First Architecture

## Executive Summary
In the Sovereign AI Workbench, document ingestion treats **visible page content as primary** while isolating technical metadata (C2PA manifests, XMP streams, internal PDF objects, cross-reference tables, hashes). Native text extraction is prioritized over multimodal vision models (e.g. Google Gemma 3), ensuring maximum response speed, low compute overhead on 4GB VRAM GPUs, and zero metadata confusion.

## Core Architectural Invariants
1. **Page-First Hierarchy**: PDFs are parsed page-by-page. Native text operators (`(text) Tj`, `[(text)] TJ`, `'`, `"`, `<hex> Tj`) are extracted directly from content streams.
2. **Strict Content vs. Metadata Separation**:
   - `contentText`: Visible human-authored document text. Primary payload for LLM reasoning and agent execution.
   - `metadataText`: Technical metadata (Producer, Creator, C2PA claims, XMP blocks, hashes, UUIDs). Only supplied when the user explicitly queries document metadata or credentials.
3. **Smart Vision Gating**:
   - Native text PDFs (`needsVision: false`, `isMultimodalImage: false`) bypass Gemma 3 Vision completely and route directly to text models (NVIDIA Nemotron 3 / Qwen 2.5 Coder).
   - Scanned image PDFs (<10 characters native text) trigger local OCR or Gemma 3 Vision sequentially with a strict single-model GPU lock.
4. **Intent-Based Agent Execution**:
   - "Analyze this PDF" -> Super AI Agent / Document Research Agent.
   - "Write an email based on this PDF" -> Email AI Agent (`agent-002`).
   - "Study this PDF" -> Study AI Agent (`agent-003`).

## Data Pipeline Diagram
```
[ Uploaded PDF Attachment ]
             |
   Base64 Stream Decoder
             |
   +-------------------------------------------------------+
   | Multi-Strategy Native Parser                          |
   | - BT ... ET Text Stream Scanning                      |
   | - Text Operator Extraction (Tj, TJ, ', ")             |
   | - Page Count Detection                                |
   +-------------------------------------------------------+
             |
             +------------------------------+
             |                              |
      [ Visible Content ]           [ Metadata Filter ]
             |                              |
     Filtered Content Text          Isolated Metadata
             |                              |
             +------------------------------+
                            |
           Native Text Character Count >= 10?
                     /              \
                   YES               NO
                  /                    \
   [ Native Text Mode ]          [ Scanned PDF Mode ]
   - needsVision: false          - needsVision: true
   - Zero Vision VRAM overhead   - Google Gemma 3 / OCR
   - Ultra-fast (<10ms)
```
