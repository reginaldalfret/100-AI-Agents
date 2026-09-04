# ============================================================
# 301 SUPER AI — RESTORE AFTER EXAM SCRIPT
# ============================================================
# Restores only the items recorded in the backup manifests.
# ============================================================

$ErrorActionPreference = 'Continue'
$ScriptDir = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Path }
$backupDir = $ScriptDir
$ProjectRoot = (Resolve-Path (Join-Path $ScriptDir "..")).Path

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  301 SUPER AI — POST-EXAM RESTORATION WIZARD" -ForegroundColor White
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "These are the project startup items that were disabled:" -ForegroundColor Yellow
Write-Host ""

# 1. Read Task Manifest
$tasksFile = Join-Path $backupDir 'disabled-tasks.json'
$tasksToRestore = @()
if (Test-Path $tasksFile) {
    $tasksToRestore = Get-Content $tasksFile -Raw | ConvertFrom-Json
    Write-Host "[Scheduled Tasks to Re-Enable]" -ForegroundColor Cyan
    foreach ($t in $tasksToRestore) {
        Write-Host "  • Task Name : $($t.TaskName)" -ForegroundColor White
        Write-Host "    Action    : $(($t.Actions | ForEach-Object { $_.Execute + ' ' + $_.Arguments }) -join ' | ')" -ForegroundColor Gray
    }
}

# 2. Read Startup Folder Manifest
$startupFile = Join-Path $backupDir 'startup-items.json'
$startupToRestore = @()
if (Test-Path $startupFile) {
    $startupToRestore = Get-Content $startupFile -Raw | ConvertFrom-Json
    Write-Host "`n[Startup Folder Shortcuts to Restore]" -ForegroundColor Cyan
    foreach ($s in $startupToRestore) {
        Write-Host "  • Item Name : $($s.Name)" -ForegroundColor White
        Write-Host "    Original  : $($s.OriginalLocation)" -ForegroundColor Gray
    }
}

# 3. Read Registry Manifest
$regFile = Join-Path $backupDir 'registry-startup.json'
$regToRestore = @()
if (Test-Path $regFile) {
    $regToRestore = Get-Content $regFile -Raw | ConvertFrom-Json
    Write-Host "`n[Registry Startup Entries to Restore]" -ForegroundColor Cyan
    foreach ($r in $regToRestore) {
        Write-Host "  • Key       : $($r.Hive):\$($r.KeyPath)" -ForegroundColor White
        Write-Host "    Value Name: $($r.ValueName)" -ForegroundColor White
        Write-Host "    Data      : $($r.ValueData)" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan

# Interactive Safety Confirmation Prompt (Default: N)
$confirmation = Read-Host "RESTORE 301 SUPER AI STARTUP? [Y/N] (Default: N)"

if ($confirmation -notmatch '^[Yy]$') {
    Write-Host "`nRestoration aborted. No changes were made." -ForegroundColor Yellow
    Write-Host "301 Super AI remains in disabled safe state." -ForegroundColor Gray
    exit 0
}

Write-Host "`nProceeding with restoration..." -ForegroundColor Green

# 1. Restore Scheduled Tasks
if ($tasksToRestore) {
    Write-Host "`nRe-enabling Scheduled Tasks..." -ForegroundColor Cyan
    foreach ($t in $tasksToRestore) {
        $taskObj = Get-ScheduledTask -TaskName $t.TaskName -ErrorAction SilentlyContinue
        if ($taskObj) {
            Enable-ScheduledTask -TaskName $t.TaskName -ErrorAction SilentlyContinue | Out-Null
            $updated = Get-ScheduledTask -TaskName $t.TaskName -ErrorAction SilentlyContinue
            Write-Host "  [OK] Task '$($t.TaskName)' state: $($updated.State)" -ForegroundColor Green
        } else {
            Write-Host "  [WARN] Task '$($t.TaskName)' not found in Task Scheduler." -ForegroundColor Yellow
        }
    }
}

# 2. Restore Startup Folder Items
if ($startupToRestore) {
    Write-Host "`nRestoring Startup Folder Shortcuts..." -ForegroundColor Cyan
    $disabledFolder = Join-Path $backupDir 'startup-disabled'
    foreach ($s in $startupToRestore) {
        $sourceFile = Join-Path $disabledFolder $s.Name
        if (Test-Path $sourceFile) {
            $destPath = $s.OriginalLocation
            $destDir = Split-Path -Parent $destPath
            if (-not (Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir -Force | Out-Null }
            Move-Item -Path $sourceFile -Destination $destPath -Force
            Write-Host "  [OK] Restored '$($s.Name)' -> $destPath" -ForegroundColor Green
        } elseif (-not (Test-Path $s.OriginalLocation) -and $s.Content) {
            # Recreate from content backup if source was missing
            $s.Content | Set-Content $s.OriginalLocation -Encoding utf8
            Write-Host "  [OK] Recreated '$($s.Name)' from backup manifest" -ForegroundColor Green
        }
    }
}

# 3. Restore Registry Startup Entries
if ($regToRestore) {
    Write-Host "`nRestoring Registry Startup Entries..." -ForegroundColor Cyan
    foreach ($r in $regToRestore) {
        $fullPath = "$($r.Hive):\$($r.KeyPath)"
        if (-not (Test-Path $fullPath)) { New-Item -Path $fullPath -Force | Out-Null }
        Set-ItemProperty -Path $fullPath -Name $r.ValueName -Value $r.ValueData -Type $r.ValueType
        Write-Host "  [OK] Restored Registry Value '$($r.ValueName)' under $fullPath" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "  RESTORATION COMPLETE!" -ForegroundColor Green
Write-Host "  301 Super AI auto-start mechanisms have been restored." -ForegroundColor White
Write-Host "  You can start the local stack anytime by running:" -ForegroundColor Gray
Write-Host "  powershell -ExecutionPolicy Bypass -File scripts\windows\start-local-stack.ps1" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Green
