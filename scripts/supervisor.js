import http from "node:http";
import { spawn, execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const LOG_DIR = path.join(ROOT, "logs");

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const SUPERVISOR_LOG = path.join(LOG_DIR, "supervisor.log");

function log(level, message, meta = {}) {
  const timestamp = new Date().toISOString();
  const entry = `[${timestamp}] [${level.toUpperCase()}] ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ""}\n`;
  fs.appendFileSync(SUPERVISOR_LOG, entry, "utf8");
  console.log(`[${level.toUpperCase()}] ${message}`);
}

const state = {
  ollama: { process: null, running: false, failures: 0, lastCheck: null },
  fleet: { process: null, running: false, failures: 0, lastCheck: null },
  gateway: { process: null, running: false, failures: 0, lastCheck: null },
  cloudflared: { process: null, running: false, failures: 0, lastCheck: null, lastRestartAttempt: 0, backoffDelayMs: 5000 },
  isShuttingDown: false
};

function pingUrl(url, timeoutMs = 3000) {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(url);
      const req = http.request(parsed, { method: "GET", timeout: timeoutMs }, (res) => {
        resolve(res.statusCode >= 200 && res.statusCode < 400);
      });
      req.on("error", () => resolve(false));
      req.on("timeout", () => {
        req.destroy();
        resolve(false);
      });
      req.end();
    } catch {
      resolve(false);
    }
  });
}

// 1. Ollama Controller
async function checkOllama() {
  const healthy = await pingUrl("http://127.0.0.1:11434/api/tags", 4000);
  state.ollama.running = healthy;
  state.ollama.lastCheck = new Date().toISOString();
  return healthy;
}

function startOllama() {
  if (state.isShuttingDown) return;
  log("info", "Starting local Ollama daemon...");
  try {
    const ollamaExe = process.env.LOCALAPPDATA 
      ? path.join(process.env.LOCALAPPDATA, "Programs", "Ollama", "ollama.exe")
      : "ollama";

    const child = spawn(ollamaExe, ["serve"], {
      detached: true,
      stdio: "ignore"
    });
    child.unref();
    state.ollama.process = child;
    log("info", "Ollama daemon spawned");
  } catch (err) {
    log("error", `Failed to spawn Ollama: ${err.message}`);
  }
}

// 2. Fleet Controller
async function checkFleet() {
  // Test a representative agent (e.g. Agent 002 on 8102)
  const healthy = await pingUrl("http://127.0.0.1:8102/api/health", 3000);
  state.fleet.running = healthy;
  state.fleet.lastCheck = new Date().toISOString();
  return healthy;
}

function startFleet() {
  if (state.isShuttingDown) return;
  log("info", "Starting local 100-Agent Fleet runner...");
  try {
    const fleetScript = path.join(ROOT, "scripts", "run-fleet.js");
    const child = spawn(process.execPath, [fleetScript], {
      cwd: ROOT,
      detached: false,
      stdio: "pipe"
    });

    child.stdout.on("data", (d) => {
      // Log critical fleet milestones
      const str = d.toString();
      if (str.includes("Gateway") || str.includes("online") || str.includes("Error")) {
        fs.appendFileSync(path.join(LOG_DIR, "fleet.log"), str);
      }
    });

    child.on("exit", (code, signal) => {
      state.fleet.running = false;
      log("warn", `Fleet runner exited with code ${code}, signal ${signal}`);
      if (!state.isShuttingDown) {
        state.fleet.failures++;
        setTimeout(startFleet, 2000);
      }
    });

    state.fleet.process = child;
    log("info", `Fleet runner process started (PID ${child.pid})`);
  } catch (err) {
    log("error", `Failed to start fleet runner: ${err.message}`);
  }
}

// 3. Gateway Controller
async function checkGateway() {
  const healthy = await pingUrl("http://127.0.0.1:8300/api/info", 3000);
  state.gateway.running = healthy;
  state.gateway.lastCheck = new Date().toISOString();
  return healthy;
}

function startGateway() {
  if (state.isShuttingDown) return;
  log("info", "Starting SA-S03 API Gateway...");
  try {
    const gatewayScript = path.join(ROOT, "platform", "gateway", "src", "server.js");
    const child = spawn(process.execPath, [gatewayScript], {
      cwd: ROOT,
      detached: false,
      stdio: "pipe",
      env: { ...process.env, PORT: "8300" }
    });

    child.on("exit", (code, signal) => {
      state.gateway.running = false;
      log("warn", `Gateway process exited with code ${code}, signal ${signal}`);
      if (!state.isShuttingDown) {
        state.gateway.failures++;
        setTimeout(startGateway, 1500);
      }
    });

    state.gateway.process = child;
    log("info", `Gateway process started (PID ${child.pid})`);
  } catch (err) {
    log("error", `Failed to start gateway: ${err.message}`);
  }
}

// 4. Cloudflared Controller with Bounded Retries & Exponential Backoff
async function checkCloudflared() {
  let isRunning = false;

  // 1. Check process list using tasklist (fast and unprivileged)
  try {
    const tasklistOut = execSync('tasklist /FI "IMAGENAME eq cloudflared.exe" /FO CSV /NH', {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "ignore"],
      timeout: 3000
    });
    if (tasklistOut.toLowerCase().includes("cloudflared.exe")) {
      isRunning = true;
    }
  } catch {
    // tasklist query fallback
  }

  // 2. Check Windows Service if process was not found
  if (!isRunning) {
    try {
      const scOut = execSync('sc query "Cloudflared"', {
        encoding: "utf8",
        stdio: ["pipe", "pipe", "ignore"],
        timeout: 3000
      });
      if (scOut.includes("RUNNING") || scOut.includes("STATE              : 4  RUNNING")) {
        isRunning = true;
      }
    } catch {
      // Service query fallback
    }
  }

  state.cloudflared.running = isRunning;
  state.cloudflared.lastCheck = new Date().toISOString();

  if (isRunning) {
    // Reset failure counter and backoff interval when healthy
    state.cloudflared.failures = 0;
    state.cloudflared.backoffDelayMs = 5000;
  }

  return isRunning;
}

function startCloudflared() {
  if (state.isShuttingDown) return;

  const now = Date.now();
  const timeSinceLastAttempt = now - state.cloudflared.lastRestartAttempt;

  // Enforce bounded backoff to prevent restart loops
  if (state.cloudflared.lastRestartAttempt > 0 && timeSinceLastAttempt < state.cloudflared.backoffDelayMs) {
    const remainingSec = Math.ceil((state.cloudflared.backoffDelayMs - timeSinceLastAttempt) / 1000);
    log("info", `Cloudflared restart backoff active (next attempt in ${remainingSec}s, failures: ${state.cloudflared.failures})`);
    return;
  }

  state.cloudflared.lastRestartAttempt = now;
  state.cloudflared.failures++;
  // Exponential backoff capped at 60 seconds (5s, 10s, 20s, 40s, 60s)
  state.cloudflared.backoffDelayMs = Math.min(60000, 5000 * Math.pow(2, Math.min(state.cloudflared.failures, 4)));

  log("warn", `Initiating Cloudflared restart (attempt ${state.cloudflared.failures}, backoff: ${state.cloudflared.backoffDelayMs / 1000}s)...`);

  // Attempt 1: Start Windows Service
  try {
    execSync('net start Cloudflared', {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "ignore"],
      timeout: 5000
    });
    log("info", "Cloudflared Windows Service start command issued successfully");
    return;
  } catch (svcErr) {
    // Service start failed or not configured as service, fallback to binary execution
  }

  // Attempt 2: Spawn cloudflared executable directly if available
  try {
    const searchPaths = [
      "cloudflared",
      path.join(process.env.ProgramFiles || "C:\\Program Files", "cloudflared", "cloudflared.exe"),
      path.join(process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)", "cloudflared", "cloudflared.exe"),
      path.join(process.env.LOCALAPPDATA || "", "Programs", "cloudflared", "cloudflared.exe"),
      "C:\\cloudflared\\cloudflared.exe"
    ];

    let targetExe = "cloudflared";
    for (const p of searchPaths) {
      if (p !== "cloudflared" && fs.existsSync(p)) {
        targetExe = p;
        break;
      }
    }

    const child = spawn(targetExe, ["tunnel", "run"], {
      detached: true,
      stdio: "ignore"
    });
    child.unref();
    state.cloudflared.process = child;
    log("info", `Cloudflared tunnel process spawned (${targetExe}, PID ${child.pid})`);
  } catch (procErr) {
    log("error", `Failed to spawn Cloudflared executable: ${procErr.message}`);
  }
}

// Supervisor Heartbeat Monitor
async function monitorLoop() {
  if (state.isShuttingDown) return;

  try {
    // 1. Ollama Health
    const ollamaOk = await checkOllama();
    if (!ollamaOk) {
      log("warn", "Ollama unreachable, attempting restart...");
      startOllama();
    }

    // 2. Gateway Health
    const gatewayOk = await checkGateway();
    if (!gatewayOk && (!state.gateway.process || state.gateway.process.killed)) {
      log("warn", "Gateway unreachable, attempting restart...");
      startGateway();
    }

    // 3. Fleet Health
    const fleetOk = await checkFleet();
    if (!fleetOk && (!state.fleet.process || state.fleet.process.killed)) {
      log("warn", "Agent fleet unreachable, attempting restart...");
      startFleet();
    }

    // 4. Cloudflare Tunnel Health
    const cloudflaredOk = await checkCloudflared();
    if (!cloudflaredOk) {
      log("warn", "Cloudflared process/service not active, initiating recovery...");
      startCloudflared();
    }
  } catch (err) {
    log("error", `Monitor loop encountered exception: ${err.message}`);
  }
}

// Graceful Shutdown
function shutdown(signal) {
  if (state.isShuttingDown) return;
  state.isShuttingDown = true;
  log("info", `Received ${signal}, commencing graceful supervisor shutdown...`);

  if (state.gateway.process) {
    try { state.gateway.process.kill(); } catch {}
  }
  if (state.fleet.process) {
    try { state.fleet.process.kill(); } catch {}
  }
  if (state.cloudflared.process) {
    try { state.cloudflared.process.kill(); } catch {}
  }

  log("info", "All supervised child processes halted. Exiting cleanly.");
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

// Main Supervisor Bootstrap
async function main() {
  log("info", "==================================================");
  log("info", "SA-S03 Educational Platform Supervisor Starting...");
  log("info", "==================================================");

  // 1. Check/Start Ollama
  const ollamaReady = await checkOllama();
  if (!ollamaReady) {
    startOllama();
    // Wait up to 10s for Ollama
    for (let i = 0; i < 10; i++) {
      await new Promise(r => setTimeout(r, 1000));
      if (await checkOllama()) break;
    }
  }
  log("info", "Ollama status verified");

  // 2. Start Gateway
  startGateway();
  await new Promise(r => setTimeout(r, 1000));

  // 3. Start Fleet
  startFleet();
  await new Promise(r => setTimeout(r, 2000));

  // 4. Check/Start Cloudflared Tunnel
  const cfReady = await checkCloudflared();
  if (!cfReady) {
    log("info", "Cloudflared not running on startup, initiating start...");
    startCloudflared();
  } else {
    log("info", "Cloudflared verified active");
  }

  // Run Heartbeat every 5 seconds
  setInterval(monitorLoop, 5000);
  log("info", "Continuous supervisor monitor loop initialized (5000ms interval)");
}

main().catch(err => {
  log("error", `Fatal supervisor startup error: ${err.message}`);
  process.exit(1);
});
