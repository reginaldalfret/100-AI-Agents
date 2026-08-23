# Starts all missing local stack services safely in order
$ErrorActionPreference = "Continue"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Resolve-Path (Join-Path $ScriptDir "../..")
Set-Location $ProjectRoot

Write-Host "[START] Launching 101 Super AI Agents Production Supervisor..." -ForegroundColor Cyan
& powershell -ExecutionPolicy Bypass -File (Join-Path $ProjectRoot "scripts\start-production.ps1")
