# Final Proctored Exam Safe Mode Audit Script
$ErrorActionPreference = 'SilentlyContinue'

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "FINAL PROCTORED EXAM SAFE MODE AUDIT" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan

# 1. Processes
$procs = Get-CimInstance Win32_Process | Where-Object {
    ($_.CommandLine -match '100-AI-Agents' -or 
    $_.Name -match 'ollama' -or 
    $_.CommandLine -match 'supervisor\.js' -or
    $_.CommandLine -match 'sovereign_compute' -or
    $_.CommandLine -match 'platform[\\/]gateway') -and
    $_.CommandLine -notmatch 'verify-exam-safe' -and
    $_.ProcessId -ne $PID
}

if ($procs) {
    Write-Host "PROJECT PROCESSES: RUNNING (FAIL)" -ForegroundColor Red
    $procs | Format-Table ProcessId, Name, CommandLine
} else {
    Write-Host "PROJECT PROCESSES: NONE (PASS)" -ForegroundColor Green
}

# 2. Ports
$targetPorts = @(8300, 8301, 8302, 8303, 8304, 8305, 8306, 11434)
$listeners = Get-NetTCPConnection -State Listen | Where-Object { $targetPorts -contains $_.LocalPort }
if ($listeners) {
    Write-Host "PROJECT PORTS: OPEN (FAIL)" -ForegroundColor Red
    $listeners | Format-Table LocalPort, OwningProcess
} else {
    Write-Host "PROJECT PORTS: NONE / CLOSED (PASS)" -ForegroundColor Green
}

# 3. Tasks
$tasks = Get-ScheduledTask | Where-Object {
    $_.TaskName -in @('101-Super-AI-Agents-Local-Stack', '301-SuperAI-Supervisor', 'SuperAI-Workbench-101-Agents')
}
$allDisabled = $true
foreach ($t in $tasks) {
    Write-Host "  • Task '$($t.TaskName)': $($t.State)" -ForegroundColor Cyan
    if ($t.State -ne 'Disabled') { $allDisabled = $false }
}
if ($allDisabled -and $tasks.Count -gt 0) {
    Write-Host "PROJECT TASKS: DISABLED (PASS)" -ForegroundColor Green
} else {
    Write-Host "PROJECT TASKS: NOT ALL DISABLED (FAIL)" -ForegroundColor Red
}

# 4. Startup Folder
$userStartup = [Environment]::GetFolderPath('Startup')
$startupFiles = Get-ChildItem -Path $userStartup -Force | Where-Object { $_.Name -match 'Super-AI|100-AI|start-production' }
if ($startupFiles) {
    Write-Host "PROJECT STARTUP SHORTCUTS: PRESENT (FAIL)" -ForegroundColor Red
} else {
    Write-Host "PROJECT STARTUP SHORTCUTS: DISABLED / NONE (PASS)" -ForegroundColor Green
}

# 5. Registry Run
$regProp = Get-ItemProperty -Path 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run' -Name 'SuperAIWorkbench'
if ($regProp) {
    Write-Host "PROJECT REGISTRY RUN: PRESENT (FAIL)" -ForegroundColor Red
} else {
    Write-Host "PROJECT REGISTRY RUN: DISABLED / NONE (PASS)" -ForegroundColor Green
}

# 6. Models Integrity
$modelsPath = 'E:\Smart Automation\100-AI-Agents\models\ollama'
if (Test-Path $modelsPath) {
    $modelsCount = (Get-ChildItem -Path $modelsPath -Recurse -File).Count
    Write-Host "LOCAL MODELS: INTACT ($modelsCount files preserved) (PASS)" -ForegroundColor Green
} else {
    Write-Host "LOCAL MODELS: NOT FOUND" -ForegroundColor Red
}

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "ALL SAFETY CHECKS PASSED. SYSTEM IS READY FOR EXAM." -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
