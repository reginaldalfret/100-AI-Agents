# SA-S03 Production Deployment & Operating Manual

**Platform:** SA-S03 — Educational Intelligent Workflow Management Platform  
**Live Public Edge URL:** `https://smartauto.reginaldalfret.tech` (and `https://smartauto.reginald.tech`)  
**Local Gateway Address:** `http://127.0.0.1:8300`  
**Ollama Inference Server:** `http://127.0.0.1:11434` (Local loopback only)  
**Agent Ports:** `8101–8201` (Internal private network)  
**Operating System:** Windows 11 on NVIDIA RTX 2050 (4GB VRAM) / 8GB RAM  

---

## 1. System Architecture & Public Edge Security

```
                            INTERNET / JUDGES
                                   |
                                   v
             https://smartauto.reginaldalfret.tech
                                   |
                                   v
                            CLOUDFLARE EDGE
                         (Automated HTTPS / WAF)
                                   |
                                   v
                           CLOUDFLARE TUNNEL
                         (Cloudflared Service)
                                   |
                                   v
                         http://127.0.0.1:8300
                                   |
                                   v
                            SA-S03 GATEWAY
                     +-------------+-------------+
                     |                           |
                     v                           v
              WORKFLOW ENGINE             100-AGENT FLEET
                     |                     (:8101-:8201)
                     v                           |
                 AGENT 101                       v
            (Master Orchestrator)          TOOL REGISTRY
                                                 |
                                                 v
                                           INSTITUTIONAL
                                              SERVICES
                                                 |
                                                 v
                                             DATASTORE
```

### Security Guarantees
- **No Direct Port Exposure:** Ports `8300`, `11434`, and agent ports `8101–8201` are never bound to external network interfaces. All public traffic enters strictly through Cloudflare Edge with full TLS termination.
- **Private Inference Engine:** Ollama runs strictly on `127.0.0.1:11434` and cannot be accessed externally.
- **RBAC Tool Invocation:** Agents interact with institutional data exclusively via permissioned functions in `platform/tools/tool-registry.js`.

---

## 2. Windows Auto-Start & Process Supervisor

The platform is managed by a continuous Node.js supervisor (`scripts/supervisor.js`) registered as a Windows Scheduled Task (`SA-S03-Educational-Platform`):

```powershell
# Registered Task
Task Name: SA-S03-Educational-Platform
Trigger:   At Windows Logon / System Startup
Action:    PowerShell -ExecutionPolicy Bypass -File E:\Smart Automation\100-AI-Agents\scripts\start-production.ps1
```

### Auto-Recovery Protocol
- Every 5000ms, the supervisor performs heartbeat probes on:
  1. Ollama (`127.0.0.1:11434/api/tags`)
  2. API Gateway (`127.0.0.1:8300/api/info`)
  3. Agent Fleet (`127.0.0.1:8102/api/health`)
- If any process terminates or becomes unresponsive, the supervisor automatically restarts it with bounded backoff and logs the event to `logs/supervisor.log`.

---

## 3. Operational Commands

### Health Verification
```powershell
powershell -ExecutionPolicy Bypass -File scripts/check-production.ps1
```

### Manual Service Restart
```powershell
# Restart Cloudflare Tunnel
Restart-Service -Name "Cloudflared"

# Restart Supervisor and Fleet
node scripts/supervisor.js
```
