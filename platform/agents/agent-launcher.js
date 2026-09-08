/**
 * Agent Launcher Module
 */
import { spawn } from 'node:child_process';
import { EventEmitter } from 'node:events';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { networkPolicy } from './network-policy.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../');
const LOGS_DIR = path.join(ROOT_DIR, 'runtime', 'logs', 'agents');
const REGISTRY_PATH = path.join(ROOT_DIR, 'registry', 'agent-integrations.json');

function loadRegistry() {
  try {
    return JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf-8'));
  } catch {
    return { integrations: [] };
  }
}

export class AgentLauncher extends EventEmitter {
  constructor() {
    super();
    this.processes = new Map();
    if (!fs.existsSync(LOGS_DIR)) {
      fs.mkdirSync(LOGS_DIR, { recursive: true });
    }
  }

  launchAgent(agentId, options = {}) {
    if (this.processes.has(agentId)) {
      throw new Error(`Agent ${agentId} is already running.`);
    }

    const registry = loadRegistry();
    const agent = registry.integrations.find(a => a.id === agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found in registry.`);
    }

    const workspaceDir = path.join(ROOT_DIR, agent.workspace_dir);
    if (!fs.existsSync(workspaceDir)) {
      fs.mkdirSync(workspaceDir, { recursive: true });
    }

    const logFile = path.join(LOGS_DIR, `${agent.name.replace(/\s+/g, '_').toLowerCase()}.log`);
    const logStream = fs.createWriteStream(logFile, { flags: 'a' });

    let env = { ...process.env, ...options.env };
    env = networkPolicy.enforceOnProcess(env);

    const child = spawn(agent.binary_name, options.args || [], {
      cwd: workspaceDir,
      env: env,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    child.stdout.pipe(logStream);
    child.stderr.pipe(logStream);

    this.processes.set(agentId, {
      process: child,
      startTime: Date.now(),
      status: 'RUNNING'
    });

    child.on('error', (err) => {
      this.emit('error', agentId, err);
      if (logStream.writable) {
        logStream.write(`[ERROR] ${err.message}\n`);
      }
    });

    child.on('exit', (code, signal) => {
      this.processes.delete(agentId);
      this.emit('exit', agentId, code, signal);
      if (logStream.writable) {
        logStream.write(`[EXIT] Code: ${code}, Signal: ${signal}\n`);
        logStream.end();
      }
    });

    return child.pid;
  }

  stopAgent(agentId) {
    const entry = this.processes.get(agentId);
    if (!entry) return false;

    const { process: child } = entry;
    child.kill('SIGTERM');
    entry.status = 'STOPPING';

    const timeout = setTimeout(() => {
      if (this.processes.has(agentId)) {
        child.kill('SIGKILL');
      }
    }, 5000);

    child.once('exit', () => clearTimeout(timeout));
    return true;
  }

  getAgentStatus(agentId) {
    const entry = this.processes.get(agentId);
    if (!entry) return null;
    return {
      pid: entry.process.pid,
      status: entry.status,
      uptime: Date.now() - entry.startTime
    };
  }

  getRunningAgents() {
    const running = [];
    for (const [agentId, entry] of this.processes.entries()) {
      running.push({
        agentId,
        pid: entry.process.pid,
        status: entry.status,
        uptime: Date.now() - entry.startTime
      });
    }
    return running;
  }
}

export const agentLauncher = new AgentLauncher();
