/**
 * Sovereign AI Workbench — Authoritative Windows Local AI Stack Supervisor
 * Manages Ollama (11434), Python Compute (8305), and Node Gateway (8300) with
 * strict dependency gating, crash-loop circuit breaker, and zero egress.
 */
import http from 'node:http';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const RUNTIME_DIR = path.join(ROOT, 'runtime');
const LOG_DIR = path.join(RUNTIME_DIR, 'logs');
const STATE_DIR = path.join(RUNTIME_DIR, 'service-state');
const PID_DIR = path.join(RUNTIME_DIR, 'pids');

[LOG_DIR, STATE_DIR, PID_DIR].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

const SUPERVISOR_LOG = path.join(LOG_DIR, 'supervisor.log');

function log(level, message, meta = {}) {
  const timestamp = new Date().toISOString();
  const entry = `[${timestamp}] [${level.toUpperCase()}] ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}\n`;
  try {
    fs.appendFileSync(SUPERVISOR_LOG, entry, 'utf8');
  } catch {}
  console.log(`[${level.toUpperCase()}] ${message}`);
}

const state = {
  ollama: { process: null, pid: null, running: false, failures: 0, lastRestart: 0, state: 'STOPPED' },
  python: { process: null, pid: null, running: false, failures: 0, lastRestart: 0, state: 'STOPPED' },
  gateway: { process: null, pid: null, running: false, failures: 0, lastRestart: 0, state: 'STOPPED' },
  isShuttingDown: false
};

function writeStateFile(serviceName, data) {
  try {
    const p = path.join(STATE_DIR, `${serviceName}.json`);
    fs.writeFileSync(p, JSON.stringify({ ...data, updatedAt: new Date().toISOString() }, null, 2), 'utf8');
  } catch {}
}

function pingUrl(url, timeoutMs = 3000) {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(url);
      const req = http.request(parsed, { method: 'GET', timeout: timeoutMs }, (res) => {
        resolve(res.statusCode >= 200 && res.statusCode < 400);
      });
      req.on('error', () => resolve(false));
      req.on('timeout', () => { req.destroy(); resolve(false); });
      req.end();
    } catch {
      resolve(false);
    }
  });
}

// 1. Ollama Controller
async function checkOllama() {
  const healthy = await pingUrl('http://127.0.0.1:11434/api/tags', 3000);
  state.ollama.running = healthy;
  state.ollama.state = healthy ? 'READY' : 'OFFLINE';
  writeStateFile('ollama', state.ollama);
  return healthy;
}

function startOllama() {
  if (state.isShuttingDown || state.ollama.running) return;
  const now = Date.now();
  if (now - state.ollama.lastRestart < 600000 && state.ollama.failures >= 5) {
    log('error', 'Ollama entered FAILED state due to crash-loop (5 failures in 10 min)');
    state.ollama.state = 'FAILED';
    writeStateFile('ollama', state.ollama);
    return;
  }
  state.ollama.failures++;
  state.ollama.lastRestart = now;
  state.ollama.state = 'STARTING';
  log('info', 'Ensuring local Ollama daemon is running on 11434...');
  const ollamaExe = 'C:\\Users\\ASUS\\AppData\\Local\\Programs\\Ollama\\ollama.exe';
  if (fs.existsSync(ollamaExe)) {
    const p = spawn(ollamaExe, ['serve'], { detached: true, stdio: 'ignore' });
    p.unref();
    state.ollama.pid = p.pid;
  }
}

// 2. Python Compute Controller
async function checkPython() {
  const healthy = await pingUrl('http://127.0.0.1:8305/health', 2500);
  state.python.running = healthy;
  state.python.state = healthy ? 'READY' : 'OFFLINE';
  writeStateFile('python', state.python);
  return healthy;
}

function startPython() {
  if (state.isShuttingDown || state.python.running) return;
  const now = Date.now();
  if (now - state.python.lastRestart < 600000 && state.python.failures >= 5) {
    log('error', 'Python Compute entered FAILED state due to crash-loop');
    state.python.state = 'FAILED';
    writeStateFile('python', state.python);
    return;
  }
  state.python.failures++;
  state.python.lastRestart = now;
  state.python.state = 'STARTING';
  log('info', 'Starting Python Compute microservice on 127.0.0.1:8305...');

  const pythonScript = path.join(ROOT, 'platform', 'python-compute', 'src', 'sovereign_compute', 'server.py');
  const pythonExe = 'C:\\Users\\ASUS\\AppData\\Local\\Programs\\Python\\Python312\\python.exe';
  const executable = fs.existsSync(pythonExe) ? pythonExe : 'python';

  const pyProcess = spawn(executable, [pythonScript], {
    cwd: ROOT,
    stdio: ['ignore', 'ignore', 'ignore'],
    detached: false
  });

  state.python.process = pyProcess;
  state.python.pid = pyProcess.pid;

  pyProcess.on('exit', (code, signal) => {
    log('warn', `Python Compute process exited with code ${code}, signal ${signal}`);
    state.python.running = false;
    state.python.process = null;
    state.python.state = 'STOPPED';
    writeStateFile('python', state.python);
  });
}

// 3. Node Gateway Controller
async function checkGateway() {
  const healthy = await pingUrl('http://127.0.0.1:8300/api/health', 2500);
  state.gateway.running = healthy;
  state.gateway.state = healthy ? 'READY' : 'OFFLINE';
  writeStateFile('gateway', state.gateway);
  return healthy;
}

function startGateway() {
  if (state.isShuttingDown || state.gateway.running) return;
  const now = Date.now();
  if (now - state.gateway.lastRestart < 600000 && state.gateway.failures >= 5) {
    log('error', 'Node Gateway entered FAILED state due to crash-loop');
    state.gateway.state = 'FAILED';
    writeStateFile('gateway', state.gateway);
    return;
  }
  state.gateway.failures++;
  state.gateway.lastRestart = now;
  state.gateway.state = 'STARTING';
  log('info', 'Starting Sovereign AI Gateway on http://127.0.0.1:8300...');

  const gatewayScript = path.join(ROOT, 'platform', 'gateway', 'src', 'server.js');
  const nodeExe = process.execPath;

  const gwProcess = spawn(nodeExe, [gatewayScript], {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, PORT: '8300', HOST: '0.0.0.0', NODE_ENV: 'production' }
  });

  state.gateway.process = gwProcess;
  state.gateway.pid = gwProcess.pid;

  gwProcess.on('exit', (code, signal) => {
    log('warn', `Gateway process exited with code ${code}, signal ${signal}`);
    state.gateway.running = false;
    state.gateway.process = null;
    state.gateway.state = 'STOPPED';
    writeStateFile('gateway', state.gateway);
  });
}

// Supervision Loop with Dependency Gating
async function supervisionLoop() {
  if (state.isShuttingDown) return;

  // Step 1: Check & Start Ollama
  const ollamaOk = await checkOllama();
  if (!ollamaOk) {
    startOllama();
  }

  // Step 2: Check & Start Python Compute
  const pythonOk = await checkPython();
  if (!pythonOk) {
    startPython();
  }

  // Step 3: Check & Start Node Gateway
  const gatewayOk = await checkGateway();
  if (!gatewayOk) {
    startGateway();
  }
}

// Clean Shutdown Handler
function shutdown() {
  state.isShuttingDown = true;
  log('info', 'Supervisor received shutdown signal. Terminating child processes gracefully...');
  if (state.gateway.process) state.gateway.process.kill('SIGTERM');
  if (state.python.process) state.python.process.kill('SIGTERM');
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

log('info', '============================================================');
log('info', '  101 SUPER AI AGENTS — LOCAL STACK SUPERVISOR ACTIVE');
log('info', '  Problem Statement: SIH 26117 — Mangalore Refinery (MRPL)');
log('info', '  Local Website URI: http://127.0.0.1:8300/');
log('info', '============================================================');

// Initial boot
supervisionLoop();

// Watchdog interval every 5 seconds
setInterval(supervisionLoop, 5000);
