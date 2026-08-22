# PORT OWNERSHIP AUDIT

**Project:** Sovereign AI Workbench (`E:\Smart Automation\100-AI-Agents`)  
**Audit Timestamp:** 2026-08-22  
**Hardware:** Windows 11 | RTX 2050 4GB | 8GB RAM  

---

## 1. Complete Port Ownership Inventory

| Port | Protocol | Owning PID | Process Name | Command Line / Executable | Purpose | Classification |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **8300** | TCP | 416 | `node.exe` | `node platform/gateway/src/server.js` | Sovereign AI Workbench API & Web UI Gateway | **KEEP (Core)** |
| **11434**| TCP | 19280 | `ollama.exe` | `ollama.exe serve` | Ollama Local LLM Inference Daemon (Gemma/Qwen/Nemotron) | **KEEP (Core)** |
| **8088** | TCP | 11676 | `llama-server.exe`| `llama-server.exe -m NVIDIA-Nemotron3-Nano-4B-Q4_K_M.gguf -ngl 32` | Nemotron 4B Local CUDA AI Engine | **KEEP (Core)** |
| **20241**| TCP | 13656 | `cloudflared.exe` | `cloudflared.exe --config ... tunnel run dailygurus-pricelist` | Cloudflare Edge Ingress (`smartauto.reginaldalfret.tech`) | **KEEP (Core)** |
| **8000** | TCP | 8636 | `php.exe` | `php.exe -S 127.0.0.1:8000 -t "E:\DG - Price List" ...` | Old Price List PHP dev server (spawned via stale startup bat) | **REMOVE (Obsolete)** |
| **8080** | TCP | 6884 | `postgres.exe` | `C:\Program Files\PostgreSQL\18\bin\postgres.exe` | PostgreSQL 18 Local Database Engine | **KEEP (System/DB)** |
| **7778** | TCP | 5404 | `ArmouryCrateControlInterface.exe` | ASUS ACCI Background IPC | ASUS Hardware Control Loop | **SYSTEM (Do Not Touch)** |
| **9012** | TCP | 11440 | `ArmourySocketServer.exe` | ASUS Armoury Socket IPC | ASUS Hardware Device Server | **SYSTEM (Do Not Touch)** |
| **9013** | TCP | 11440 | `ArmourySocketServer.exe` | ASUS Armoury Socket IPC | ASUS Hardware Device Server | **SYSTEM (Do Not Touch)** |
| **9993** | TCP | 6616 | `zerotier-one_x64.exe` | ZeroTier One Virtual Network Daemon | Mesh VPN Networking | **SYSTEM (Do Not Touch)** |
| **49975-49978** | TCP | 13328, 13168 | `Antigravity.exe`, `language_server.exe` | Antigravity IDE & Extension Host | IDE Tooling & Language Server Protocol | **SYSTEM (Do Not Touch)** |
| **135, 445** | TCP | 1824, 4 | `svchost.exe`, `System` | Windows RPC & SMB Subsystem | Core Windows OS Services | **SYSTEM (Do Not Touch)** |

---

## 2. Ingress & Routing Topology

```text
                                  INTERNET
                                     │
                                     ▼
                      https://smartauto.reginaldalfret.tech
                                     │
                          [Cloudflare Edge Tunnel]
                                     │
                                     ▼
                         cloudflared.exe (PID 13656)
                                     │
                 ┌───────────────────┴───────────────────┐
                 ▼                                       ▼
        http://127.0.0.1:8300                   http://127.0.0.1:11434
     Sovereign Gateway (PID 416)                  Ollama (PID 19280)
                 │                                       │
                 ▼                                       ▼
        101-Agent Fleet                             Local LLMs
   (Supervisor: PID 5128)                    (Gemma 3, Qwen 2.5, Nemotron)
```
