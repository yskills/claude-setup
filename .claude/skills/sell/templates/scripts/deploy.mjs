// The Workers Builds deploy command for the default branch (`npm run deploy`, publish skill).
// Cloudflare runs it with the Worker's build token, so wrangler is already signed in; no keys
// live in GitHub or here. It migrates the live D1, deploys, creates the random secrets the app
// needs once (e.g. BETTER_AUTH_SECRET), then migrates the preview D1. Other branches use
// Workers Builds' own preview command (`npx wrangler versions upload`).
// The Worker's name comes from wrangler.jsonc. A first deploy runs a few seconds without the
// generated secrets: `secret put` needs the Worker to exist, then makes a new version itself.
import { spawnSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { readFileSync } from 'node:fs'

const WORKER = readFileSync('wrangler.jsonc', 'utf8').match(/"name"\s*:\s*"([^"]+)"/)?.[1]
if (!WORKER) throw new Error('wrangler.jsonc has no "name"')
/** Random secrets made once and never shown, e.g. BETTER_AUTH_SECRET when the app has logins. */
const GENERATED = []

/** Wrangler's own error block, without the hundreds of bundler warnings that bury it. */
function errorText(output) {
  const plain = output.replace(/\x1b\[[0-9;]*m/g, '')
  const start = plain.search(/✘ \[ERROR\]/)
  return (start >= 0 ? plain.slice(start) : plain.slice(-2000)).trim()
}

function wrangler(args, input) {
  const run = spawnSync('npx', ['wrangler', ...args], { encoding: 'utf8', input })
  if (run.status !== 0) {
    const output = `${run.stdout}\n${run.stderr}`
    const error = new Error(`wrangler ${args.slice(0, 2).join(' ')} failed:\n${errorText(output)}`)
    Object.defineProperty(error, 'output', { value: output, enumerable: false })
    throw error
  }
  return run.stdout
}

/** Secret names already on the worker. Only "worker not found" counts as none. */
function existingSecrets() {
  try {
    return JSON.parse(wrangler(['secret', 'list', '--name', WORKER, '--format', 'json'])).map((s) => s.name)
  } catch (error) {
    if (/10007|not found|does not exist/i.test(error.output ?? '')) return []
    throw error
  }
}

try {
  wrangler(['d1', 'migrations', 'apply', 'DB', '--remote'])
  console.log(wrangler(['deploy']))
  const secrets = existingSecrets()
  for (const name of GENERATED) {
    if (!secrets.includes(name)) wrangler(['secret', 'put', name, '--name', WORKER], randomBytes(32).toString('hex'))
  }
  try {
    wrangler(['d1', 'migrations', 'apply', 'DB', '--remote', '--preview'])
  } catch (error) {
    console.warn(`Previews may miss the newest tables: ${error.message}`)
  }
} catch (error) {
  console.error(error.message)
  process.exit(1)
}
