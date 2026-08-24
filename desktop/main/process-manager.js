import { spawn, execSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import net from 'node:net';
import { DesktopConfig } from './config.js';

export class ProcessManager {
  static resolveBinary(binName) {
    // 1. Check bundled runtime path
    const bundledPaths = [
      path.join(DesktopConfig.paths.resourcesDir, 'binaries', binName),
      path.join(DesktopConfig.paths.resourcesDir, 'binaries', binName + '.exe'),
      path.join(DesktopConfig.paths.projectRoot, 'binaries', binName),
      path.join(DesktopConfig.paths.projectRoot, 'binaries', binName + '.exe')
    ];

    for (const bp of bundledPaths) {
      if (fs.existsSync(bp)) return bp;
    }

    // 2. Fallback to system PATH in development
    return binName;
  }

  static async isPortOpen(port, host = '127.0.0.1') {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(800);
      socket.once('connect', () => {
        socket.destroy();
        resolve(true); // Port is occupied / open
      });
      socket.once('timeout', () => {
        socket.destroy();
        resolve(false);
      });
      socket.once('error', () => {
        resolve(false);
      });
      socket.connect(port, host);
    });
  }

  static getPortOwner(port) {
    if (process.platform !== 'win32') return null;
    try {
      const cmd = `powershell -NoProfile -Command "(Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty OwningProcess)"`;
      const pidStr = execSync(cmd, { encoding: 'utf8', timeout: 3000 }).trim();
      const pid = parseInt(pidStr, 10);
      if (pid && !isNaN(pid) && pid > 0) {
        let name = 'Unknown';
        try {
          const nameCmd = `powershell -NoProfile -Command "(Get-Process -Id ${pid} -ErrorAction SilentlyContinue).ProcessName"`;
          name = execSync(nameCmd, { encoding: 'utf8', timeout: 3000 }).trim() || 'Unknown';
        } catch {}
        return { pid, name };
      }
    } catch {}
    return null;
  }

  static spawnDetached(command, args, options = {}) {
    const child = spawn(command, args, {
      cwd: options.cwd || DesktopConfig.paths.projectRoot,
      env: { ...process.env, ...options.env },
      detached: options.detached !== false,
      stdio: options.stdio || ['ignore', 'pipe', 'pipe'],
      shell: options.shell || false
    });

    if (child.stdout && options.onLog) {
      child.stdout.on('data', d => options.onLog(d.toString()));
    }
    if (child.stderr && options.onLog) {
      child.stderr.on('data', d => options.onLog(d.toString()));
    }

    if (options.detached !== false && typeof child.unref === 'function') {
      child.unref();
    }

    return child;
  }
}
