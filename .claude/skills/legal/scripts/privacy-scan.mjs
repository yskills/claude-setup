#!/usr/bin/env node
// What a first-time visitor's browser does before they click anything: cookies, storage and
// third-party requests set without consent, plus whether each page links Impressum and
// Datenschutz. Exits 1 on failures: third-party cookies or requests on load, missing legal links.
// First-party cookies and storage are listed as notes: fine when strictly necessary (a session or
// cart), consent-bound otherwise, which only the plan can say.
//
//   node privacy-scan.mjs https://preview.example.workers.dev [/path ...]
import { execSync } from 'node:child_process'
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
  process.exit(2)
}

// Hosts that send visitor data to a third party on load. Each needs consent or self-hosting.
const KNOWN = [
  [/(^|\.)fonts\.(googleapis|gstatic)\.com$/, 'Google Fonts from Google: self-host the font (LG München I, 3 O 17493/20)'],
  [/(^|\.)(google-analytics|googletagmanager|doubleclick|googlesyndication)\.com$/, 'Google tracking/ads: only after consent'],
  [/(^|\.)(youtube(-nocookie)?\.com|ytimg\.com)$/, 'YouTube embed: two-click embed, load only after a click'],
  [/(^|\.)(facebook\.(com|net)|instagram\.com|tiktok\.com|twitter\.com|x\.com|linkedin\.com)$/, 'Social pixel/embed: only after consent'],
  [/(^|\.)maps\.(googleapis|gstatic)\.com$/, 'Google Maps: two-click embed'],
  [/(^|\.)(hotjar\.com|clarity\.ms|mouseflow\.com|fullstory\.com)$/, 'Session recording: only after consent'],
]

const [base, ...paths] = process.argv.slice(2)
if (!base) {
  console.error('Usage: node privacy-scan.mjs <url> [/path ...]')
  process.exit(2)
}
const urls = (paths.length ? paths : ['/']).map((p) => new URL(p, base).href)
const site = new URL(base).hostname
const sameSite = (host) => host === site || host.endsWith(`.${site}`) || site.endsWith(`.${host}`)

const { chromium } = loadPlaywright()
const executablePath = process.env.PLAYWRIGHT_BROWSERS_PATH === '/opt/pw-browsers' ? '/opt/pw-browsers/chromium' : undefined
const isLocal = /^https?:\/\/(127\.0\.0\.1|localhost|\[::1\])/.test(base)
const proxyServer = isLocal ? undefined : process.env.HTTPS_PROXY || process.env.https_proxy
const browser = await chromium.launch({
  ...(executablePath ? { executablePath } : {}),
  ...(proxyServer ? { proxy: { server: proxyServer } } : {}),
})

const findings = []
const notes = []
const storage = new Set()
const thirdParty = new Set()
try {
  const context = await browser.newContext()
  const page = await context.newPage()
  page.on('request', (r) => {
    const host = new URL(r.url()).hostname
    if (host && !sameSite(host)) thirdParty.add(host)
  })
  for (const url of urls) {
    const res = await page.goto(url, { waitUntil: 'networkidle' }).catch((e) => ({ error: e.message }))
    // goto returns null for same-document navigations; that page did load.
    if (res?.error || (res && !res.ok())) { findings.push(`${url}: did not load (${res.error ?? res.status()})`); continue }
    const keys = await page.evaluate(() => [...Object.keys(localStorage), ...Object.keys(sessionStorage)]).catch(() => [])
    for (const k of keys) storage.add(k)
    const links = await page.$$eval('a', (as) => as.map((a) => `${a.textContent} ${a.getAttribute('href')}`.toLowerCase()))
    if (!links.some((l) => /impressum|imprint/.test(l))) findings.push(`${url}: no Impressum link (§ 5 DDG: reachable from every page)`)
    if (!links.some((l) => /datenschutz|privacy/.test(l))) findings.push(`${url}: no Datenschutz link (Art. 13 DSGVO)`)
  }
  const cookies = await context.cookies()
  for (const c of cookies) {
    if (sameSite(c.domain.replace(/^\./, ''))) notes.push(`first-party cookie on load: ${c.name}. Strictly necessary? Otherwise consent first (§ 25 TDDDG)`)
    else findings.push(`third-party cookie on load: ${c.name} (${c.domain}). Needs consent first (§ 25 TDDDG)`)
  }
  for (const k of storage) notes.push(`storage on load: ${k}. Strictly necessary? § 25 TDDDG covers localStorage too`)
  for (const host of thirdParty) {
    const hit = KNOWN.find(([re]) => re.test(host))
    findings.push(`third-party request on load: ${host}${hit ? ` - ${hit[1]}` : ' - name it in the Datenschutzerklärung or self-host it'}`)
  }
} finally {
  await browser.close()
}

for (const n of notes) console.log(`note: ${n}`)
if (!findings.length) {
  console.log(`clean: ${urls.length} page(s), no third-party cookies or requests on load; legal links present`)
} else {
  console.log(findings.map((f) => `fail: ${f}`).join('\n'))
  process.exit(1)
}
