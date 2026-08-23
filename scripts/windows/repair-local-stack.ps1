# Diagnoses and repairs stale PID locks and port conflicts
$ErrorActionPreference = "Continue"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Resolve-Path (Join-Path $ScriptDir "../..")

Write-Host "Diagnosing and repairing 101 Super AI Agents local stack..." -ForegroundColor Cyan

# 1. Clean stale PID files
$pidDir = Join-Path $ProjectRoot "runtime\pids"
if (Test-Path $pidDir) {
    Get-ChildItem -Path $pidDir -Filter "*.pid" | Remove-Item -Force -ErrorAction SilentlyContinue
    Write-Host "Cleaned stale PID locks." -ForegroundColor Green
}

# 2. Test Ollama
$ollamaOk = $false
try {
    $res = Invoke-RestMethod -Uri "http://127.0.0.1:11434/api/tags" -Method Get -TimeoutSec 3
    if ($res) { $ollamaOk = $true }
} catch {}

if (-not $ollamaOk) {
    Write-Host "Restarting Ollama service..." -ForegroundColor Yellow
    $ollamaExe = "C:\Users\ASUS\AppData\Local\Programs\Ollama\ollama.exe"
    if (Test-Path $ollamaExe) {
        Start-Process -FilePath $ollamaExe -ArgumentList "serve" -WindowStyle Hidden
        Start-Sleep -Seconds 3
    }
}

# 3. Re-register Scheduled Task
& (Join-Path $ScriptDir "install-local-stack.ps1")

Write-Host "Repair sequence completed." -ForegroundColor Green
