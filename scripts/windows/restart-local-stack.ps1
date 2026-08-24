<#
.SYNOPSIS
  Restarts local stack services cleanly.
#>
$ErrorActionPreference = 'Continue'
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Resolve-Path (Join-Path $ScriptDir '../..')
Set-Location $ProjectRoot

Write-Host '[RESTART] Stopping local stack services...' -ForegroundColor Yellow
& powershell -ExecutionPolicy Bypass -File (Join-Path $winDir 'stop-local-stack.ps1')
Start-Sleep -Seconds 2

Write-Host '[RESTART] Starting local stack services...' -ForegroundColor Green
& powershell -ExecutionPolicy Bypass -File (Join-Path $winDir 'start-local-stack.ps1')
