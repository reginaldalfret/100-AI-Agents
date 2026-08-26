/**
 * Sovereign AI Workbench — Authoritative Windows Local AI Stack Supervisor
 * 
 * Manages Ollama (11434), Python Compute (8305), and Node Gateway (8300) with:
 * - Single-instance mutual exclusion lock (runtime/pids/supervisor.pid)
 * - Fast native port-ownership detection (Zero duplicate processes)
 * - Seamless PID adoption of healthy running services
 * - Startup grace period (Prevents EADDRINUSE race conditions)
 * - Terminal FAILED state on crash-loop threshold (Zero infinite restart spam)
 * - Transparent process stderr/stdout capturing and diagnostics
 * - 100% On-Premise Air-Gapped Local Operation (0 External Calls)
 */

import http from 'node:http';
import { spawn, execSync } from 'node:child_process';
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
const PYTHON_LOG = path.join(LOG_DIR, 'python-compute.log');
const GATEWAY_LOG = path.join(LOG_DIR, 'gateway.log');
const SUPERVISOR_PID_FILE = path.join(PID_DIR, 'supervisor.pid');

function log(level, message, meta = {}) {
  const timestamp = new Date().toISOString();
  const metaStr = Object.keys(meta).length ? ' ' + JSON.stringify(meta) : '';
  const entry = `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}\n`;
  try {
    fs.appendFileSync(SUPERVISOR_LOG, entry, 'utf8');
  } catch {}
  console.log(`[${level.toUpperCase()}] ${message}`);
}

// -------------------------------------------------------------
// 1. Single-Instance Supervisor Lock
// -------------------------------------------------------------
function acquireSupervisorLock() {
  if (fs.existsSync(SUPERVISOR_PID_FILE)) {
    try {
      const existingPid = parseInt(fs.readFileSync(SUPERVISOR_PID_FILE, 'utf8').trim(), 10);
      if (!isNaN(existingPid) && existingPid !== process.pid) {
        // Check if existing PID is currently alive and running supervisor
        try {
          process.kill(existingPid, 0); // signal 0 tests process existence
          const cmdLine = getProcessCommandLine(existingPid);
          if (cmdLine.includes('supervisor.js')) {
            console.log(`[INFO] 301 Super AI Agents Supervisor is already running (PID ${existingPid}). Exiting duplicate instance.`);
            process.exit(0);
          }
        } catch {
          // Process not alive, stale pid file
        }
      }
    } catch {}
  }

  try {
    fs.writeFileSync(SUPERVISOR_PID_FILE, String(process.pid), 'utf8');
  } catch {}
}

function releaseSupervisorLock() {
  try {
    if (fs.existsSync(SUPERVISOR_PID_FILE)) {
      const recordedPid = parseInt(fs.readFileSync(SUPERVISOR_PID_FILE, 'utf8').trim(), 10);
      if (recordedPid === process.pid) {
        fs.unlinkSync(SUPERVISOR_PID_FILE);
      }
    }
  } catch {}
}

acquireSupervisorLock();

const state = {
  ollama: { process: null, pid: null, running: false, failures: 0, lastRestart: 0, state: 'STOPPED', loggedState: '' },
  python: { process: null, pid: null, running: false, failures: 0, lastRestart: 0, state: 'STOPPED', loggedState: '' },
  gateway: { process: null, pid: null, running: false, failures: 0, lastRestart: 0, state: 'STOPPED', loggedState: '' },
  isShuttingDown: false
};

function writeStateFile(serviceName, serviceState) {
  try {
    const p = path.join(STATE_DIR, `${serviceName}.json`);
    fs.writeFileSync(p, JSON.stringify({
      running: serviceState.running,
      pid: serviceState.pid,
      state: serviceState.state,
      failures: serviceState.failures,
      lastRestart: serviceState.lastRestart,
      updatedAt: new Date().toISOString()
    }, null, 2), 'utf8');
  } catch {}
}

function transitionState(serviceName, newState, reason = '') {
  const s = state[serviceName];
  if (!s) return;
  if (s.state !== newState || s.loggedState !== newState) {
    s.state = newState;
    s.loggedState = newState;
    writeStateFile(serviceName, s);
    log('info', `[${serviceName.toUpperCase()}] State transition -> ${newState}${reason ? ' (' + reason + ')' : ''}`);
  }
}

function pingUrl(url, timeoutMs = 3000) {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(url);
      const req = http.request(parsed, { method: 'GET', timeout: timeoutMs }, (res) => {
        let body = '';
        res.on('data', chunk => { body += chunk; });
        res.on('end', () => {
          resolve(res.statusCode >= 200 && res.statusCode < 400);
        });
      });
      req.on('error', () => resolve(false));
      req.on('timeout', () => { req.destroy(); resolve(false); });
      req.end();
    } catch {
      resolve(false);
    }
  });
}

function getPortOwningPid(port) {
  try {
    const output = execSync(`netstat -ano`, {
      encoding: 'utf8',
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    const lines = output.split(/\r?\n/);
    for (const line of lines) {
      if (line.includes(`:${port}`) && line.includes('LISTENING')) {
        const parts = line.trim().split(/\s+/);
        const pid = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(pid) && pid > 0) return pid;
      }
    }
    return null;
  } catch {
    return null;
  }
}

function getProcessCommandLine(pid) {
  if (!pid) return '';
  try {
    const cmd = execSync(`powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter 'ProcessId = ${pid}' | Select-Object -ExpandProperty CommandLine"`, {
      encoding: 'utf8',
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe']
    }).trim();
    return cmd || '';
  } catch {
    return '';
  }
}

function isOurProjectProcess(cmdLine) {
  if (!cmdLine) return false;
  const lower = cmdLine.toLowerCase();
  return lower.includes('100-ai-agents') || lower.includes('sovereign_compute') || lower.includes('super-ai') || lower.includes('server.js');
}

function safelyKillPid(pid, serviceName) {
  if (!pid || pid === process.pid) return;
  try {
    log('warn', `Terminating stale ${serviceName} process PID ${pid}`);
    execSync(`taskkill /PID ${pid} /F`, { windowsHide: true, stdio: 'ignore' });
  } catch {}
}

// -------------------------------------------------------------
// 2. Service Controllers
// -------------------------------------------------------------

// Ollama Controller (Port 11434)
async function checkOllama() {
  let hasModels = false;
  try {
    const res = await fetch('http://127.0.0.1:11434/api/tags', { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const data = await res.json();
      hasModels = Array.isArray(data.models) && data.models.length > 0;
    }
  } catch {}

  if (hasModels) {
    state.ollama.running = true;
    transitionState('ollama', 'READY');
    state.ollama.failures = 0;
    const pid = getPortOwningPid(11434);
    if (pid) state.ollama.pid = pid;
    return true;
  } else {
    // If port is listening but 0 models loaded, kill process so it can be restarted with correct OLLAMA_MODELS
    const pid = getPortOwningPid(11434);
    if (pid) {
      log('warn', `[OLLAMA] Port 11434 responding with 0 models. Terminating PID ${pid} to restart with authoritative OLLAMA_MODELS.`);
      killProcessTree(pid);
    }
    state.ollama.running = false;
    return false;
  }
}

function startOllama() {
  if (state.isShuttingDown || state.ollama.running) return;
  if (state.ollama.state === 'FAILED') return;

  const now = Date.now();
  if (state.ollama.state === 'STARTING' && now - state.ollama.lastRestart < 15000) {
    return; // Grace period during startup
  }

  if (now - state.ollama.lastRestart < 600000 && state.ollama.failures >= 5) {
    transitionState('ollama', 'FAILED', 'crash-loop threshold: 5 failures in 10min');
    log('error', '[OLLAMA] Entered terminal FAILED state. Automatic retries disabled.');
    return;
  }

  state.ollama.failures++;
  state.ollama.lastRestart = now;
  transitionState('ollama', 'STARTING');

  const ollamaExe = path.join(process.env.LOCALAPPDATA || 'C:\\Users\\ASUS\\AppData\\Local', 'Programs', 'Ollama', 'ollama.exe');
  if (fs.existsSync(ollamaExe)) {
    try {
      const p = spawn(ollamaExe, ['serve'], {
        detached: true,
        stdio: 'ignore',
        env: {
          ...process.env,
          OLLAMA_MODELS: process.env.OLLAMA_MODELS || path.join(ROOT, 'models', 'ollama'),
          OLLAMA_HOST: '127.0.0.1:11434'
        }
      });
      p.unref();
      state.ollama.pid = p.pid;
    } catch (e) {
      log('error', `Failed to spawn Ollama: ${e.message}`);
    }
  } else {
    log('warn', `Ollama executable not found at ${ollamaExe}`);
  }
}

// Python Compute Controller (Port 8305)
async function checkPython() {
  const healthy = await pingUrl('http://127.0.0.1:8305/health', 3000);
  if (healthy) {
    state.python.running = true;
    transitionState('python', 'READY');
    state.python.failures = 0;
    const pid = getPortOwningPid(8305);
    if (pid) state.python.pid = pid;
  } else {
    state.python.running = false;
  }
  return healthy;
}

function startPython() {
  if (state.isShuttingDown || state.python.running) return;
  if (state.python.state === 'FAILED') return;

  const now = Date.now();
  if (state.python.state === 'STARTING' && now - state.python.lastRestart < 15000) {
    return; // Grace period during startup
  }

  const existingPid = getPortOwningPid(8305);
  if (existingPid) {
    safelyKillPid(existingPid, 'python');
  }

  if (now - state.python.lastRestart < 600000 && state.python.failures >= 5) {
    transitionState('python', 'FAILED', 'crash-loop threshold: 5 failures in 10min');
    log('error', '[PYTHON COMPUTE] Entered terminal FAILED state. Automatic retries disabled.');
    return;
  }

  state.python.failures++;
  state.python.lastRestart = now;
  transitionState('python', 'STARTING');

  const pythonScript = path.join(ROOT, 'platform', 'python-compute', 'src', 'sovereign_compute', 'server.py');
  const pythonSrcDir = path.join(ROOT, 'platform', 'python-compute', 'src');
  const venvPy = path.join(ROOT, 'platform', 'python-compute', '.venv', 'Scripts', 'python.exe');
  const py312Path = 'C:\\Users\\ASUS\\AppData\\Local\\Programs\\Python\\Python312\\python.exe';
  const py311Path = 'C:\\Users\\ASUS\\AppData\\Local\\Programs\\Python\\Python311\\python.exe';
  const executable = fs.existsSync(venvPy) ? venvPy : (fs.existsSync(py312Path) ? py312Path : (fs.existsSync(py311Path) ? py311Path : 'python'));
  const args = [pythonScript];

  const logStream = fs.createWriteStream(PYTHON_LOG, { flags: 'a' });

  try {
    const venvDir = path.join(ROOT, 'platform', 'python-compute', '.venv');
    const venvScripts = path.join(venvDir, 'Scripts');
    const ocrVenvDir = path.join(ROOT, 'platform', 'ocr', '.venv');
    const pyProcess = spawn(executable, args, {
      cwd: ROOT,
      env: {
        ...process.env,
        VIRTUAL_ENV: venvDir,
        PATH: `${venvScripts};${path.join(ocrVenvDir, 'Scripts')};${process.env.PATH}`,
        PYTHONPATH: `${pythonSrcDir};${path.join(ROOT, 'platform')};${path.join(venvDir, 'Lib', 'site-packages')};${path.join(ocrVenvDir, 'Lib', 'site-packages')}`,
        PYTHONUNBUFFERED: '1'
      },
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false
    });

    state.python.process = pyProcess;
    state.python.pid = pyProcess.pid;

    pyProcess.stdout.pipe(logStream);
    pyProcess.stderr.pipe(logStream);

    let stderrBuffer = '';
    pyProcess.stderr.on('data', (d) => {
      stderrBuffer += d.toString();
    });

    pyProcess.on('exit', (code, signal) => {
      state.python.running = false;
      state.python.process = null;
      if (!state.isShuttingDown) {
        log('warn', `Python Compute process exited with code ${code}${stderrBuffer ? ' Reason: ' + stderrBuffer.trim() : ''}`);
        if (state.python.failures >= 5) {
          transitionState('python', 'FAILED', `Exit code ${code}`);
        } else {
          transitionState('python', 'STOPPED', `Exit code ${code}`);
        }
      }
    });
  } catch (e) {
    log('error', `Failed to spawn Python Compute: ${e.message}`);
    transitionState('python', 'FAILED', e.message);
  }
}

// Node Gateway Controller (Port 8300)
async function checkGateway() {
  const healthy = await pingUrl('http://127.0.0.1:8300/api/health', 3000);
  state.gateway.running = healthy;
  if (healthy) {
    transitionState('gateway', 'READY');
    state.gateway.failures = 0;
    const pid = getPortOwningPid(8300);
    if (pid) state.gateway.pid = pid;
  }
  return healthy;
}

function startGateway() {
  if (state.isShuttingDown || state.gateway.running) return;
  if (state.gateway.state === 'FAILED') return;

  const now = Date.now();
  if (state.gateway.state === 'STARTING' && now - state.gateway.lastRestart < 15000) {
    return; // Grace period during startup
  }

  const existingPid = getPortOwningPid(8300);
  if (existingPid) {
    safelyKillPid(existingPid, 'gateway');
  }

  if (now - state.gateway.lastRestart < 600000 && state.gateway.failures >= 5) {
    transitionState('gateway', 'FAILED', 'crash-loop threshold: 5 failures in 10min');
    log('error', '[GATEWAY] Entered terminal FAILED state. Automatic retries disabled.');
    return;
  }

  state.gateway.failures++;
  state.gateway.lastRestart = now;
  transitionState('gateway', 'STARTING');

  const gatewayScript = path.join(ROOT, 'platform', 'gateway', 'src', 'server.js');
  const logStream = fs.createWriteStream(GATEWAY_LOG, { flags: 'a' });

  try {
    const gwProcess = spawn(process.execPath, [gatewayScript], {
      cwd: ROOT,
      env: {
        ...process.env,
        PORT: '8300',
        HOST: '0.0.0.0',
        NODE_ENV: 'production'
      },
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false
    });

    state.gateway.process = gwProcess;
    state.gateway.pid = gwProcess.pid;

    gwProcess.stdout.pipe(logStream);
    gwProcess.stderr.pipe(logStream);

    let stderrBuffer = '';
    gwProcess.stderr.on('data', (d) => {
      stderrBuffer += d.toString();
    });

    gwProcess.on('exit', (code, signal) => {
      state.gateway.running = false;
      state.gateway.process = null;
      if (!state.isShuttingDown) {
        log('warn', `Gateway process exited with code ${code}${stderrBuffer ? ' Reason: ' + stderrBuffer.trim() : ''}`);
        if (state.gateway.failures >= 5) {
          transitionState('gateway', 'FAILED', `Exit code ${code}`);
        } else {
          transitionState('gateway', 'STOPPED', `Exit code ${code}`);
        }
      }
    });
  } catch (e) {
    log('error', `Failed to spawn Gateway: ${e.message}`);
    transitionState('gateway', 'FAILED', e.message);
  }
}

// -------------------------------------------------------------
// 3. Global Supervision Loop
// -------------------------------------------------------------
async function supervisionLoop() {
  if (state.isShuttingDown) return;

  // 1. Ollama Check / Start
  const ollamaOk = await checkOllama();
  if (!ollamaOk && state.ollama.state !== 'FAILED') {
    startOllama();
  }

  // 2. Python Compute Check / Start
  const pythonOk = await checkPython();
  if (!pythonOk && state.python.state !== 'FAILED') {
    startPython();
  }

  // 3. Gateway Check / Start
  const gatewayOk = await checkGateway();
  if (!gatewayOk && state.gateway.state !== 'FAILED') {
    startGateway();
  }
}

// Clean Shutdown Handler
function shutdown() {
  state.isShuttingDown = true;
  log('info', 'Supervisor received shutdown signal. Terminating child processes gracefully...');
  releaseSupervisorLock();
  if (state.gateway.process) {
    try { state.gateway.process.kill('SIGTERM'); } catch {}
  }
  if (state.python.process) {
    try { state.python.process.kill('SIGTERM'); } catch {}
  }
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('exit', releaseSupervisorLock);

log('info', '============================================================');
log('info', '  301 SUPER AI AGENTS — LOCAL STACK SUPERVISOR ACTIVE');
log('info', '  Problem Statement: SIH 26117 — Mangalore Refinery (MRPL)');
log('info', '  Local Website URI: http://127.0.0.1:8300/');
log('info', '  Python Compute URI: http://127.0.0.1:8305/');
log('info', '============================================================');

// Initial boot
supervisionLoop();

// Watchdog interval every 5 seconds
setInterval(supervisionLoop, 5000);
