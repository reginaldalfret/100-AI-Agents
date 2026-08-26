import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../');

const isProduction = process.env.NODE_ENV === 'production' || Boolean(process.resourcesPath && !process.defaultApp);
const appDataRoot = process.env.PROJECT_ROOT
  ? path.join(process.env.PROJECT_ROOT, 'desktop-data')
  : path.join(projectRoot, 'desktop-data');
if (!fs.existsSync(appDataRoot)) {
  try {
    fs.mkdirSync(appDataRoot, { recursive: true });
  } catch {}
}

const logsDir = path.join(appDataRoot, 'logs');
if (!fs.existsSync(logsDir)) {
  try {
    fs.mkdirSync(logsDir, { recursive: true });
  } catch {}
}

export const DesktopConfig = {
  appName: '301 Super AI',
  version: '2.0.0',
  isProduction,
  paths: {
    appDataRoot,
    logsDir,
    projectRoot,
    resourcesDir: process.resourcesPath || projectRoot
  },
  ports: {
    gateway: 8300,
    pythonCompute: 8305,
    ollama: 11434
  },
  timeouts: {
    startupGraceMs: 30000,
    healthCheckIntervalMs: 5000,
    crashCooldownMs: 600000, // 10 minutes
    maxCrashRetries: 5
  },
  models: {
    defaultOrchestrator: 'nemotron-3-nano:latest',
    defaultCoder: 'qwen2.5-coder:1.5b',
    gemmaText: 'gemma3:1b',
    llamaEdge: 'llama3.2:1b',
    graniteEnterprise: 'granite4:1b-h',
    phiReasoning: 'phi4-mini:latest',
    smollmText: 'smollm2:1.7b',
    stt: 'tiny.en',
    ocr: 'python-compute-ocr',
    registry: [
      { id: 'nemotron-3-nano:latest', name: 'NVIDIA Nemotron 3 Nano', role: 'orchestrator', required: true, vramMinMb: 2500 },
      { id: 'qwen2.5-coder:1.5b', name: 'Qwen 2.5 Coder 1.5B', role: 'coder', required: true, vramMinMb: 1200 },
      { id: 'gemma3:1b', name: 'Google Gemma 3 1B', role: 'general_text', required: false, vramMinMb: 1100 },
      { id: 'llama3.2:1b', name: 'Meta Llama 3.2 1B', role: 'edge_assistant', required: false, vramMinMb: 900 },
      { id: 'granite4:1b-h', name: 'IBM Granite 4 1B-H', role: 'enterprise_agent', required: false, vramMinMb: 1100 },
      { id: 'phi4-mini:latest', name: 'Microsoft Phi-4 Mini 3.8B', role: 'math_stem_reasoning', required: false, vramMinMb: 2600 },
      { id: 'smollm2:1.7b', name: 'SmolLM2 1.7B', role: 'lightweight_general_text', required: false, vramMinMb: 1800 },
      { id: 'ocr-document-intelligence', name: 'Python Compute OCR & Document Intelligence', role: 'document_intelligence', required: true, vramMinMb: 0 },
      { id: 'whisper-tiny.en', name: 'Faster-Whisper Tiny English', role: 'stt', required: true, vramMinMb: 200 }
    ]
  }
};
