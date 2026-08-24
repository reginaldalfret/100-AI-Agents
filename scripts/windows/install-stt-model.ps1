<#
.SYNOPSIS
  Installs and verifies the local offline faster-whisper STT model.
.DESCRIPTION
  Downloads/prepares the tiny.en model weights for 100% air-gapped speech recognition.
#>

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Sovereign AI Workbench — STT Model Setup" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

$RepoRoot = Resolve-Path "$PSScriptRoot/../.."
$ModelDir = Join-Path $RepoRoot "platform/voice/stt-models/tiny.en"

if (-not (Test-Path $ModelDir)) {
    New-Item -ItemType Directory -Force -Path $ModelDir | Out-Null
}

Write-Host "[1/2] Installing faster-whisper in Python 3.12..." -ForegroundColor Yellow
py -3.12 -m pip install faster-whisper

Write-Host "[2/2] Bundling local Whisper tiny.en model to $ModelDir..." -ForegroundColor Yellow
py -3.12 -c @"
import os
from faster_whisper import WhisperModel
model_dir = r'$ModelDir'
os.makedirs(model_dir, exist_ok=True)
model = WhisperModel('tiny.en', device='cpu', compute_type='int8', download_root=model_dir)
print('[SUCCESS] Local Whisper Model ready for offline execution.')
"@

Write-Host "==========================================" -ForegroundColor Green
Write-Host "Local STT Model Setup Complete!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
