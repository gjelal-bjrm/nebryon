const { app, BrowserWindow } = require('electron')
const { createServer } = require('http')
const { parse } = require('url')
const path = require('path')

const isDev = !app.isPackaged

let mainWindow

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    title: 'Nebryon Hub',
    show: false,
  })

  if (isDev) {
    // En dev : Next.js tourne déjà sur 3000, on pointe dessus directement
    mainWindow.loadURL('http://localhost:3000')
  } else {
    // En production : on démarre notre propre serveur Next.js
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

    mainWindow.on('closed', () => {
      server.close()
    })
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (mainWindow === null) createWindow()
})
