import os from 'node:os';
import { execSync } from 'node:child_process';
import { HealthManager } from './health-manager.js';
import { DesktopConfig } from './config.js';

export class SystemDiagnostics {
  static getHardwareInfo() {
    const cpus = os.cpus() || [];
    const cpuModel = cpus[0]?.model || 'Unknown CPU';
    const cpuCores = cpus.length;
    const totalMemGb = Number((os.totalmem() / (1024 ** 3)).toFixed(2));
    const freeMemGb = Number((os.freemem() / (1024 ** 3)).toFixed(2));

    let gpuInfo = 'GPU detection pending';
    let vramInfo = 'VRAM detection pending';

    if (process.platform === 'win32') {
      try {
        const cmd = 'powershell -NoProfile -Command "(Get-CimInstance Win32_VideoController | Select-Object -First 1 Name, AdapterRAM) | ConvertTo-Json"';
        const raw = execSync(cmd, { encoding: 'utf8', timeout: 4000 });
        const data = JSON.parse(raw);
        if (data.Name) gpuInfo = data.Name;
        if (data.AdapterRAM) {
          const vramMb = Math.round(data.AdapterRAM / (1024 * 1024));
          vramInfo = `${vramMb} MB`;
        }
      } catch {
        gpuInfo = 'DirectX / WMI fallback';
      }
    }

    return {
      cpu: { model: cpuModel, cores: cpuCores },
      ram: { totalGb: totalMemGb, freeGb: freeMemGb },
      gpu: { name: gpuInfo, vram: vramInfo },
      os: { platform: process.platform, release: os.release(), arch: os.arch() }
    };
  }

  static async generateReport() {
    const hardware = this.getHardwareInfo();
    const health = await HealthManager.getFullHealth();

    return {
      app: {
        name: DesktopConfig.appName,
        version: DesktopConfig.version,
        environment: DesktopConfig.isProduction ? 'production-desktop' : 'development-desktop',
        airGapped: true,
        externalEgress: 0
      },
      hardware,
      health,
      generatedAt: new Date().toISOString()
    };
  }
}
