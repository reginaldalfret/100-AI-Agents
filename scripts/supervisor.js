/**
 * Sovereign AI Workbench — Authoritative Windows Local AI Stack Supervisor
 * 
 * Manages Ollama (11434), Python Compute (8305), and Node Gateway (8300) with:
 * - Precise port & command-line ownership detection (Zero duplicate processes)
 * - Reuse of existing healthy services
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

function log(level, message, meta = {}) {
  const timestamp = new Date().toISOString();
  const metaStr = Object.keys(meta).length ? ' ' + JSON.stringify(meta) : '';
  const entry = `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}\n`;
  try {
    fs.appendFileSync(SUPERVISOR_LOG, entry, 'utf8');
  } catch {}
  console.log(`[${level.toUpperCase()}] ${message}`);
}

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

function pingUrl(url, timeoutMs = 2500) {
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
    const output = execSync(`powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess"`, {
      encoding: 'utf8',
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe']
    }).trim();
    if (!output) return null;
    const pid = parseInt(output.split(/\r?\n/)[0], 10);
    return isNaN(pid) ? null : pid;
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
  return lower.includes('100-ai-agents') || lower.includes('sovereign_compute') || lower.includes('super-ai');
}

function safelyKillPid(pid, serviceName) {
  if (!pid) return;
  try {
    const cmdLine = getProcessCommandLine(pid);
    if (isOurProjectProcess(cmdLine) || serviceName === 'gateway') {
      log('warn', `Terminating stale ${serviceName} process PID ${pid}`);
      execSync(`taskkill /PID ${pid} /F`, { windowsHide: true, stdio: 'ignore' });
    } else {
      log('warn', `Refusing to terminate external process PID ${pid} on ${serviceName} port`);
    }
  } catch {}
}

// 1. Ollama Controller
async function checkOllama() {
  const healthy = await pingUrl('http://127.0.0.1:11434/api/tags', 2500);
  state.ollama.running = healthy;
  if (healthy) {
    transitionState('ollama', 'READY');
    state.ollama.failures = 0;
  }
  return healthy;
}

function startOllama() {
  if (state.isShuttingDown || state.ollama.running) return;
  if (state.ollama.state === 'FAILED') return; // Stop retrying in terminal failure

  const now = Date.now();
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
      const p = spawn(ollamaExe, ['serve'], { detached: true, stdio: 'ignore' });
      p.unref();
      state.ollama.pid = p.pid;
    } catch (e) {
      log('error', `Failed to spawn Ollama: ${e.message}`);
    }
  } else {
    log('warn', `Ollama executable not found at ${ollamaExe}`);
  }
}

// 2. Python Compute Controller (Port 8305)
async function checkPython() {
  const healthy = await pingUrl('http://127.0.0.1:8305/health', 2500);
  if (healthy) {
    const pid = getPortOwningPid(8305);
    const cmdLine = pid ? getProcessCommandLine(pid) : '';
    if (cmdLine && !cmdLine.includes('Python311') && !cmdLine.includes('python311')) {
      log('info', `[PYTHON COMPUTE] Detected outdated python interpreter (PID ${pid}). Upgrading to Python 3.11 OCR runtime.`);
      if (pid) safelyKillPid(pid, 'python');
      state.python.running = false;
      return false;
    }
    state.python.running = true;
    transitionState('python', 'READY');
    state.python.failures = 0;
    if (pid) state.python.pid = pid;
  } else {
    state.python.running = false;
  }
  return healthy;
}

function startPython() {
  if (state.isShuttingDown || state.python.running) return;
  if (state.python.state === 'FAILED') return; // Stop retrying in terminal failure

  const existingPid = getPortOwningPid(8305);
  if (existingPid) {
    const cmdLine = getProcessCommandLine(existingPid);
    if (!isOurProjectProcess(cmdLine)) {
      transitionState('python', 'PORT_CONFLICT', `Port 8305 occupied by foreign PID ${existingPid}`);
      return;
    }
    // Stale our process that is not responding to /health -> terminate it
    safelyKillPid(existingPid, 'python');
  }

  const now = Date.now();
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
  const py311Path = 'C:\\Users\\ASUS\\AppData\\Local\\Programs\\Python\\Python311\\python.exe';
  const executable = fs.existsSync(py311Path) ? py311Path : 'py';
  const args = executable === 'py' ? ['-3.11', pythonScript] : [pythonScript];

  const logStream = fs.createWriteStream(PYTHON_LOG, { flags: 'a' });

  try {
    const venvDir = path.join(ROOT, 'platform', 'ocr', '.venv');
    const venvScripts = path.join(venvDir, 'Scripts');
    const pyProcess = spawn(executable, args, {
      cwd: ROOT,
      env: {
        ...process.env,
        VIRTUAL_ENV: venvDir,
        PATH: `${venvScripts};${path.dirname(py311Path)};${process.env.PATH}`,
        PYTHONPATH: `${pythonSrcDir};${path.join(ROOT, 'platform')};${path.join(venvDir, 'Lib', 'site-packages')}`,
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

// 3. Node Gateway Controller (Port 8300)
async function checkGateway() {
  const healthy = await pingUrl('http://127.0.0.1:8300/api/health', 2500);
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
  if (state.gateway.state === 'FAILED') return; // Stop retrying in terminal failure

  const existingPid = getPortOwningPid(8300);
  if (existingPid) {
    const cmdLine = getProcessCommandLine(existingPid);
    if (!isOurProjectProcess(cmdLine)) {
      transitionState('gateway', 'PORT_CONFLICT', `Port 8300 occupied by foreign PID ${existingPid}`);
      return;
    }
    // Stale our process not responding to /api/health -> terminate it
    safelyKillPid(existingPid, 'gateway');
  }

  const now = Date.now();
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

// Global Supervision Loop
async function supervisionLoop() {
  if (state.isShuttingDown) return;

  // 1. Ollama Check / Start
  const ollamaOk = await checkOllama();
  if (!ollamaOk && state.ollama.state !== 'FAILED') {
    startOllama();
  }

  // 2. Python Compute Check / Start
  const pythonOk = await checkPython();
  if (!pythonOk && state.python.state !== 'FAILED' && state.python.state !== 'PORT_CONFLICT') {
    startPython();
  }

  // 3. Gateway Check / Start
  const gatewayOk = await checkGateway();
  if (!gatewayOk && state.gateway.state !== 'FAILED' && state.gateway.state !== 'PORT_CONFLICT') {
    startGateway();
  }
}

// Clean Shutdown Handler
function shutdown() {
  state.isShuttingDown = true;
  log('info', 'Supervisor received shutdown signal. Terminating child processes gracefully...');
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
