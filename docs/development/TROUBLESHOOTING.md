# Super AI — Operational Troubleshooting & Diagnostics Guide

This manual provides rapid diagnostic solutions for operational issues encountered during development, testing, or production deployment.

---

## 1. Port Conflicts (Port 8300 / 11434)

### Symptom: `Error: listen EADDRINUSE: address already in use :::8300`
- **Cause**: An existing instance of the platform gateway is already running in the background.
- **Resolution**:
  ```powershell
  # 1. Identify the process holding port 8300
  Get-NetTCPConnection -LocalPort 8300 -ErrorAction SilentlyContinue | Select-Object OwningProcess, State

  # 2. Terminate the process
  Stop-Process -Id <PID> -Force

  # 3. Restart the gateway
  npm start
  ```

---

## 2. Local Model Inference & Ollama Issues

### Symptom: `Failed to fetch from local model runner (127.0.0.1:11434)`
- **Cause**: Ollama service is stopped or listening on another interface.
- **Resolution**:
  ```powershell
  # 1. Verify Ollama process
  Get-Process -Name "ollama" -ErrorAction SilentlyContinue

  # 2. Check local model list
  ollama list

  # 3. Start Ollama with authoritative E: drive model path
  $env:OLLAMA_MODELS="E:\Smart Automation\AI\Models\Ollama"
  Start-Process -FilePath "ollama" -ArgumentList "serve" -WindowStyle Hidden
  ```

### Symptom: `Model nemotron-3-nano not found locally`
- **Resolution**:
  ```powershell
  ollama pull nemotron-3-nano
  ollama pull gemma3:4b
  ollama pull qwen2.5-coder:1.5b
  ```

---

## 3. Air-Gap & Egress Monitoring Alerts

### Symptom: `EgressMonitorAssertionError: External connection attempt detected`
- **Cause**: A third-party package or background task attempted to resolve an external DNS address or connect to a public IP.
- **Resolution**:
  - Super AI enforces **absolute air-gap compliance**. Check the stack trace in the error log.
  - Ensure all vector databases, font files, and assets are hosted locally in `platform/web/` without CDN links.

---

## 4. UI Rendering or Stylesheet Glitches

### Symptom: Stale CSS or missing elements in browser
- **Resolution**:
  - Perform a hard refresh in your browser: `Ctrl + F5` or `Ctrl + Shift + R`.
  - Verify that `styles.css` is served with HTTP status `200` via `http://127.0.0.1:8300/styles.css`.

---

## 5. Automated Health Check

Run the built-in system preflight to verify all 101 agents, models, and network bindings:
```powershell
node scripts/sih/demo-preflight.js
```
Expected output:
```
======================================================
SUPER AI PREFLIGHT DIAGNOSTICS: ALL CHECKS PASSED
Gateway: ONLINE (Port 8300)
Ollama: ONLINE (Port 11434)
Models: 3 Local Engines Active
Workforce: 101/101 Agents Ready
Sovereignty: 100% Air-Gapped (0 External Calls)
======================================================
```
