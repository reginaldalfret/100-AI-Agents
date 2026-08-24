# 301 Super AI — Self-Contained Windows Desktop Application

**Product**: 301 Super AI  
**Type**: Sovereign On-Premise Industrial AI Workbench (SIH Problem Statement 26117)  
**Target Platform**: Windows x64 Desktop Application (Self-Contained Installer)

---

## 1. User Experience: Zero Manual Configuration

The desktop application provides a single-click installer and autonomous runtime management:

```
DOWNLOAD → INSTALL → OPEN → SYSTEM READY
```

### Non-Negotiable Invariants Enforced
- **ZERO Manual Runtime Installations**: No prompts asking the user to install Python, Node.js, Ollama, C++ runtimes, or pip packages.
- **ZERO Model Downloads at Runtime**: Canonical local models are bundled or provisioned with the local installer payload.
- **ZERO Terminal / CLI Requirements**: All services (Ollama on `11434`, Python Compute on `8305`, Node Gateway on `8300`) are managed autonomously by the desktop supervisor daemon.
- **ZERO External Cloud Egress**: Pure loopback communication (`127.0.0.1`) with strict air-gap protection ($0$ cloud calls).

---

## 2. Desktop Architecture & Components

```
Electron Native Desktop Shell
  │
  ├── Main Process
  │     ├── Service Supervisor (Autonomous local daemon lifecycle manager)
  │     ├── Process Manager (Port probing, PID tracking, binary resolution)
  │     ├── Health Manager (Aggregated multi-tier diagnostics)
  │     ├── Diagnostics (Hardware detection: GPU, VRAM, CPU, RAM)
  │     ├── Tray Manager (Windows System Tray quick actions & status)
  │     └── Crash Breaker (Max 5 retries / 10-minute window)
  │
  ├── Preload Bridge
  │     └── Secure contextBridge IPC exposing native diagnostics & control
  │
  ├── Splash Bootstrapper
  │     └── 13-point preparation screen verifying application stack
  │
  └── Renderer
        └── 301 Super AI Liquid Glass Web Interface
```

---

## 3. Canonical Model Manifest (`models.json`)

| Model | Canonical Runtime Tag | Primary Role | Size | Min VRAM | Required |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **NVIDIA Nemotron 3** | `nemotron-3-nano:latest` | Master Orchestrator & Reasoning | 2.8 GB | 2.5 GB | **Yes** |
| **Qwen 2.5 Coder** | `qwen2.5-coder:1.5b` | Multi-Language Code Specialist | 986 MB | 1.2 GB | **Yes** |
| **Google Gemma 3** | `gemma3:4b` | Vision, Multimodal OCR & Documents | 3.3 GB | 3.0 GB | **Yes** |
| **Google Gemma 2** | `gemma2:2b` | Ultra-Fast Reasoning Fallback | 1.6 GB | 1.5 GB | No |
| **Faster-Whisper** | `tiny.en` | Air-Gapped Offline Voice Input | 78 MB | 200 MB | **Yes** |

---

## 4. Local Services Lifecycle & Port Allocation

- **Port 11434**: Ollama Local LLM Engine
- **Port 8305**: Python Compute Microservice (API-653 math, OCR, RAG vector embeddings, STT)
- **Port 8300**: 301 Super AI Node.js Gateway & Multi-Agent Orchestrator

### Duplicate Process Prevention
Before starting any local process, `ProcessManager` tests the target port and checks process command-line ownership. If a healthy instance is already running, the supervisor binds to and reuses it without spawning duplicate processes.

---

## 5. First-Launch Verification Battery

Upon launching `301-Super-AI-Setup.exe`, the splash bootstrapper verifies 13 subsystems:
1. ✓ Application Shell
2. ✓ Embedded Runtime
3. ✓ Ollama Engine
4. ✓ Model Verification
5. ✓ Python Compute
6. ✓ OCR Subsystem
7. ✓ Local RAG Embeddings
8. ✓ Offline Voice Input
9. ✓ Offline Read Aloud
10. ✓ 24 Chart Renderers
11. ✓ 301 Active Agents
12. ✓ GPU Hardware Acceleration
13. ✓ Strict Air-Gap Enforced

---

## 6. Build & Packaging Commands

- `npm run desktop:test` — Execute all 9 native desktop tests.
- `npm run desktop:build` — Validate pre-flight checks and compile installer metadata.
- `npm run desktop:start` — Launch the desktop shell.
