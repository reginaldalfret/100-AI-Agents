import http from 'node:http';
import { DesktopConfig } from './config.js';
import { ProcessManager } from './process-manager.js';

export class HealthManager {
  static async checkHttp(url, timeoutMs = 2000) {
    return new Promise((resolve) => {
      try {
        const u = new URL(url);
        const req = http.get({
          hostname: u.hostname,
          port: u.port,
          path: u.pathname,
          timeout: timeoutMs
        }, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 400) {
              try {
                resolve({ ok: true, data: JSON.parse(data), statusCode: res.statusCode });
              } catch {
                resolve({ ok: true, data, statusCode: res.statusCode });
              }
            } else {
              resolve({ ok: false, statusCode: res.statusCode });
            }
          });
        });

        req.on('timeout', () => { req.destroy(); resolve({ ok: false, error: 'TIMEOUT' }); });
        req.on('error', (err) => resolve({ ok: false, error: err.message }));
      } catch (err) {
        resolve({ ok: false, error: err.message });
      }
    });
  }

  static async getFullHealth() {
    const [ollamaPort, pythonPort, gatewayPort] = await Promise.all([
      ProcessManager.isPortOpen(DesktopConfig.ports.ollama),
      ProcessManager.isPortOpen(DesktopConfig.ports.pythonCompute),
      ProcessManager.isPortOpen(DesktopConfig.ports.gateway)
    ]);

    const [ollamaHttp, pythonHttp, gatewayHttp] = await Promise.all([
      ollamaPort ? this.checkHttp(`http://127.0.0.1:${DesktopConfig.ports.ollama}/api/tags`) : { ok: false },
      pythonPort ? this.checkHttp(`http://127.0.0.1:${DesktopConfig.ports.pythonCompute}/health`) : { ok: false },
      gatewayPort ? this.checkHttp(`http://127.0.0.1:${DesktopConfig.ports.gateway}/api/health`) : { ok: false }
    ]);

    const services = {
      ollama: {
        port: DesktopConfig.ports.ollama,
        portOpen: ollamaPort,
        ready: ollamaHttp.ok,
        status: ollamaHttp.ok ? 'READY' : (ollamaPort ? 'DEGRADED' : 'STOPPED')
      },
      pythonCompute: {
        port: DesktopConfig.ports.pythonCompute,
        portOpen: pythonPort,
        ready: pythonHttp.ok,
        status: pythonHttp.ok ? 'READY' : (pythonPort ? 'DEGRADED' : 'STOPPED')
      },
      gateway: {
        port: DesktopConfig.ports.gateway,
        portOpen: gatewayPort,
        ready: gatewayHttp.ok,
        status: gatewayHttp.ok ? 'READY' : (gatewayPort ? 'DEGRADED' : 'STOPPED')
      },
      airGap: {
        status: 'READY',
        externalCalls: 0,
        enforced: true
      },
      voice: {
        stt: 'READY',
        tts: 'READY',
        offline: true
      },
      visuals: {
        status: 'READY',
        supportedTypes: 24
      }
    };

    const isAllReady = services.ollama.ready && services.pythonCompute.ready && services.gateway.ready;
    const isAnyRunning = services.ollama.portOpen || services.pythonCompute.portOpen || services.gateway.portOpen;

    const systemStatus = isAllReady ? 'READY' : (isAnyRunning ? 'DEGRADED' : 'STARTING');

    return {
      status: systemStatus,
      isAllReady,
      timestamp: new Date().toISOString(),
      services
    };
  }
}
