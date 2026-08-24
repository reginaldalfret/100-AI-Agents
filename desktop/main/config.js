import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../');

const isProduction = process.env.NODE_ENV === 'production' || Boolean(process.resourcesPath && !process.defaultApp);
const appDataRoot = process.env.LOCALAPPDATA
  ? path.join(process.env.LOCALAPPDATA, '301SuperAI')
  : path.join(os.homedir(), '.301superai');

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
    defaultVision: 'gemma3:4b',
    stt: 'tiny.en'
  }
};
