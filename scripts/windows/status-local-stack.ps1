<#
.SYNOPSIS
  Reports authoritative status for 301 Super AI Agents Local Stack.
#>
$ErrorActionPreference = 'Continue'

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Resolve-Path (Join-Path $ScriptDir '../..')

Write-Host '==================================================' -ForegroundColor Cyan
Write-Host '  301 SUPER AI AGENTS -- LOCAL STACK STATUS' -ForegroundColor White
Write-Host '==================================================' -ForegroundColor Cyan

# 1. Ollama Runtime (Port 11434)
$ollamaReady = 'OFFLINE'
$port11434 = 'FAILED'
try {
    $res = Invoke-RestMethod -Uri 'http://127.0.0.1:11434/api/tags' -Method Get -TimeoutSec 2 -ErrorAction SilentlyContinue
    if ($res) {
        $ollamaReady = 'READY'
        $port11434 = 'OK'
    }
} catch {}

Write-Host 'Ollama:' -ForegroundColor White
$c1 = if ($ollamaReady -eq 'READY') { 'Green' } else { 'Red' }
Write-Host "  $ollamaReady" -ForegroundColor $c1

# 2. Python Compute Service (Port 8305)
$pythonReady = 'OFFLINE'
$port8305 = 'FAILED'
try {
    $pRes = Invoke-RestMethod -Uri 'http://127.0.0.1:8305/health' -Method Get -TimeoutSec 2 -ErrorAction SilentlyContinue
    if ($pRes -and $pRes.success) {
        $pythonReady = 'READY'
        $port8305 = 'OK'
    }
} catch {}

Write-Host 'Python Compute:' -ForegroundColor White
$cp = if ($pythonReady -eq 'READY') { 'Green' } else { 'Yellow' }
Write-Host "  $pythonReady" -ForegroundColor $cp

# 3. Node Gateway (Port 8300)
$gatewayReady = 'OFFLINE'
$port8300 = 'FAILED'
try {
    $gRes = Invoke-RestMethod -Uri 'http://127.0.0.1:8300/api/health' -Method Get -TimeoutSec 2 -ErrorAction SilentlyContinue
    if ($gRes -and $gRes.status -eq 'healthy') {
        $gatewayReady = 'READY'
        $port8300 = 'OK'
    }
} catch {}

Write-Host 'Gateway:' -ForegroundColor White
$cgw = if ($gatewayReady -eq 'READY') { 'Green' } else { 'Red' }
Write-Host "  $gatewayReady" -ForegroundColor $cgw

Write-Host ''
Write-Host "Port 11434:" -ForegroundColor White
Write-Host "  $port11434" -ForegroundColor $c1

Write-Host "Port 8305:" -ForegroundColor White
Write-Host "  $port8305" -ForegroundColor $cp

Write-Host "Port 8300:" -ForegroundColor White
Write-Host "  $port8300" -ForegroundColor $cgw

# Global System Status
$overall = 'FAILED'
if ($gatewayReady -eq 'READY' -and $ollamaReady -eq 'READY' -and $pythonReady -eq 'READY') {
    $overall = 'READY'
} elseif ($gatewayReady -eq 'READY' -and $ollamaReady -eq 'READY') {
    $overall = 'DEGRADED'
}

$co = switch ($overall) {
    'READY' { 'Green' }
    'DEGRADED' { 'Yellow' }
    default { 'Red' }
}

Write-Host ''
Write-Host 'System:' -ForegroundColor White
Write-Host "  $overall" -ForegroundColor $co
Write-Host '==================================================' -ForegroundColor Cyan
