# 301 Super AI - Proctored Exam Safe Mode Shutdown & Backup Script
$ErrorActionPreference = 'Continue'

$backupDir = 'E:\Smart Automation\100-AI-Agents\exam-safety-backup'
$disabledStartupDir = Join-Path $backupDir 'startup-disabled'

if (-not (Test-Path $backupDir)) { New-Item -ItemType Directory -Path $backupDir -Force | Out-Null }
if (-not (Test-Path $disabledStartupDir)) { New-Item -ItemType Directory -Path $disabledStartupDir -Force | Out-Null }

$timestamp = (Get-Date).ToString('yyyy-MM-ddTHH:mm:sszzz')

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "STEP 1: CREATING BACKUP MANIFESTS" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan

# 1. Capture and save Tasks
$tasksToDisable = @(
    '101-Super-AI-Agents-Local-Stack',
    '301-SuperAI-Supervisor',
    'SuperAI-Workbench-101-Agents'
)

$taskBackup = @()
foreach ($tName in $tasksToDisable) {
    $t = Get-ScheduledTask -TaskName $tName -ErrorAction SilentlyContinue
    if ($t) {
        $taskBackup += [PSCustomObject]@{
            TaskName       = $t.TaskName
            TaskPath       = $t.TaskPath
            PreviousState  = $t.State.ToString()
            Actions        = ($t.Actions | ForEach-Object { [PSCustomObject]@{ Execute = $_.Execute; Arguments = $_.Arguments; WorkingDirectory = $_.WorkingDirectory } })
            Triggers       = ($t.Triggers | ForEach-Object { $_.ToString() })
            Settings       = [PSCustomObject]@{
                AllowStartIfOnBatteries = $t.Settings.AllowStartIfOnBatteries
                RestartCount            = $t.Settings.RestartCount
            }
            Timestamp      = $timestamp
        }
    }
}
$taskBackup | ConvertTo-Json -Depth 5 | Set-Content (Join-Path $backupDir 'disabled-tasks.json') -Encoding utf8
Write-Host "Backed up scheduled tasks to disabled-tasks.json" -ForegroundColor Green

# 2. Capture and save Startup Items
$userStartup = [Environment]::GetFolderPath('Startup')
$startupFile = Join-Path $userStartup 'Start-101-Super-AI-Agents.vbs'
$startupBackup = @()
if (Test-Path $startupFile) {
    $item = Get-Item $startupFile
    $startupBackup += [PSCustomObject]@{
        Name             = $item.Name
        OriginalLocation = $item.FullName
        Length           = $item.Length
        Content          = (Get-Content $item.FullName -Raw)
        Timestamp        = $timestamp
    }
}
$startupBackup | ConvertTo-Json -Depth 5 | Set-Content (Join-Path $backupDir 'startup-items.json') -Encoding utf8
Write-Host "Backed up startup items to startup-items.json" -ForegroundColor Green

# 3. Capture and save Registry Startup Items
$regBackup = @()
$regPath = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run'
$prop = Get-ItemProperty -Path $regPath -Name 'SuperAIWorkbench' -ErrorAction SilentlyContinue
if ($prop) {
    $regBackup += [PSCustomObject]@{
        Hive             = 'HKCU'
        KeyPath          = 'Software\Microsoft\Windows\CurrentVersion\Run'
        ValueName        = 'SuperAIWorkbench'
        ValueData        = $prop.SuperAIWorkbench
        ValueType        = 'String'
        Timestamp        = $timestamp
    }
}
$regBackup | ConvertTo-Json -Depth 5 | Set-Content (Join-Path $backupDir 'registry-startup.json') -Encoding utf8
Write-Host "Backed up registry startup entries to registry-startup.json" -ForegroundColor Green

# 4. Capture Running Processes Before Shutdown
$allProcesses = Get-CimInstance Win32_Process
$projectProcesses = $allProcesses | Where-Object {
    $_.CommandLine -match '100-AI-Agents' -or 
    $_.Name -match 'ollama' -or 
    $_.CommandLine -match 'supervisor\.js' -or
    $_.CommandLine -match 'sovereign_compute' -or
    $_.CommandLine -match 'platform[\\/]gateway'
}

$procBackup = @()
foreach ($proc in $projectProcesses) {
    $procBackup += [PSCustomObject]@{
        ProcessId       = $proc.ProcessId
        ParentProcessId = $proc.ParentProcessId
        Name            = $proc.Name
        CommandLine     = $proc.CommandLine
        Timestamp       = $timestamp
    }
}
$procBackup | ConvertTo-Json -Depth 5 | Set-Content (Join-Path $backupDir 'processes-before.json') -Encoding utf8
Write-Host "Backed up running processes snapshot to processes-before.json" -ForegroundColor Green

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "STEP 2: DISABLING TASK SCHEDULER TASKS" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan

foreach ($tName in $tasksToDisable) {
    $t = Get-ScheduledTask -TaskName $tName -ErrorAction SilentlyContinue
    if ($t) {
        Disable-ScheduledTask -TaskName $tName -ErrorAction SilentlyContinue | Out-Null
        $updated = Get-ScheduledTask -TaskName $tName -ErrorAction SilentlyContinue
        Write-Host "Task '$tName': State is now $($updated.State)" -ForegroundColor Green
    }
}

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "STEP 3: MOVING STARTUP FOLDER SHORTCUTS" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan

if (Test-Path $startupFile) {
    $destFile = Join-Path $disabledStartupDir 'Start-101-Super-AI-Agents.vbs'
    Move-Item -Path $startupFile -Destination $destFile -Force
    Write-Host "Moved 'Start-101-Super-AI-Agents.vbs' -> $destFile" -ForegroundColor Green
} else {
    Write-Host "No startup folder shortcuts present to move." -ForegroundColor Gray
}

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "STEP 4: DISABLING REGISTRY RUN ENTRY" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan

if ($prop) {
    Remove-ItemProperty -Path $regPath -Name 'SuperAIWorkbench' -ErrorAction SilentlyContinue
    Write-Host "Removed HKCU:\Software\Microsoft\Windows\CurrentVersion\Run -> SuperAIWorkbench" -ForegroundColor Green
} else {
    Write-Host "No project registry run entry present." -ForegroundColor Gray
}

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "STEP 5: TERMINATING CONFIRMED PROJECT PROCESSES" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan

# Re-query all project processes to ensure exact PIDs
$currentProjectProcs = Get-CimInstance Win32_Process | Where-Object {
    $_.CommandLine -match '100-AI-Agents' -or 
    $_.Name -match 'ollama' -or 
    $_.CommandLine -match 'supervisor\.js' -or
    $_.CommandLine -match 'sovereign_compute' -or
    $_.CommandLine -match 'platform[\\/]gateway'
}

foreach ($proc in $currentProjectProcs) {
    # Extra safety check: verify PID is not current PowerShell session or System
    if ($proc.ProcessId -ne $PID -and $proc.ProcessId -gt 4) {
        Write-Host "Stopping verified project process: PID $($proc.ProcessId) - $($proc.Name)" -ForegroundColor Yellow
        try {
            Stop-Process -Id $proc.ProcessId -Force -ErrorAction SilentlyContinue
        } catch {}
    }
}

Start-Sleep -Seconds 2

# Clean up supervisor PID lockfile so supervisor is ready for clean boot when restored
$pidFile = 'E:\Smart Automation\100-AI-Agents\runtime\pids\supervisor.pid'
if (Test-Path $pidFile) {
    Remove-Item -Path $pidFile -Force -ErrorAction SilentlyContinue
}

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "STEP 6: VERIFYING CLEAN STATE" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan

$remainingProcs = Get-CimInstance Win32_Process | Where-Object {
    $_.CommandLine -match '100-AI-Agents' -or 
    $_.Name -match 'ollama' -or 
    $_.CommandLine -match 'supervisor\.js' -or
    $_.CommandLine -match 'sovereign_compute' -or
    $_.CommandLine -match 'platform[\\/]gateway'
} | Where-Object { $_.ProcessId -ne $PID }

if ($remainingProcs) {
    Write-Host "WARNING: Remaining project processes:" -ForegroundColor Red
    $remainingProcs | Select-Object ProcessId, Name, CommandLine | Format-Table -AutoSize
} else {
    Write-Host "CONFIRMED: 0 project processes running." -ForegroundColor Green
}

$targetPorts = @(8300, 8301, 8302, 8303, 8304, 8305, 8306, 11434)
$remainingListeners = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $targetPorts -contains $_.LocalPort }

if ($remainingListeners) {
    Write-Host "WARNING: Ports still listening:" -ForegroundColor Red
    $remainingListeners | Select-Object LocalPort, OwningProcess | Format-Table -AutoSize
} else {
    Write-Host "CONFIRMED: All project ports (8300, 8305, 11434, etc.) are CLOSED." -ForegroundColor Green
}

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "STEP 7: VERIFYING SCHEDULED TASKS" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan

foreach ($tName in $tasksToDisable) {
    $t = Get-ScheduledTask -TaskName $tName -ErrorAction SilentlyContinue
    if ($t) {
        Write-Host "Task '$tName' State: $($t.State)" -ForegroundColor Cyan
    }
}

Write-Host "`n============================================================" -ForegroundColor Green
Write-Host "EXAM SAFE MODE SHUTDOWN COMPLETE" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
