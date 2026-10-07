// Screenshots of a three.js game in a cloud thread: fixed clock and seed, the scene's camera spots,
// phone and desktop. Usage: node shots.mjs <url> <outDir>   (spots: ?spot=<name> handled by the game)
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const [url = 'http://localhost:5173', out = '.shots'] = process.argv.slice(2)
const SPOTS = ['entrance', 'desk', 'window']
const SIZES = { phone: { width: 390, height: 844 }, desktop: { width: 1440, height: 900 } }
const FIXED_TIME = 1760000000 // same light every run

mkdirSync(out, { recursive: true })
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
})
for (const [name, viewport] of Object.entries(SIZES)) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 })
  for (const spot of SPOTS) {
    await page.goto(`${url}?t=${FIXED_TIME}&seed=1&spot=${spot}`)
    await page.waitForFunction(() => window.__gameReady === true, null, { timeout: 60_000 })
    await page.screenshot({ path: `${out}/${spot}-${name}.png` })
  }
  await page.close()
}
await browser.close()
