# 101 Super AI Agents — Health Probe (Exit 0 = Healthy, Exit 1 = Unhealthy)
$ErrorActionPreference = "SilentlyContinue"

$ollamaOk = $false
try {
    $res = Invoke-RestMethod -Uri "http://127.0.0.1:11434/api/tags" -Method Get -TimeoutSec 2
    if ($res) { $ollamaOk = $true }
} catch {}

$pythonOk = $false
try {
    $res = Invoke-RestMethod -Uri "http://127.0.0.1:8305/health" -Method Get -TimeoutSec 2
    if ($res -and $res.success) { $pythonOk = $true }
} catch {}

$gatewayOk = $false
try {
    $res = Invoke-RestMethod -Uri "http://127.0.0.1:8300/api/health" -Method Get -TimeoutSec 2
    if ($res -and $res.status -eq "healthy") { $gatewayOk = $true }
} catch {}

if ($gatewayOk -and $ollamaOk) {
    Write-Host "[HEALTH_PASS] Local AI Stack is healthy. Gateway: OK, Ollama: OK, Python: $(if ($pythonOk){'OK'}else{'Fallback'})" -ForegroundColor Green
    exit 0
} else {
    Write-Host "[HEALTH_FAIL] Local AI Stack degraded. Gateway: $gatewayOk, Ollama: $ollamaOk, Python: $pythonOk" -ForegroundColor Red
    exit 1
}
