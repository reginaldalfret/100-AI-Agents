# SOVEREIGN AI WORKBENCH — STORAGE ARCHITECTURE

**Host System:** Windows 11  
**Storage Invariant:** **E: DRIVE AUTHORITATIVE WORKSPACE ONLY**  
**Date:** August 22, 2026  

---

## 1. Physical Disk Layout

```
C:\ (System Only)
├── Windows\
├── Program Files\
├── Users\ASUS\AppData\Local\Programs\Ollama\ (Binaries only)
└── Users\ASUS\.gemini\ (Antigravity IDE system state)

E:\ (Authoritative Project & AI Workspace)
└── Smart Automation\
    ├── 100-AI-Agents\
    │   ├── agents\                  # 101 Specialized Industrial Agents
    │   ├── platform\                # Gateway, UI, Multimodal, Models, Sandbox, Security
    │   ├── registry\                # Fleet mappings & Agent manifests
    │   ├── scripts\                 # Launchers, benchmarks & automation tools
    │   ├── tests\                   # Unit, contract & 12 SIH test suites
    │   ├── docs\                    # Technical architecture & evidence reports
    │   ├── data\                    # Test datasets & sample uploads
    │   ├── artifacts\               # Generated .docx, .xlsx, .pptx deliverables
    │   ├── logs\                    # Fleet & supervisor runtime logs
    │   ├── temp\                    # Isolated project temporary processing
    │   ├── cache\                   # Project build & RAG caches
    │   └── archive\                 # Preserved historical backup snapshots
    │
    ├── AI\
    │   ├── Models\
    │   │   └── Ollama\              # 100% of LLM Blobs & Manifests (Nemotron, Qwen, Gemma)
    │   ├── Datasets\                # Refinery datasets & NDT inspection records
    │   ├── Embeddings\              # Local vector embeddings & standard chunks
    │   ├── VectorDB\                # Local SQLite vector knowledge database
    │   └── Runtime\                 # Multi-model lifecycle scratchpad
    │
    └── Antigravity\
        ├── Projects\                # Registered project link
        ├── Logs\                    # Antigravity project logs
        ├── Cache\                   # Antigravity project cache
        └── Temp\                    # Antigravity scratch files
```

---

## 2. Zero C-Drive Leakage Invariant
1. All AI model weights reside in `E:\Smart Automation\AI\Models\Ollama\`.
2. All agent code, manifests, and test runs execute with `cwd = E:\Smart Automation\100-AI-Agents\`.
3. All deliverables (.docx, .xlsx, .pptx) are saved to `E:\Smart Automation\100-AI-Agents\artifacts\`.
4. All logs and audit traces write directly to `E:\Smart Automation\100-AI-Agents\logs\`.
