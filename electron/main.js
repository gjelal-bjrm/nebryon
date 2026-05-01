const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const { createServer } = require('http')
const { parse } = require('url')
const path = require('path')
const fs = require('fs').promises

const isDev = !app.isPackaged

let mainWindow
let isQuitting = false

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    title: 'Nebryon Hub',
    show: false,
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000')
  } else {
    const next = require('next')
    const projectRoot = path.join(__dirname, '..')
    const nextApp = next({ dev: false, dir: projectRoot })
    const handle = nextApp.getRequestHandler()

    await nextApp.prepare()

    const server = createServer((req, res) => {
      const parsedUrl = parse(req.url, true)
      handle(req, res, parsedUrl)
    })

    await new Promise((resolve) => server.listen(3001, '127.0.0.1', resolve))
    mainWindow.loadURL('http://127.0.0.1:3001')

    mainWindow.on('closed', () => { server.close() })
  }

  mainWindow.once('ready-to-show', () => { mainWindow.show() })
  mainWindow.on('closed', () => { mainWindow = null })
}

/* ── IPC: folder picker ─────────────────────────────────── */
ipcMain.handle('orbit:pick-dir', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Choisir le dossier de backup Orbit',
    properties: ['openDirectory', 'createDirectory'],
    buttonLabel: 'Sélectionner ce dossier',
  })
  return result.canceled ? null : result.filePaths[0]
})

/* ── IPC: write file ────────────────────────────────────── */
ipcMain.handle('orbit:write-file', async (_event, { dir, filename, content }) => {
  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(path.join(dir, filename), content, 'utf-8')
})

/* ── IPC: renderer signals it's ready to quit ───────────── */
ipcMain.handle('orbit:quit-ready', () => {
  isQuitting = true
  app.quit()
})

/* ── Before quit: ask renderer to do a final backup ─────── */
app.on('before-quit', (event) => {
  if (isQuitting || !mainWindow) return

  // Prevent immediate quit — let renderer do backup first
  event.preventDefault()

  // Signal renderer
  mainWindow.webContents.send('orbit:before-quit')

  // Safety timeout: quit after 5s regardless
  setTimeout(() => {
    isQuitting = true
    app.quit()
  }, 5000)
})

/* ── App lifecycle ──────────────────────────────────────── */
app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (mainWindow === null) createWindow()
})
