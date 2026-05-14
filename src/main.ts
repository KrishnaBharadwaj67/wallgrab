import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';

// Import the native Rust addon using an absolute path to avoid Vite bundler issues
const nativeDir = app.isPackaged
  ? path.join(process.resourcesPath, 'native')
  : path.join(app.getAppPath(), 'native');
const wallgrabNative = require(path.join(nativeDir, 'index.js'));

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    transparent: false,
    backgroundColor: '#0a0e17',
    titleBarStyle: 'hidden',
    titleBarOverlay: false,
    icon: undefined,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  // Load the app
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  // Open DevTools in development
  // if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
  //   mainWindow.webContents.openDevTools({ mode: 'detach' });
  // }
};

// ─── IPC Handlers ────────────────────────────────────────────────────────────

// Window controls
ipcMain.handle('window:minimize', () => {
  mainWindow?.minimize();
});

ipcMain.handle('window:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

ipcMain.handle('window:close', () => {
  mainWindow?.close();
});

ipcMain.handle('window:isMaximized', () => {
  return mainWindow?.isMaximized() ?? false;
});

// Folder picker
ipcMain.handle('dialog:selectFolder', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory'],
    title: 'Choose Download Folder',
  });
  if (result.canceled) return null;
  return result.filePaths[0];
});

// Scraping
ipcMain.handle('scrape:url', async (_, url: string, pagesToScrape: number) => {
  try {
    return await wallgrabNative.scrapeUrl(url, pagesToScrape);
  } catch (err) {
    console.error('Error in scrapeUrl:', err);
    throw err;
  }
});

// Downloading
ipcMain.handle('download:wallpaper', async (_, url: string, savePath: string, detailPageUrl?: string) => {
  try {
    return await wallgrabNative.downloadWallpaper(url, savePath, detailPageUrl || null);
  } catch (err) {
    console.error('Error in downloadWallpaper:', err);
    throw err;
  }
});

// ─── App lifecycle ───────────────────────────────────────────────────────────

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
