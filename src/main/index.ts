import { app, BrowserWindow, dialog } from 'electron'
import { join } from 'path'

// Catch all uncaught errors BEFORE any other imports
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err)
  try {
    dialog.showErrorBox('启动错误', err.message || String(err))
  } catch {}
})

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err)
})

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    title: '群小猴',
    icon: join(__dirname, '../../resources/icon.png'),
    webPreferences: {
      preload: join(__dirname, '../preload/index.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false
    }
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
  mainWindow.webContents.openDevTools()
}

app.whenReady().then(async () => {
  try {
    const { registerIpcHandlers } = await import('./ipc')
    const { initDatabase, getEnabledMonitorConfigs } = await import('./services/db')
    const { stopAllMonitors, startGroupMonitor } = await import('./services/monitor')

    await initDatabase()
    registerIpcHandlers()
    createWindow()

    // Restore enabled monitors from DB
    try {
      const win = BrowserWindow.getAllWindows()[0]
      if (win) {
        const configs = getEnabledMonitorConfigs()
        for (const config of configs) {
          startGroupMonitor({
            groupName: config.groupName,
            prompt: config.prompt,
            intervalMs: config.intervalMs
          }, win)
        }
      }
    } catch (e) {
      console.error('Failed to restore monitors:', e)
    }
  } catch (err: any) {
    console.error('Startup failed:', err)
    dialog.showErrorBox('启动错误', err.message || String(err))
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', async () => {
  try {
    const { stopAllMonitors } = await import('./services/monitor')
    stopAllMonitors()
  } catch {}
  app.quit()
})
