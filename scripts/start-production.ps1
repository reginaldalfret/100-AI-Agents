# SA-S03 Educational Platform Production Launcher
$ErrorActionPreference = "Continue"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Resolve-Path (Join-Path $ScriptDir "..")
Set-Location $ProjectRoot

$env:PROJECT_ROOT = $ProjectRoot
$env:PORT = "8300"
$env:HOST = "0.0.0.0"
$env:NODE_ENV = "production"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  SA-S03 Educational Intelligent Workflow Management Platform" -ForegroundColor White
Write-Host "  Windows Production Daemon" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan

# 1. Verify Ollama
Write-Host "[1/3] Ensuring local Ollama service is running on 11434..." -ForegroundColor Cyan
$ollamaRunning = $false
try {
    $res = Invoke-RestMethod -Uri "http://127.0.0.1:11434/api/tags" -Method Get -TimeoutSec 3 -ErrorAction SilentlyContinue
    if ($res) { $ollamaRunning = $true }
} catch {}

if (-not $ollamaRunning) {
    Write-Host "Spawning Ollama daemon..." -ForegroundColor Yellow
    $ollamaExe = "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe"
    if (Test-Path $ollamaExe) {
        Start-Process -FilePath $ollamaExe -ArgumentList "serve" -WindowStyle Hidden
        Start-Sleep -Seconds 4
    }
}

# 2. Verify Cloudflared
Write-Host "[2/3] Ensuring Cloudflared tunnel service is active..." -ForegroundColor Cyan
try {
    Start-Service -Name "Cloudflared" -ErrorAction SilentlyContinue
} catch {}

# 3. Launch Supervisor
Write-Host "[3/3] Starting SA-S03 Supervisor..." -ForegroundColor Green
$nodeExe = (Get-Command node).Source
& $nodeExe "scripts/supervisor.js"
