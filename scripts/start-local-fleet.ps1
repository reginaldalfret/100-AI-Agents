$ScriptDir = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Path }
$ProjectRoot = (Resolve-Path (Join-Path $ScriptDir "..")).Path

$env:PROJECT_ROOT = $ProjectRoot
$env:OLLAMA_MODEL = if ($env:OLLAMA_MODEL) { $env:OLLAMA_MODEL } else { "nemotron-3-nano" }
$env:OLLAMA_BASE_URL = if ($env:OLLAMA_BASE_URL) { $env:OLLAMA_BASE_URL } else { "http://127.0.0.1:11434" }
$env:OLLAMA_MODELS = "E:\Smart Automation\100-AI-Agents\models\ollama"

$agents = @(
    "agents\agent-001-writing-agent\backend\src\server.js",
    "agents\agent-002-email-agent\backend\src\server.js",
    "agents\agent-021-web-research-agent\backend\src\server.js",
    "agents\agent-045-pdf-processing-agent\backend\src\server.js",
    "agents\agent-055-code-review-agent\backend\src\server.js",
    "agents\agent-084-business-analyst-agent\backend\src\server.js",
    "agents\agent-101-master-agent\backend\src\server.js",
    "platform\gateway\src\server.js"
)

$procs = @()
foreach ($script in $agents) {
    $fullPath = Join-Path $ProjectRoot $script
    $p = Start-Process -FilePath "node" -ArgumentList "`"$fullPath`"" -PassThru -WindowStyle Hidden -Environment @{
        OLLAMA_MODEL = $env:OLLAMA_MODEL
        OLLAMA_BASE_URL = $env:OLLAMA_BASE_URL
        OLLAMA_MODELS = $env:OLLAMA_MODELS
        PROJECT_ROOT = $ProjectRoot
    }
    $procs += $p
    Write-Host "Started $script (PID $($p.Id))"
}
Start-Sleep -Seconds 2
