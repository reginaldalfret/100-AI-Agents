<#
.SYNOPSIS
  Stops local stack gateway and python compute safely.
#>
$ErrorActionPreference = 'Continue'

function Stop-PortProcess($port) {
    try {
        $pids = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
        foreach ($pid in $pids) {
            if ($pid) {
                Write-Host "Terminating process on port $port (PID: $pid)..." -ForegroundColor Yellow
                Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            }
        }
    } catch {}
}

Stop-PortProcess 8300
Stop-PortProcess 8305
Write-Host '[STOP] Stopped Gateway and Python Compute services.' -ForegroundColor Green
