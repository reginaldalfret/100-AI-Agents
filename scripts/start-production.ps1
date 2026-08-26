# 301 Super AI Agents — Sovereign Local Stack Production Launcher
$ErrorActionPreference = "Continue"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = (Resolve-Path (Join-Path $ScriptDir "..")).Path
Set-Location $ProjectRoot

$env:PROJECT_ROOT = $ProjectRoot
$env:PORT = "8300"
$env:HOST = "0.0.0.0"
$env:NODE_ENV = "production"
$env:OLLAMA_MODELS = "E:\Smart Automation\100-AI-Agents\models\ollama"
$env:HF_HOME = "E:\Smart Automation\100-AI-Agents\cache\huggingface"
$env:HUGGINGFACE_HUB_CACHE = "E:\Smart Automation\100-AI-Agents\cache\huggingface"
$env:TRANSFORMERS_CACHE = "E:\Smart Automation\100-AI-Agents\cache\huggingface"
$env:TEMP_PROJECT_DIR = "E:\Smart Automation\100-AI-Agents\temp"
$env:LOG_DIR = "E:\Smart Automation\100-AI-Agents\logs"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  301 SUPER AI AGENTS - SOVEREIGN AI WORKBENCH" -ForegroundColor White
Write-Host "  Problem Statement: SIH 26117 - Mangalore Refinery (MRPL)" -ForegroundColor Gray
Write-Host "  Windows Production Daemon" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan

# 1. Verify Ollama
Write-Host "[1/2] Ensuring local Ollama service is running on 11434..." -ForegroundColor Cyan
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
        Start-Sleep -Seconds 3
    }
}

# 2. Launch Local Stack Supervisor
Write-Host "[2/2] Starting 301 Super AI Agents Supervisor..." -ForegroundColor Green
$nodeExe = (Get-Command node).Source
& $nodeExe "scripts/supervisor.js"
