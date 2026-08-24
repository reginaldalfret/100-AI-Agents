<#
.SYNOPSIS
  Repairs and resets failed local stack states cleanly.
#>
$ErrorActionPreference = 'Continue'
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Resolve-Path (Join-Path $ScriptDir '../..')
Set-Location $ProjectRoot

Write-Host '[REPAIR] Resetting local stack state files...' -ForegroundColor Cyan
$stateDir = Join-Path $ProjectRoot 'runtime/service-state'
if (Test-Path $stateDir) {
    Remove-Item -Path "$stateDir\*.json" -Force -ErrorAction SilentlyContinue
}

Write-Host '[REPAIR] Checking and restarting supervisor...' -ForegroundColor Cyan
& powershell -ExecutionPolicy Bypass -File (Join-Path $winDir 'restart-local-stack.ps1')
