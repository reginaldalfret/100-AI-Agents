# 301 Super AI — Installer Payload & Packaging Audit

**Platform**: Sovereign AI Workbench (SIH Problem Statement 26117)  
**Date**: 2026-08-24  
**Audit Objective**: Identify root cause of the initial ~12 KB executable size and establish the complete, self-contained offline installer distribution architecture.

---

## 1. Root Cause Analysis of the ~12 KB Binary

### Findings
1. **Compilation Artifact vs Distribution Payload**:
   - The compiled `301-Super-AI-Setup.exe` and `301-Super-AI.exe` files were standalone native Windows PE binaries compiled via `csc.exe` (.NET Framework 4.0).
   - In standard Windows PE architecture, embedding a $6.67\text{ GB}$ payload directly into a single `.exe` exceeds the $2\text{--}4\text{ GB}$ PE32/PE64 header limitations and causes fatal memory crashes in standard Windows win32 loaders.
2. **Missing Bundled `offline-payload/` in Release Folder**:
   - The initial build compiled the installer wizard but left the physical model weights ($6.67\text{ GB}$) in the external store instead of provisioning a structured `release/offline-payload/` directory alongside the installer.
   - In `Launcher.cs`, a development fallback to `E:\\Smart Automation\\AI\\Models\\Ollama` remained, which violated clean-machine air-gap portability.

---

## 2. Remediation Strategy: Production Offline Installer Package

We adopt the industry-standard **Self-Contained Offline Distribution Architecture**:

```
release/
├── 301-Super-AI-Setup.exe          # Native Windows Installer Wizard (Installs app + provisions models)
├── 301-Super-AI-Setup.msi          # Enterprise MSI deployment package
├── 301-Super-AI.exe                # Native Desktop Shell / Launcher (Zero developer path dependency)
├── offline-payload/                # PHYSICAL 6.67 GB OFFLINE DATA STORE
│   ├── app/                        # Complete platform, gateway, agents, visuals, web UI
│   ├── models/
│   │   ├── ollama/
│   │   │   ├── blobs/              # Physical model blobs (Nemotron 3, Qwen 2.5 Coder, Gemma 3, Gemma 2)
│   │   │   └── manifests/          # Ollama model layer manifests
│   │   └── whisper/
│   │       └── tiny.en/            # Local Faster-Whisper weights (78 MB)
│   └── runtime/                    # Platform configurations
├── build-manifest.json             # Canonical release manifest
├── offline-payload-manifest.json   # Exact file-by-file payload manifest with SHA-256
└── checksums.txt                   # Cryptographic verification registry
```

---

## 3. Invariants Enforced
- **Zero Developer Path Dependencies**: Removed all occurrences of `E:\\Smart Automation` and `C:\\Users\\ASUS`.
- **Automatic Model Store Binding**: `Installer.cs` and `Launcher.cs` dynamically configure `OLLAMA_MODELS` to point to `%LOCALAPPDATA%\\301SuperAI\\models\\ollama` (or the packaged payload).
- **Offline Self-Containment**: The `release/offline-payload/` directory contains the complete $6.67\text{ GB}$ physical model store.
