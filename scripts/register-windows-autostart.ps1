# Registers the SA-S03 Educational Platform Windows Auto-Start Scheduled Task
$ErrorActionPreference = "SilentlyContinue"

$TaskName = "SA-S03-Educational-Platform"
$ScriptPath = "E:\Smart Automation\100-AI-Agents\scripts\start-production.ps1"
$PowerShellExe = (Get-Command powershell.exe).Source

Write-Host "Registering Windows Auto-Start Scheduled Task: $TaskName..." -ForegroundColor Cyan

# Unregister if already exists
Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue

$Action = New-ScheduledTaskAction -Execute $PowerShellExe -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$ScriptPath`"" -WorkingDirectory "E:\Smart Automation\100-AI-Agents"
$Trigger = New-ScheduledTaskTrigger -AtLogOn
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1) -ExecutionTimeLimit (New-TimeSpan -Days 365)

Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Settings $Settings -Description "Auto-starts the SA-S03 Educational Intelligent Workflow Management Platform and 100 AI Agents fleet on Windows startup." | Out-Null

$task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($task) {
    Write-Host "SUCCESS: Windows Auto-Start Scheduled Task registered successfully!" -ForegroundColor Green
    Write-Host "Task State: $($task.State)" -ForegroundColor Yellow
} else {
    Write-Host "Note: Scheduled Task registration requires standard Windows permissions." -ForegroundColor Yellow
}
