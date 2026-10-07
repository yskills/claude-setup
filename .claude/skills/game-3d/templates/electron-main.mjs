// Electron entry for a three.js game on Steam. Steam features come from steamworks.js in this
// process; the game talks to them through src/platform/steam.ts over the preload bridge.
// The game loads over file://, so vite.config sets `base: './'` (the Worker web build keeps '/').
// package.json: "main": "electron/main.mjs", steamworks.js in dependencies.
import { app, BrowserWindow } from 'electron'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
let steam = null
try {
  const sw = await import('steamworks.js')
  steam = sw.init() // reads steam_appid.txt next to the executable in dev
  sw.electronEnableSteamOverlay()
} catch (e) {
  console.warn('Steam not running, platform falls back to web stubs:', e.message)
}

// Steam on Linux starts Electron without a setuid chrome-sandbox; without this flag it won't open.
if (process.platform === 'linux') app.commandLine.appendSwitch('no-sandbox')

app.whenReady().then(() => {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    fullscreen: !process.env.GAME_WINDOWED,
    webPreferences: { preload: join(here, 'preload.mjs'), sandbox: false },
  })
  win.loadFile(join(here, '..', 'dist', 'index.html'))
})
app.on('window-all-closed', () => app.quit())
export { steam }
