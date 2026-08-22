# OBSOLETE PORT & STARTUP CLEANUP PLAN

**Project:** Sovereign AI Workbench (`E:\Smart Automation\100-AI-Agents`)  
**Audit Timestamp:** 2026-08-22  

---

## 1. Port Release Candidates

### Candidate 1: Port 8000 (PID 8636)
- **Port:** `8000`
- **Owning PID:** `8636`
- **Process:** `php.exe`
- **Project Location:** `E:\DG - Price List`
- **Command Line:** `"C:\Users\ASUS\AppData\Local\Microsoft\WinGet\Packages\PHP.PHP.8.4_Microsoft.Winget.Source_8wekyb3d8bbwe\php.exe" -S 127.0.0.1:8000 -t "E:\DG - Price List" "E:\DG - Price List\router.php"`
- **Why Obsolete:** Stale dev server started by an obsolete startup batch file (`DailyGurusERP-start.bat`). Holds port 8000 and wastes ~20 MB RAM.
- **Startup Source:** `C:\Users\ASUS\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\DailyGurusERP-start.bat`
- **Safe to Stop:** YES (Stop process PID 8636)
- **Safe to Disable/Remove Startup:** YES (Remove `DailyGurusERP-start.bat`)
- **Safe to Remove Source:** NO (Preserve source on `E:\DG - Price List`)

---

## 2. Scheduled Task Release Candidates

### Candidate 1: `BankFraudDetection_CloudflareTunnel`
- **Task Name:** `BankFraudDetection_CloudflareTunnel`
- **Task Path:** `\`
- **Target Action:** `powershell.exe -ExecutionPolicy Bypass -NoProfile -WindowStyle Hidden -File "E:\Fraud-Detection-System-using-Machine-Learning\start_tunnel.ps1"`
- **Why Obsolete:** Target script `E:\Fraud-Detection-System-using-Machine-Learning\start_tunnel.ps1` does not exist on disk. Cloudflare tunnel ingress is already centralized under the authoritative Windows Service `Cloudflared`.
- **Safe to Remove Task:** YES (`Unregister-ScheduledTask -TaskName "BankFraudDetection_CloudflareTunnel" -Confirm:$false`)

---

## 3. Retained Authoritative Infrastructure

| Component | Identifier | Purpose | Decision |
| :--- | :--- | :--- | :--- |
| **Sovereign Task** | `SA-S03-Educational-Platform` | Auto-starts Sovereign Gateway, Fleet, & Supervisor on Logon | **KEEP** |
| **Nemotron Task** | `NemotronLocalAIService` | Auto-starts Local Nemotron 4B CUDA Service on Logon | **KEEP** |
| **Cloudflare Service** | `Cloudflared` Windows Service | Edge Ingress for `smartauto.reginaldalfret.tech` $\rightarrow$ `127.0.0.1:8300` | **KEEP** |
| **Ollama Daemon** | `ollama.exe` (PID 19280) | Local Model Inference on `127.0.0.1:11434` | **KEEP** |
| **PostgreSQL 18** | `postgresql-x64-18` Service | Local Structured Database Engine | **KEEP** |
