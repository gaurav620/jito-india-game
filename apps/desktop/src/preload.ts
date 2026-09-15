import { contextBridge, ipcRenderer } from 'electron';

export interface ElectronAPI {
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  closeWindow: () => void;
  platform: string;
  isDesktop: boolean;
}

const api: ElectronAPI = {
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  closeWindow: () => ipcRenderer.send('window:close'),
  platform: process.platform,
  isDesktop: true,
};

contextBridge.exposeInMainWorld('electronAPI', api);
