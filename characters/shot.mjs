import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs'
const [port, files, out, yaw = '0', w = '1600', h = '900'] = process.argv.slice(2)
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] })
const p = await b.newPage({ viewport: { width: +w, height: +h } })
p.on('pageerror', (e) => console.log('pageerror', e.message))
await p.goto(`http://127.0.0.1:${port}/index.html?m=${files}&yaw=${yaw}${process.env.P ? "&p=1" : ""}`)
await p.waitForFunction(() => document.title !== '', null, { timeout: 120000 })
console.log(await p.title()); await p.screenshot({ path: out }); await b.close()
