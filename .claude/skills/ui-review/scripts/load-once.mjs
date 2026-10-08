#!/usr/bin/env node
// Fails when a page loads more than once in one visit. Three visits share one browser profile:
// the first, a second with the service worker in place, and the first after a deploy (a changed
// service worker script: the case where a PWA's `registerType: 'autoUpdate'` reloads the page
// a second after it appeared, Yland 2026-10-08). The browser goes through a small local proxy
// that can "deploy" a new sw.js, so it works on any build without redeploying.
//
//   node load-once.mjs <url> [settleSeconds=15]
//
// Use the lightest page of the app (no WebGL) when the main one is slow in headless Chromium:
// the service worker covers the whole origin.
import { execSync } from 'node:child_process'
import { createServer } from 'node:http'
import { mkdtempSync, rmSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import path, { join } from 'node:path'

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


if (!process.argv[2]) {
  console.error('usage: node load-once.mjs <url> [settleSeconds=15]')
  process.exit(2)
}
const target = new URL(process.argv[2])
const settleMs = Number(process.argv[3] ?? 15) * 1000
const SW_SCRIPT = /\/(sw|service-worker)\.js$/
let deployMark = ''

// Forwards every request to the target; after a "deploy" the service worker script differs by
// one comment, which is all a browser needs to install it as an update.
const proxy = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, target)
    const isNewWorker = deployMark && SW_SCRIPT.test(url.pathname)
    const headers = { ...req.headers, host: target.host, 'accept-encoding': 'identity' }
    // The changed script must come back whole, not as "not modified".
    if (isNewWorker) for (const name of ['if-none-match', 'if-modified-since']) delete headers[name]
    const upstream = await fetch(url, {
      method: req.method,
      headers,
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : req,
      duplex: 'half',
      redirect: 'manual',
    })
    const passed = Object.fromEntries([...upstream.headers].filter(([name]) => !['content-length', 'content-encoding', 'transfer-encoding', 'etag', 'last-modified'].includes(name) || !isNewWorker && ['etag', 'last-modified'].includes(name)))
    let body = Buffer.from(await upstream.arrayBuffer())
    if (isNewWorker) body = Buffer.concat([Buffer.from(`// ${deployMark}\n`), body])
    res.writeHead(upstream.status, passed).end(body)
  } catch (error) {
    res.writeHead(502).end(String(error))
  }
})
await new Promise(resolve => proxy.listen(0, '127.0.0.1', resolve))
const start = new URL(target.pathname + target.search, `http://127.0.0.1:${proxy.address().port}`)

const profile = mkdtempSync(join(tmpdir(), 'single-load-'))
const executablePath = process.env.PLAYWRIGHT_BROWSERS_PATH === '/opt/pw-browsers' ? '/opt/pw-browsers/chromium' : undefined

async function visit(name) {
  const context = await chromium.launchPersistentContext(profile, { executablePath, headless: true, viewport: { width: 390, height: 844 } })
  const page = context.pages()[0] ?? await context.newPage()
  let loads = 0
  page.on('request', request => {
    if (request.isNavigationRequest() && request.frame() === page.mainFrame()) loads += 1
  })
  await page.goto(start.href, { waitUntil: 'load' })
  await page.waitForTimeout(settleMs)
  await context.close()
  console.log(`${loads === 1 ? 'ok  ' : 'FAIL'} ${name}: the page loaded ${loads} time(s)`)
  return loads === 1
}

let ok = false
try {
  const first = await visit('first visit')
  const second = await visit('second visit')
  deployMark = `deploy ${Date.now()}`
  const afterDeploy = await visit('first visit after a deploy')
  ok = first && second && afterDeploy
} finally {
  proxy.close()
  rmSync(profile, { recursive: true, force: true })
}
process.exit(ok ? 0 : 1)
