# Stops only managed Super AI platform processes gracefully
$ErrorActionPreference = "Continue"

Write-Host "Stopping 101 Super AI Agents stack processes..." -ForegroundColor Yellow

# Find node processes running supervisor or gateway
$nodeProcs = Get-CimInstance Win32_Process -Filter "Name = 'node.exe'"
foreach ($p in $nodeProcs) {
    if ($p.CommandLine -match "supervisor.js|platform/gateway/src/server.js|run-fleet.js") {
        Write-Host "Stopping managed Node process (PID $($p.ProcessId))..." -ForegroundColor Gray
        Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue
    }
}

# Stop Python compute if running sovereign_compute
$pyProcs = Get-CimInstance Win32_Process -Filter "Name = 'python.exe'"
foreach ($p in $pyProcs) {
    if ($p.CommandLine -match "sovereign_compute") {
        Write-Host "Stopping managed Python compute (PID $($p.ProcessId))..." -ForegroundColor Gray
        Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue
    }
}

Write-Host "Stack stopped successfully." -ForegroundColor Green
