# 301 Super AI — Post-Exam Restoration Instructions

This guide explains how to restore the **301 Super AI** background supervisor, auto-start tasks, and services after your proctored exam is complete.

---

## Quick One-Command Restoration

Open **PowerShell** (as regular user or administrator) and run:

```powershell
powershell -ExecutionPolicy Bypass -File "E:\Smart Automation\100-AI-Agents\exam-safety-backup\restore-after-exam.ps1"
```

1. The script will display all previously disabled items.
2. It will ask: `RESTORE 301 SUPER AI STARTUP? [Y/N] (Default: N)`
3. Type **`Y`** and press **Enter**.

---

## What the Restoration Script Does

1. **Re-enables Scheduled Tasks**:
   - `101-Super-AI-Agents-Local-Stack` (Task Scheduler)
   - `301-SuperAI-Supervisor` (Task Scheduler)
   - `SuperAI-Workbench-101-Agents` (Task Scheduler)
2. **Restores Startup Shortcuts**:
   - Moves `Start-101-Super-AI-Agents.vbs` from `exam-safety-backup/startup-disabled/` back to `shell:startup`.
3. **Restores Registry Startup Entry**:
   - Re-creates `SuperAIWorkbench` under `HKCU:\Software\Microsoft\Windows\CurrentVersion\Run`.
4. **Starts Local Services**:
   - Once restored, the services will resume auto-starting on logon, or you can start them immediately with:
     ```powershell
     powershell -ExecutionPolicy Bypass -File "E:\Smart Automation\100-AI-Agents\scripts\windows\start-local-stack.ps1"
     ```

---

## Manual Restoration (Alternative)

If you prefer to restore items manually without the script:

### 1. Enable Scheduled Tasks
```powershell
Enable-ScheduledTask -TaskName "101-Super-AI-Agents-Local-Stack"
Enable-ScheduledTask -TaskName "301-SuperAI-Supervisor"
Enable-ScheduledTask -TaskName "SuperAI-Workbench-101-Agents"
```

### 2. Restore Startup Shortcut
Copy `E:\Smart Automation\100-AI-Agents\exam-safety-backup\startup-disabled\Start-101-Super-AI-Agents.vbs` into:
`C:\Users\ASUS\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\`

### 3. Restore Registry Run Value
```powershell
Set-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run" -Name "SuperAIWorkbench" -Value '"C:\Windows\system32\wscript.exe" "E:\Smart Automation\100-AI-Agents\scripts\run-silent-background.vbs"' -Type String
```
