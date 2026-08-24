import path from 'node:path';
import fs from 'node:fs';
import { DesktopConfig } from './config.js';
import { ProcessManager } from './process-manager.js';
import { HealthManager } from './health-manager.js';

export class ServiceSupervisor {
  constructor() {
    this.services = {
      ollama: { state: 'STOPPED', pid: null, retries: 0, crashTimestamps: [] },
      pythonCompute: { state: 'STOPPED', pid: null, retries: 0, crashTimestamps: [] },
      gateway: { state: 'STOPPED', pid: null, retries: 0, crashTimestamps: [] }
    };
    this.timer = null;
  }

  log(msg) {
    const line = `[${new Date().toISOString()}] [DESKTOP_SUPERVISOR] ${msg}`;
    console.log(line);
    try {
      const logFile = path.join(DesktopConfig.paths.logsDir, 'supervisor.log');
      fs.appendFileSync(logFile, line + '\n', 'utf8');
    } catch {}
  }

  async startAll() {
    this.log('Starting 301 Super AI background local service stack...');

    // 1. Ollama
    await this.ensureOllama();

    // 2. Python Compute
    await this.ensurePythonCompute();

    // 3. Node Gateway
    await this.ensureGateway();

    // Health verification loop
    this.startWatchdog();

    return await HealthManager.getFullHealth();
  }

  async ensureOllama() {
    const isOpen = await ProcessManager.isPortOpen(DesktopConfig.ports.ollama);
    if (isOpen) {
      this.log(`Ollama already running on port ${DesktopConfig.ports.ollama}. Reusing existing instance.`);
      this.services.ollama.state = 'READY';
      return;
    }

    this.log(`Starting Ollama on port ${DesktopConfig.ports.ollama}...`);
    const ollamaBin = ProcessManager.resolveBinary('ollama');
    try {
      ProcessManager.spawnDetached(ollamaBin, ['serve'], {
        env: { OLLAMA_HOST: `127.0.0.1:${DesktopConfig.ports.ollama}` }
      });
      this.services.ollama.state = 'STARTING';
    } catch (err) {
      this.log(`Failed to start Ollama: ${err.message}`);
      this.services.ollama.state = 'FAILED';
    }
  }

  async ensurePythonCompute() {
    const isOpen = await ProcessManager.isPortOpen(DesktopConfig.ports.pythonCompute);
    if (isOpen) {
      this.log(`Python Compute already running on port ${DesktopConfig.ports.pythonCompute}. Reusing existing instance.`);
      this.services.pythonCompute.state = 'READY';
      return;
    }

    this.log(`Starting Python Compute on port ${DesktopConfig.ports.pythonCompute}...`);
    const pythonBin = ProcessManager.resolveBinary('python');
    const serverScript = path.join(DesktopConfig.paths.projectRoot, 'platform/python-compute/src/sovereign_compute/server.py');

    try {
      ProcessManager.spawnDetached(pythonBin, [serverScript], {
        env: {
          SOVEREIGN_COMPUTE_HOST: '127.0.0.1',
          SOVEREIGN_COMPUTE_PORT: String(DesktopConfig.ports.pythonCompute),
          PYTHONPATH: path.join(DesktopConfig.paths.projectRoot, 'platform/python-compute/src')
        }
      });
      this.services.pythonCompute.state = 'STARTING';
    } catch (err) {
      this.log(`Failed to start Python Compute: ${err.message}`);
      this.services.pythonCompute.state = 'FAILED';
    }
  }

  async ensureGateway() {
    const isOpen = await ProcessManager.isPortOpen(DesktopConfig.ports.gateway);
    if (isOpen) {
      this.log(`Gateway already running on port ${DesktopConfig.ports.gateway}. Reusing existing instance.`);
      this.services.gateway.state = 'READY';
      return;
    }

    this.log(`Starting Gateway on port ${DesktopConfig.ports.gateway}...`);
    const nodeBin = ProcessManager.resolveBinary('node');
    const gatewayScript = path.join(DesktopConfig.paths.projectRoot, 'platform/gateway/src/server.js');

    try {
      ProcessManager.spawnDetached(nodeBin, [gatewayScript], {
        env: {
          PORT: String(DesktopConfig.ports.gateway),
          HOST: '127.0.0.1'
        }
      });
      this.services.gateway.state = 'STARTING';
    } catch (err) {
      this.log(`Failed to start Gateway: ${err.message}`);
      this.services.gateway.state = 'FAILED';
    }
  }

  startWatchdog() {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(async () => {
      const health = await HealthManager.getFullHealth();
      if (!health.services.gateway.ready && this.services.gateway.state !== 'FAILED') {
        await this.ensureGateway();
      }
      if (!health.services.pythonCompute.ready && this.services.pythonCompute.state !== 'FAILED') {
        await this.ensurePythonCompute();
      }
    }, DesktopConfig.timeouts.healthCheckIntervalMs);
  }

  stopWatchdog() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
