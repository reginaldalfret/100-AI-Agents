# 101 Super AI Agents — Windows Local Stack Installer & Auto-Start Task Registrar
$ErrorActionPreference = "Continue"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Resolve-Path (Join-Path $ScriptDir "../..")
Set-Location $ProjectRoot

$TaskName = "101-Super-AI-Agents-Local-Stack"
$ScriptPath = Join-Path $ProjectRoot "scripts\start-production.ps1"
$PowerShellExe = (Get-Command powershell.exe).Source

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  101 SUPER AI AGENTS — WINDOWS LIFECYCLE INSTALLER" -ForegroundColor White
Write-Host "  Problem Statement: SIH 26117 — Mangalore Refinery (MRPL)" -ForegroundColor Gray
Write-Host "============================================================" -ForegroundColor Cyan

# 1. Ensure runtime directories exist
$runtimeDirs = @("runtime\logs", "runtime\service-state", "runtime\pids")
foreach ($d in $runtimeDirs) {
    $fullPath = Join-Path $ProjectRoot $d
    if (-not (Test-Path $fullPath)) {
        New-Item -ItemType Directory -Path $fullPath -Force | Out-Null
    }
}
Write-Host "[1/4] Initialized runtime directories." -ForegroundColor Green

# 2. Validate Executables
Write-Host "[2/4] Validating local runtime executables..." -ForegroundColor Cyan
$nodeExe = (Get-Command node -ErrorAction SilentlyContinue).Source
Write-Host "  Node.js : $nodeExe" -ForegroundColor Gray

$pythonPaths = @(
    "C:\Users\ASUS\AppData\Local\Programs\Python\Python312\python.exe",
    (Get-Command python -ErrorAction SilentlyContinue).Source
)
$pythonExe = $null
foreach ($p in $pythonPaths) {
    if ($p -and (Test-Path $p)) { $pythonExe = $p; break }
}
Write-Host "  Python  : $pythonExe" -ForegroundColor Gray

$ollamaExe = "C:\Users\ASUS\AppData\Local\Programs\Ollama\ollama.exe"
Write-Host "  Ollama  : $ollamaExe" -ForegroundColor Gray

# 3. Unregister duplicate/legacy tasks
Write-Host "[3/4] Cleaning up legacy task registrations..." -ForegroundColor Cyan
$legacyTasks = @("SA-S03-Educational-Platform", "101-Super-AI-Agents", "SuperAIAgents")
foreach ($t in $legacyTasks) {
    Unregister-ScheduledTask -TaskName $t -Confirm:$false -ErrorAction SilentlyContinue | Out-Null
}
Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue | Out-Null

# 4. Register Authoritative Scheduled Task
Write-Host "[4/4] Registering Authoritative Task: $TaskName..." -ForegroundColor Cyan
$Action = New-ScheduledTaskAction -Execute $PowerShellExe -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$ScriptPath`"" -WorkingDirectory $ProjectRoot
$Trigger = New-ScheduledTaskTrigger -AtLogOn
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -RestartCount 5 -RestartInterval (New-TimeSpan -Minutes 1) -ExecutionTimeLimit (New-TimeSpan -Days 365) -Priority 4

Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Settings $Settings -Description "Auto-starts 101 Super AI Agents local stack (Ollama, Python Compute, Node Gateway) on Windows startup with automatic crash recovery." | Out-Null

$task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($task) {
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host "SUCCESS: 101 Super AI Agents Local Stack Auto-Start is Active!" -ForegroundColor Green
    Write-Host "Task Name   : $($task.TaskName)" -ForegroundColor Cyan
    Write-Host "Task State  : $($task.State)" -ForegroundColor Yellow
    Write-Host "Startup URI : http://127.0.0.1:8300/" -ForegroundColor White
    Write-Host "============================================================" -ForegroundColor Green
} else {
    Write-Host "WARNING: Scheduled Task registration did not complete. Please run as Administrator." -ForegroundColor Yellow
}
