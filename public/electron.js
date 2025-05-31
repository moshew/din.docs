import path from 'path';
import { fileURLToPath } from 'url';
import { app, BrowserWindow, screen } from 'electron';
import Splashscreen from '@trodi/electron-splashscreen';
import isDev from 'electron-is-dev';
import { register } from './ipcHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  const splashScreenOptions = {
    windowOpts: {
      width,
      height,
			frame: false,
			alwaysOnTop: false,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
				contextIsolation: true,
        nodeIntegration: false
				
      },
      icon: path.join(__dirname, 'app_icon.png'),
      autoHideMenuBar: false,
    },
    templateUrl: path.join(__dirname, 'splash.html'),
    splashScreenOpts: {
      alwaysOnTop: false,
      width: 938,
      height: 469,
    },
    delay: 0,
    minVisible: 1200,
  };

  const mainWindow = Splashscreen.initSplashScreen(splashScreenOptions);

  mainWindow.webContents.session.clearCache();
  mainWindow.loadURL(isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, 'index.html')}`);

  mainWindow.once('ready-to-show', () => {
    setTimeout(() => {
      //mainWindow.maximize();
    }, 0);
  });

  if (isDev) mainWindow.webContents.openDevTools({ mode: 'detach' });
  register(mainWindow);
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});