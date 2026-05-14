import { contextBridge, ipcRenderer } from 'electron';

// Expose a safe API to the renderer process via context bridge
contextBridge.exposeInMainWorld('wallgrab', {
  // Window controls
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  close: () => ipcRenderer.invoke('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:isMaximized'),

  // Folder picker
  selectFolder: () => ipcRenderer.invoke('dialog:selectFolder'),

  // Scraping (will be connected to Rust later)
  scrapeUrl: (url: string, pagesToScrape: number) => ipcRenderer.invoke('scrape:url', url, pagesToScrape),
  downloadWallpaper: (url: string, savePath: string, detailPageUrl?: string) =>
    ipcRenderer.invoke('download:wallpaper', url, savePath, detailPageUrl),
});
