const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktopAPI', {
  isDesktop: true,
  getVersion: () => ipcRenderer.invoke('system:get-version'),
  getHealth: () => ipcRenderer.invoke('system:get-health'),
  getDiagnostics: () => ipcRenderer.invoke('system:get-diagnostics'),
  restartServices: () => ipcRenderer.invoke('services:restart'),
  repairInstallation: () => ipcRenderer.invoke('services:repair'),
  openExternal: (url) => ipcRenderer.invoke('system:open-external', url),
  listAgentIntegrations: () => ipcRenderer.invoke('agents:list'),
  launchAgent: (agentId) => ipcRenderer.invoke('agents:launch', agentId),
  stopAgent: (agentId) => ipcRenderer.invoke('agents:stop', agentId),
  getNetworkPolicy: () => ipcRenderer.invoke('network:getPolicy'),
  setNetworkPolicy: (mode) => ipcRenderer.invoke('network:setPolicy', mode)
});
