// Deploys to Cloudflare from GitHub Actions. Idempotent: creates the D1 database on first run,
// copies the runtime keys from the CI environment into Worker secrets, and gives Stripe a fresh
// webhook endpoint each deploy. Needs CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID; every key
// in RUNTIME_KEYS is optional. Based on yskills/duo-test; set the names below to wrangler.jsonc's.
import { spawnSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import Stripe from 'stripe'

const WORKER = 'shop'
const DB_NAME = 'shop'
const RUNTIME_KEYS = ['STRIPE_SECRET_KEY', 'SENDCLOUD_PUBLIC_KEY', 'SENDCLOUD_SECRET_KEY', 'RESEND_API_KEY']
/** Random secrets made once and never shown, e.g. BETTER_AUTH_SECRET when the app has logins. */
const GENERATED = []
const WEBHOOK_EVENTS = [
  'checkout.session.completed',
  'checkout.session.async_payment_succeeded',
  'checkout.session.async_payment_failed',
  'checkout.session.expired',
  'charge.refunded',
  'charge.dispute.created',
]

// Wrangler gets the Cloudflare credentials, not the shop's keys; secret values go in via stdin.
const wranglerEnv = Object.fromEntries(Object.entries(process.env).filter(([name]) => !RUNTIME_KEYS.includes(name)))

function wrangler(args, input) {
  const run = spawnSync('npx', ['wrangler', ...args], { encoding: 'utf8', input, env: wranglerEnv })
  if (run.status !== 0) {
    const error = new Error(`wrangler ${args.slice(0, 2).join(' ')} failed:\n${run.stderr || run.stdout}`)
    error.output = `${run.stdout}\n${run.stderr}`
    throw error
  }
  return run.stdout
}

function ensureDatabase() {
  const find = () => JSON.parse(wrangler(['d1', 'list', '--json'])).find((db) => db.name === DB_NAME)
  if (!find()) wrangler(['d1', 'create', DB_NAME])
  const db = find()
  if (!db) throw new Error(`D1 database ${DB_NAME} was not created`)
  return db.uuid
}

function writeDatabaseId(id) {
  const config = readFileSync('wrangler.jsonc', 'utf8')
  const pattern = new RegExp(`("database_name": "${DB_NAME}",)(\\s*"database_id": "[^"]*",)?`)
  if (!pattern.test(config)) throw new Error(`wrangler.jsonc needs "database_name": "${DB_NAME}", followed by another property`)
  writeFileSync('wrangler.jsonc', config.replace(pattern, `$1\n      "database_id": "${id}",`))
}

/** Secret names already on the worker. Only "worker not found" (first deploy) counts as none. */
function existingSecrets() {
  try {
    return JSON.parse(wrangler(['secret', 'list', '--name', WORKER, '--format', 'json'])).map((s) => s.name)
  } catch (error) {
    if (/10007/.test(error.output ?? '')) return []
    throw error
  }
}

function putSecret(name, value) {
  wrangler(['secret', 'put', name, '--name', WORKER], value)
}

async function stripe(path, method = 'GET', form) {
  const response = await fetch(`https://api.stripe.com/v1/${path}`, {
    method,
    headers: { authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`, 'content-type': 'application/x-www-form-urlencoded' },
    body: form ? new URLSearchParams(form) : undefined,
  })
  const json = await response.json()
  if (!response.ok) throw new Error(`Stripe ${method} ${path}: ${json.error?.message ?? response.status}`)
  return json
}

/**
 * A fresh endpoint every deploy: its signing secret is shown only once, and this way the Worker's
 * secret always matches the current key's mode (sandbox or live), the event list and the SDK's API
 * version, and a disabled endpoint heals itself. New first, then the secret, then the old ones go,
 * so no event is lost; anything signed with the other secret in between gets a 400 and Stripe
 * retries it.
 */
async function replaceStripeWebhook(siteUrl) {
  const url = `${siteUrl}/api/stripe/webhook`
  const { data } = await stripe('webhook_endpoints?limit=100')
  const form = { url, description: WORKER, api_version: Stripe.API_VERSION }
  WEBHOOK_EVENTS.forEach((type, i) => (form[`enabled_events[${i}]`] = type))
  const created = await stripe('webhook_endpoints', 'POST', form)
  putSecret('STRIPE_WEBHOOK_SECRET', created.secret)
  for (const old of data.filter((endpoint) => endpoint.url === url)) await stripe(`webhook_endpoints/${old.id}`, 'DELETE')
}

const id = ensureDatabase()
writeDatabaseId(id)
wrangler(['d1', 'migrations', 'apply', 'DB', '--remote'])
const deployOutput = wrangler(['deploy'])
const siteUrl = process.env.SITE_URL || deployOutput.match(/https:\/\/[\w.-]+\.workers\.dev/)?.[0]
if (!siteUrl) throw new Error('Set SITE_URL: no workers.dev URL in the deploy output')

const secrets = existingSecrets()
for (const name of GENERATED) if (!secrets.includes(name)) putSecret(name, randomBytes(32).toString('hex'))
for (const name of RUNTIME_KEYS) if (process.env[name]) putSecret(name, process.env[name])
if (process.env.STRIPE_SECRET_KEY) await replaceStripeWebhook(siteUrl)

console.log(`Deployed: ${siteUrl}`)
