<#
.SYNOPSIS
  Fix and verify Ollama service and all 12 local models on Windows.
#>
$ErrorActionPreference = 'Continue'

$TargetModelsPath = "E:\Smart Automation\100-AI-Agents\models\ollama"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  OLLAMA SERVICE & MODEL STORAGE REPAIR & VERIFICATION" -ForegroundColor White
Write-Host "============================================================" -ForegroundColor Cyan

# 1. Ensure Windows User Environment Variable OLLAMA_MODELS is permanently set
Write-Host "[1/5] Configuring OLLAMA_MODELS user environment variable..." -ForegroundColor Yellow
[System.Environment]::SetEnvironmentVariable('OLLAMA_MODELS', $TargetModelsPath, 'User')
[System.Environment]::SetEnvironmentVariable('OLLAMA_MODELS', $TargetModelsPath, 'Process')
$env:OLLAMA_MODELS = $TargetModelsPath
Write-Host "  OLLAMA_MODELS set to: $TargetModelsPath" -ForegroundColor Green

# 2. Terminate orphaned ollama, llama-server, or background processes holding VRAM or port 11434
Write-Host "[2/5] Terminating any orphaned Ollama / llama processes..." -ForegroundColor Yellow
Get-Process ollama*, llama* -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Clear port 11434 if held by any other process
try {
    $pids11434 = Get-NetTCPConnection -LocalPort 11434 -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
    foreach ($p in $pids11434) {
        if ($p) {
            Write-Host "  Killing process $p holding port 11434..." -ForegroundColor Yellow
            Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
        }
    }
} catch {}

Start-Sleep -Seconds 2

# 3. Locate Ollama executable and start daemon
Write-Host "[3/5] Starting Ollama daemon with OLLAMA_MODELS=$TargetModelsPath..." -ForegroundColor Yellow
$ollamaCmd = (Get-Command ollama -ErrorAction SilentlyContinue)
$ollamaExe = if ($ollamaCmd) { $ollamaCmd.Source } else { "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe" }

if (-not (Test-Path $ollamaExe)) {
    Write-Host "ERROR: Ollama executable not found at $ollamaExe" -ForegroundColor Red
    exit 1
}

$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = $ollamaExe
$psi.Arguments = "serve"
$psi.EnvironmentVariables["OLLAMA_MODELS"] = $TargetModelsPath
$psi.UseShellExecute = $false
$psi.CreateNoWindow = $true
$psi.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Hidden

[System.Diagnostics.Process]::Start($psi) | Out-Null
Start-Sleep -Seconds 3

# Test endpoint
$tags = $null
for ($i = 0; $i -lt 10; $i++) {
    try {
        $tags = Invoke-RestMethod -Uri "http://127.0.0.1:11434/api/tags" -Method Get -TimeoutSec 3 -ErrorAction Stop
        if ($tags -and $tags.models) {
            break
        }
    } catch {
        Start-Sleep -Seconds 1
    }
}

if (-not $tags -or -not $tags.models) {
    Write-Host "ERROR: Ollama server did not respond at http://127.0.0.1:11434/api/tags" -ForegroundColor Red
    exit 1
}

Write-Host "  Ollama server is ONLINE and responding at http://127.0.0.1:11434" -ForegroundColor Green

# 4. Verify all 12 local models
Write-Host "[4/5] Verifying 12 local models from $TargetModelsPath..." -ForegroundColor Yellow
$expectedModels = @(
    "nemotron-3-nano:latest",
    "qwen2.5-coder:1.5b",
    "gemma3:1b",
    "llama3.2:1b",
    "granite4:1b-h",
    "phi4-mini",
    "smollm2:1.7b",
    "falcon3:1b-instruct-q4_K_M",
    "LiquidAI/lfm2.5-350m",
    "mollysama/rwkv-7-g1d:0.4b",
    "tinyllama:1.1b-chat",
    "stablelm2:1.6b"
)

$registeredModels = $tags.models | ForEach-Object { $_.name }
Write-Host "Discovered $($tags.models.Count) models in Ollama:" -ForegroundColor Cyan
foreach ($m in $tags.models) {
    Write-Host "  - $($m.name) (Size: $([math]::Round($m.size / 1MB, 1)) MB)" -ForegroundColor Gray
}

$allFound = $true
foreach ($em in $expectedModels) {
    $found = $registeredModels | Where-Object { 
        $_ -eq $em -or 
        $_ -eq "$em:latest" -or 
        "$_:latest" -eq $em -or
        $_.ToLower() -eq $em.ToLower() -or
        $_.ToLower() -eq "$($em.ToLower()):latest"
    }
    if ($found) {
        Write-Host "  [OK] $em (Matched: $found)" -ForegroundColor Green
    } else {
        Write-Host "  [MISSING] $em" -ForegroundColor Red
        $allFound = $false
    }
}

# 5. Live generation test on nemotron-3-nano:latest and llama3.2:1b
Write-Host "[5/5] Performing live inference tests..." -ForegroundColor Yellow

$testModels = @("nemotron-3-nano:latest", "llama3.2:1b")
foreach ($tm in $testModels) {
    Write-Host "Testing model: $tm with prompt 'hi'..." -ForegroundColor Cyan
    $body = @{
        model = $tm
        prompt = "hi"
        stream = $false
    } | ConvertTo-Json

    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    try {
        $genRes = Invoke-RestMethod -Uri "http://127.0.0.1:11434/api/generate" -Method Post -Body $body -ContentType "application/json" -TimeoutSec 10
        $sw.Stop()
        $elapsedSec = [math]::Round($sw.Elapsed.TotalSeconds, 2)
        $responsePreview = if ($genRes.response) { $genRes.response.Trim() } else { "(empty)" }
        if ($responsePreview.Length -gt 60) {
            $responsePreview = $responsePreview.Substring(0, 60) + "..."
        }
        Write-Host "  [SUCCESS] $tm responded in ${elapsedSec}s: `"$responsePreview`"" -ForegroundColor Green
    } catch {
        $sw.Stop()
        Write-Host "  [ERROR] Failed generating with ${tm}: $_" -ForegroundColor Red
    }
}

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  VERIFICATION COMPLETE" -ForegroundColor White
Write-Host "============================================================" -ForegroundColor Cyan
