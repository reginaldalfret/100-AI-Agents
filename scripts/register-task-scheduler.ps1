<#
.SYNOPSIS
  301 Super AI Agents — Windows Task Scheduler Registration
  Registers/updates a scheduled task that launches the Node.js supervisor
  directly (no PowerShell wrapper at runtime). The task runs at user logon
  and restarts automatically on failure.

.DESCRIPTION
  This script replaces the old PowerShell-based auto-startup chain:
    Task Scheduler → start-production.ps1 → supervisor.js

  With a direct chain:
    Task Scheduler → node.exe scripts/supervisor.js

  The supervisor.js is now self-contained and sets its own environment
  variables (OLLAMA_MODELS, PROJECT_ROOT, etc.) internally.

.PARAMETER Unregister
  If specified, removes the scheduled task instead of creating it.

.EXAMPLE
  # Register the task (run as current user):
  powershell -ExecutionPolicy Bypass -File scripts\register-task-scheduler.ps1

  # Remove the task:
  powershell -ExecutionPolicy Bypass -File scripts\register-task-scheduler.ps1 -Unregister
#>

param(
    [switch]$Unregister
)

$ErrorActionPreference = "Stop"

# ── Constants ──────────────────────────────────────────────────
$TaskName        = "301-SuperAI-Supervisor"
$TaskDescription = "301 Super AI Agents - Sovereign AI Workbench Supervisor. Manages Ollama (11434), Gateway (8300), and Python Compute (8305) as a single self-healing local stack. 100% air-gapped, zero external network calls."

$ScriptDir   = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Path }
$ProjectRoot = (Resolve-Path (Join-Path $ScriptDir "..")).Path
$SupervisorScript = Join-Path (Join-Path $ProjectRoot "scripts") "supervisor.js"

# ── Locate node.exe ────────────────────────────────────────────
$NodeExe = $null
try   { $NodeExe = (Get-Command node -ErrorAction Stop).Source }
catch {}

if (-not $NodeExe) {
    # Fallback: common install locations
    $candidates = @(
        "$env:ProgramFiles\nodejs\node.exe",
        "${env:ProgramFiles(x86)}\nodejs\node.exe",
        "$env:LOCALAPPDATA\Programs\nodejs\node.exe",
        "$env:APPDATA\nvm\current\node.exe"
    )
    foreach ($c in $candidates) {
        if (Test-Path $c) { $NodeExe = $c; break }
    }
}

if (-not $NodeExe -or -not (Test-Path $NodeExe)) {
    Write-Host "ERROR: node.exe not found. Install Node.js and ensure it is in PATH." -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $SupervisorScript)) {
    Write-Host "ERROR: supervisor.js not found at $SupervisorScript" -ForegroundColor Red
    exit 1
}

# ── Unregister mode ────────────────────────────────────────────
if ($Unregister) {
    Write-Host "Removing scheduled task: $TaskName ..." -ForegroundColor Yellow
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue

    # Also clean up the old PowerShell-based task if it exists
    Unregister-ScheduledTask -TaskName "SA-S03-Educational-Platform" -Confirm:$false -ErrorAction SilentlyContinue

    $check = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
    if (-not $check) {
        Write-Host "SUCCESS: Task '$TaskName' removed." -ForegroundColor Green
    } else {
        Write-Host "WARNING: Task may still exist." -ForegroundColor Yellow
    }
    exit 0
}

# ── Register ───────────────────────────────────────────────────
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  301 SUPER AI AGENTS — TASK SCHEDULER REGISTRATION"         -ForegroundColor White
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Task Name    : $TaskName"                                   -ForegroundColor Gray
Write-Host "  Node.exe     : $NodeExe"                                    -ForegroundColor Gray
Write-Host "  Supervisor   : $SupervisorScript"                           -ForegroundColor Gray
Write-Host "  Working Dir  : $ProjectRoot"                                -ForegroundColor Gray
Write-Host ""

# Remove any previous versions of the task
Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
Unregister-ScheduledTask -TaskName "SA-S03-Educational-Platform" -Confirm:$false -ErrorAction SilentlyContinue

# ── Action: node.exe scripts/supervisor.js ─────────────────────
$Action = New-ScheduledTaskAction `
    -Execute $NodeExe `
    -Argument "`"$SupervisorScript`"" `
    -WorkingDirectory $ProjectRoot

# ── Trigger: At logon of the current user ──────────────────────
$Trigger = New-ScheduledTaskTrigger -AtLogOn

# ── Settings ───────────────────────────────────────────────────
$Settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -DontStopOnIdleEnd `
    -RestartCount 5 `
    -RestartInterval (New-TimeSpan -Minutes 1) `
    -ExecutionTimeLimit (New-TimeSpan -Days 365) `
    -Priority 4 `
    -StartWhenAvailable `
    -MultipleInstances IgnoreNew

# ── Register the task ──────────────────────────────────────────
Register-ScheduledTask `
    -TaskName $TaskName `
    -Action $Action `
    -Trigger $Trigger `
    -Settings $Settings `
    -Description $TaskDescription `
    | Out-Null

# ── Verify ─────────────────────────────────────────────────────
$task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($task) {
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host "  SUCCESS: SCHEDULED TASK REGISTERED"                          -ForegroundColor Green
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Task Name  : $($task.TaskName)"                              -ForegroundColor Cyan
    Write-Host "  Task State : $($task.State)"                                 -ForegroundColor Yellow
    Write-Host "  Trigger    : At Logon"                                       -ForegroundColor Gray
    Write-Host "  Action     : $NodeExe `"$SupervisorScript`""                 -ForegroundColor Gray
    Write-Host "  Restart    : Up to 5 retries, 1 min interval"                -ForegroundColor Gray
    Write-Host "  Idle       : Never stop on idle"                             -ForegroundColor Gray
    Write-Host "  Battery    : Run on battery"                                 -ForegroundColor Gray
    Write-Host ""
    Write-Host "  To start now   : Start-ScheduledTask -TaskName '$TaskName'"  -ForegroundColor DarkGray
    Write-Host "  To stop        : Stop-ScheduledTask  -TaskName '$TaskName'"  -ForegroundColor DarkGray
    Write-Host "  To unregister  : .\scripts\register-task-scheduler.ps1 -Unregister" -ForegroundColor DarkGray
    Write-Host ""
} else {
    Write-Host "FAILED: Could not register the scheduled task." -ForegroundColor Red
    Write-Host "Try running this script as Administrator." -ForegroundColor Yellow
    exit 1
}
