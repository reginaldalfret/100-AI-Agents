$env:OLLAMA_MODEL = "nemotron-3-nano"
$env:OLLAMA_BASE_URL = "http://127.0.0.1:11434"
$env:PROJECT_ROOT = "E:\Smart Automation\100-AI-Agents"

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
    $fullPath = Join-Path "E:\Smart Automation\100-AI-Agents" $script
    $p = Start-Process -FilePath "node" -ArgumentList """" -PassThru -WindowStyle Hidden -Environment @{
        OLLAMA_MODEL = "nemotron-3-nano"
        OLLAMA_BASE_URL = "http://127.0.0.1:11434"
        PROJECT_ROOT = "E:\Smart Automation\100-AI-Agents"
    }
    $procs += $p
    Write-Host "Started $script (PID $(.Id))"
}
Start-Sleep -Seconds 2
