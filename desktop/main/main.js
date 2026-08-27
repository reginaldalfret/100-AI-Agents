import { app, BrowserWindow, Tray, Menu, ipcMain } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DesktopConfig } from './config.js';
import { ServiceSupervisor } from './service-supervisor.js';
import { HealthManager } from './health-manager.js';
import { SystemDiagnostics } from './diagnostics.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow = null;
let splashWindow = null;
let tray = null;
const supervisor = new ServiceSupervisor();

// Single-Instance Lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 540,
    height: 380,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  splashWindow.loadFile(path.join(__dirname, '../splash/splash.html'));
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 850,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#090d16',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true
    }
  });

  mainWindow.loadURL(`http://127.0.0.1:${DesktopConfig.ports.gateway}/`);

  mainWindow.once('ready-to-show', () => {
    if (splashWindow) {
      splashWindow.close();
      splashWindow = null;
    }
    mainWindow.show();
  });

  mainWindow.on('close', (e) => {
    // Hide to tray instead of quitting if preferred
  });
}

function setupTray() {
  // Simple tray placeholder or menu
  const iconPath = path.join(__dirname, '../assets/icon.png');
  // tray setup can load icon if available
}

// IPC Handlers
ipcMain.handle('system:get-version', () => DesktopConfig.version);
ipcMain.handle('system:get-health', async () => await HealthManager.getFullHealth());
ipcMain.handle('system:get-diagnostics', async () => await SystemDiagnostics.generateReport());
ipcMain.handle('services:restart', async () => await supervisor.startAll());
ipcMain.handle('services:repair', async () => {
  await supervisor.startAll();
  return { repaired: true };
});

// Agent Integration IPC Handlers
ipcMain.handle('agents:list', async () => {
  try {
    const res = await fetch(`http://127.0.0.1:${DesktopConfig.ports.gateway}/api/agent-integrations`);
    return await res.json();
  } catch (e) { return { error: e.message }; }
});

ipcMain.handle('agents:launch', async (_, agentId) => {
  try {
    const res = await fetch(`http://127.0.0.1:${DesktopConfig.ports.gateway}/api/agent-integrations/${agentId}/launch`, { method: 'POST' });
    return await res.json();
  } catch (e) { return { error: e.message }; }
});

ipcMain.handle('agents:stop', async (_, agentId) => {
  try {
    const res = await fetch(`http://127.0.0.1:${DesktopConfig.ports.gateway}/api/agent-integrations/${agentId}/stop`, { method: 'POST' });
    return await res.json();
  } catch (e) { return { error: e.message }; }
});

ipcMain.handle('network:getPolicy', async () => {
  try {
    const res = await fetch(`http://127.0.0.1:${DesktopConfig.ports.gateway}/api/network-policy`);
    return await res.json();
  } catch (e) { return { error: e.message }; }
});

ipcMain.handle('network:setPolicy', async (_, mode) => {
  try {
    const res = await fetch(`http://127.0.0.1:${DesktopConfig.ports.gateway}/api/network-policy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode })
    });
    return await res.json();
  } catch (e) { return { error: e.message }; }
});

app.whenReady().then(async () => {
  createSplashWindow();

  // Start background services
  await supervisor.startAll();

  // Wait for Gateway to be ready
  let retries = 0;
  const checkInterval = setInterval(async () => {
    retries++;
    const health = await HealthManager.getFullHealth();
    if (health.services.gateway.ready || retries > 15) {
      clearInterval(checkInterval);
      createMainWindow();
    }
  }, 1000);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    supervisor.stopWatchdog();
    app.quit();
  }
});
