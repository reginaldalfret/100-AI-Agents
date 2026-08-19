# SA-S03 Production Deployment Health & Public Edge Verification Script
$ErrorActionPreference = "Continue"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  SA-S03 Production Platform & Public Edge Verification" -ForegroundColor White
Write-Host "============================================================" -ForegroundColor Cyan

$results = [ordered]@{}

# 1. Check Local Ollama
Write-Host "[1/7] Checking Local Ollama Daemon (http://127.0.0.1:11434)..." -NoNewline
try {
    $res = Invoke-RestMethod -Uri "http://127.0.0.1:11434/api/tags" -Method Get -TimeoutSec 4 -ErrorAction Stop
    $results["Ollama"] = "PASS"
    Write-Host " PASS ($(($res.models | Measure-Object).Count) models)" -ForegroundColor Green
} catch {
    $results["Ollama"] = "FAIL"
    Write-Host " FAIL" -ForegroundColor Red
}

# 2. Check Local Gateway
Write-Host "[2/7] Checking Local Gateway (http://127.0.0.1:8300/api/info)..." -NoNewline
try {
    $res = Invoke-RestMethod -Uri "http://127.0.0.1:8300/api/info" -Method Get -TimeoutSec 4 -ErrorAction Stop
    $results["Gateway"] = "PASS"
    Write-Host " PASS (Total agents: $($res.total_agents))" -ForegroundColor Green
} catch {
    $results["Gateway"] = "FAIL"
    Write-Host " FAIL" -ForegroundColor Red
}

# 3. Check Gateway Health Endpoint
Write-Host "[3/7] Checking Health Endpoint (http://127.0.0.1:8300/api/health)..." -NoNewline
try {
    $res = Invoke-RestMethod -Uri "http://127.0.0.1:8300/api/health" -Method Get -TimeoutSec 4 -ErrorAction Stop
    if ($res.status -eq "healthy" -or $res.status -eq "ok") {
        $results["HealthEndpoint"] = "PASS"
        Write-Host " PASS (Status: $($res.status))" -ForegroundColor Green
    } else {
        $results["HealthEndpoint"] = "FAIL"
        Write-Host " FAIL (Status: $($res.status))" -ForegroundColor Yellow
    }
} catch {
    $results["HealthEndpoint"] = "FAIL"
    Write-Host " FAIL" -ForegroundColor Red
}

# 4. Check Representative Fleet Agent
Write-Host "[4/7] Checking Agent Fleet (http://127.0.0.1:8102/api/health)..." -NoNewline
try {
    $res = Invoke-RestMethod -Uri "http://127.0.0.1:8102/api/health" -Method Get -TimeoutSec 4 -ErrorAction Stop
    $results["Fleet"] = "PASS"
    Write-Host " PASS (Agent 002: $($res.status))" -ForegroundColor Green
} catch {
    $results["Fleet"] = "FAIL"
    Write-Host " FAIL" -ForegroundColor Red
}

# 5. Check Cloudflare Tunnel Service
Write-Host "[5/7] Checking Cloudflared Windows Service..." -NoNewline
$cfService = Get-Service -Name "Cloudflared" -ErrorAction SilentlyContinue
if ($cfService -and $cfService.Status -eq "Running") {
    $results["CloudflareService"] = "PASS"
    Write-Host " PASS (Status: Running)" -ForegroundColor Green
} else {
    $results["CloudflareService"] = "FAIL"
    Write-Host " FAIL" -ForegroundColor Red
}

# 6. Check Public HTTPS Edge (https://smartauto.reginald.tech / https://smartauto.reginaldalfret.tech)
Write-Host "[6/7] Checking Public HTTPS Edge..." -NoNewline
$publicUrls = @("https://smartauto.reginald.tech", "https://smartauto.reginaldalfret.tech")
$publicPass = $false

foreach ($pUrl in $publicUrls) {
    try {
        $res = Invoke-WebRequest -Uri "$pUrl/api/info" -Method Get -TimeoutSec 6 -UseBasicParsing -ErrorAction Stop
        if ($res.StatusCode -eq 200) {
            $publicPass = $true
            Write-Host "`n  [PASS] $pUrl reachable over Public HTTPS" -ForegroundColor Green
        }
    } catch {
        Write-Host "`n  [INFO] $pUrl - $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

if ($publicPass) {
    $results["PublicHTTPS"] = "PASS"
} else {
    $results["PublicHTTPS"] = "FAIL"
}

# 7. Check Representative Workflow Execution
Write-Host "[7/7] Checking Representative Workflow Engine Start..." -NoNewline
try {
    $body = @{
        workflow_id = "scholarship-eligibility"
        studentId = "STU-DEMO-001"
        scholarshipId = "SCH-MERIT"
    } | ConvertTo-Json

    $res = Invoke-RestMethod -Uri "http://127.0.0.1:8300/api/workflows/start" -Method Post -Body $body -ContentType "application/json" -TimeoutSec 8 -ErrorAction Stop
    if ($res.status -eq "success" -and $res.instance.status -eq "pending_approval") {
        $results["WorkflowEngine"] = "PASS"
        Write-Host " PASS (Workflow $($res.instance.id) in pending_approval)" -ForegroundColor Green
    } else {
        $results["WorkflowEngine"] = "FAIL"
        Write-Host " FAIL" -ForegroundColor Yellow
    }
} catch {
    $results["WorkflowEngine"] = "FAIL"
    Write-Host " FAIL" -ForegroundColor Red
}

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "  VERIFICATION SUMMARY" -ForegroundColor White
Write-Host "============================================================" -ForegroundColor Cyan

foreach ($k in $results.Keys) {
    $val = $results[$k]
    $color = if ($val -eq "PASS") { "Green" } else { "Red" }
    Write-Host ("  {0,-20} : {1}" -f $k, $val) -ForegroundColor $color
}
