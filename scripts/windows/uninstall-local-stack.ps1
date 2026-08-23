# Cleanly removes auto-start task without deleting any code, models, or data
$ErrorActionPreference = "Continue"
$TaskName = "101-Super-AI-Agents-Local-Stack"

Write-Host "Unregistering Scheduled Task: $TaskName..." -ForegroundColor Yellow
Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue | Out-Null
Write-Host "Scheduled task unregistered successfully. All application data, models, and conversations are preserved." -ForegroundColor Green
