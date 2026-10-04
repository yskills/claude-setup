#!/usr/bin/env node
// Screenshot pages at phone and desktop size.
//
//   node shoot.mjs [--base URL] [--out DIR] [--only phone|desktop] [--full] [--wait MS] [path-or-url ...]
//
// Defaults: base http://localhost:5173, out ./.shots, paths "/". Absolute URLs are shot as-is.
// Adapted from luna-monorepo/.claude/scripts/shoot.mjs.
import { execSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'

function loadPlaywright() {
  const tries = [
    () => createRequire(path.join(process.cwd(), 'package.json'))('playwright'),
    () => createRequire(import.meta.url)('playwright'),
    () => createRequire(path.join(execSync('npm root -g', { encoding: 'utf8' }).trim(), 'x'))('playwright'),
    () => createRequire('/opt/node-tools/node_modules/x')('playwright'),
  ]
  for (const t of tries) {
    try { return t() } catch {}
  }
  console.error('Playwright not found. Install it once: npm i -g playwright && npx playwright install chromium')
  process.exit(1)
}
const { chromium } = loadPlaywright()

const VIEWPORTS = {
  phone: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  desktop: { width: 1440, height: 900, deviceScaleFactor: 1 },
}

const args = process.argv.slice(2)
let base = 'http://localhost:5173'
let out = '.shots'
let only = null
let fullPage = false
let wait = 400
const targets = []
for (let i = 0; i < args.length; i++) {
  const a = args[i]
  if (a === '--base') base = args[++i]
  else if (a === '--out') out = args[++i]
  else if (a === '--only') only = args[++i]
  else if (a === '--full') fullPage = true
  else if (a === '--wait') wait = Number(args[++i])
  else targets.push(a)
}
if (!targets.length) targets.push('/')
mkdirSync(out, { recursive: true })

const slug = (t) => t.replace(/^https?:\/\//, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'home'
const isLocal = (u) => /^https?:\/\/(127\.0\.0\.1|localhost|\[::1\])/.test(u)

// Cloud sessions keep Chromium in /opt/pw-browsers and route outbound traffic through a proxy.
const executablePath = process.env.PLAYWRIGHT_BROWSERS_PATH === '/opt/pw-browsers' ? '/opt/pw-browsers/chromium' : undefined
const urls = targets.map((t) => (/^https?:\/\//.test(t) ? t : new URL(t, base).href))
const proxyServer = urls.some((u) => !isLocal(u)) ? process.env.HTTPS_PROXY || process.env.https_proxy : undefined

const browser = await chromium.launch({
  ...(executablePath ? { executablePath } : {}),
  ...(proxyServer ? { proxy: { server: proxyServer } } : {}),
})
const saved = []
try {
  for (const [name, viewport] of Object.entries(VIEWPORTS)) {
    if (only && only !== name) continue
    const context = await browser.newContext({
      viewport, deviceScaleFactor: viewport.deviceScaleFactor, isMobile: viewport.isMobile, hasTouch: viewport.hasTouch,
    })
    const page = await context.newPage()
    const errors = []
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
    page.on('pageerror', (e) => errors.push(String(e)))
    for (let i = 0; i < targets.length; i++) {
      await page.goto(urls[i], { waitUntil: 'networkidle' }).catch((e) => errors.push(`goto ${urls[i]}: ${e.message}`))
      await page.waitForTimeout(wait)
      // Let one-shot animations finish so shots show the settled screen; loops are ignored.
      await page.waitForFunction(() => document.getAnimations().every((a) =>
        a.playState === 'finished' || a.effect?.getTiming().iterations === Infinity), null, { timeout: 5000 }).catch(() => {})
      const file = path.join(out, `${slug(targets[i])}-${name}.png`)
      await page.screenshot({ path: file, fullPage })
      saved.push(file)
    }
    if (errors.length) console.warn(`[${name}] console errors:\n  ${errors.join('\n  ')}`)
    await context.close()
  }
} finally {
  await browser.close()
}
console.log(saved.join('\n'))
