# Windows Local AI Stack Troubleshooting Guide

## 1. Checking Stack Status
Run from PowerShell:
```powershell
powershell -ExecutionPolicy Bypass -File scripts/windows/status-local-stack.ps1
```

## 2. Health Probes
```powershell
powershell -ExecutionPolicy Bypass -File scripts/windows/health-local-stack.ps1
```

## 3. Repairing Stack & Stale PIDs
```powershell
powershell -ExecutionPolicy Bypass -File scripts/windows/repair-local-stack.ps1
```
