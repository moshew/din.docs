const path = require('path')
const {app, BrowserWindow, } = require('electron')
const isDev = require('electron-is-dev');

const child = require('child_process').execFile;

function createWindow () {
	const mainWindow = new BrowserWindow({
		width:1920,
		webPreferences: {
			preload: path.join(__dirname, 'preload.js')
		},
		icon: path.join(__dirname, 'app_icon.png'),
		autoHideMenuBar: true,
		show: false
	})
	
	const ses = mainWindow.webContents.session
	ses.clearCache()

	mainWindow.loadURL(
    isDev
      ? 'http://localhost:3000'
      : `file://${path.join(__dirname, 'index.html')}`
	);
	
	mainWindow.once('ready-to-show', () => {
		mainWindow.maximize()
		mainWindow.show()
		
	})

	if (isDev) mainWindow.webContents.openDevTools({ mode: 'detach' });
	require("./ipcHandler.js").register(mainWindow);
}

app.whenReady().then(() => {
	createWindow()
	app.on('activate', function () {
		if (BrowserWindow.getAllWindows().length === 0) createWindow()
	})
})

app.on('window-all-closed', function () {
	if (process.platform !== 'darwin') {
		app.quit();
	}
})