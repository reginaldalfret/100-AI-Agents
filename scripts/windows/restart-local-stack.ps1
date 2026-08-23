# Safely restarts the stack with Ollama keep-alive preservation
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
& (Join-Path $ScriptDir "stop-local-stack.ps1")
Start-Sleep -Seconds 2
& (Join-Path $ScriptDir "start-local-stack.ps1")
