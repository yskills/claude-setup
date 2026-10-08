#!/usr/bin/env node
// new-project: a repo in the org, its D1 databases, the Worker, the Workers Builds connection
// and the first build, from one GitHub Actions run (.github/workflows/new-project.yml).
// Every step is skipped when the thing already exists, so a re-run finishes what a failed run left.
// Reads: CLOUDFLARE_API_TOKEN (user token: Workers Builds Configuration Edit, Workers Scripts Edit,
// D1 Edit, Account Settings Read), CLOUDFLARE_ACCOUNT_ID, PROJECTS_GITHUB_TOKEN (fine-grained, the
// org only: Administration, Contents, Workflows), BUILD_TOKEN_NAME (optional: which Workers Builds
// token deploys; default: the first one), and the project: NAME, ORG, D1 ("true"/"false") from a
// workflow_dispatch, or PROJECT_BRANCH `new/<name>` whose `projects/<name>.json` holds
// `{ "name", "d1", "org" }` (a cloud thread can push a branch but not dispatch a workflow; the
// workflow runs main's code and takes only that json from the branch).
import { cpSync, mkdtempSync, readFileSync, writeFileSync, rmSync, appendFileSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const TEMPLATE = new URL('../.claude/skills/publish/templates/new-project/', import.meta.url)
const BUILD = 'npm run check && npm run build'
const BUILD_WAIT_MS = 10 * 60 * 1000
const POLL_MS = 15 * 1000

export function projectFromBranch(branch, readJson) {
  if (!branch?.startsWith('new/')) return null
  const name = branch.slice('new/'.length)
  const cfg = readJson(`projects/${name}.json`) || {}
  return { name: cfg.name || name, d1: cfg.d1 !== false, org: cfg.org || 'yverse-studio' }
}

export function validName(name) {
  return /^[a-z0-9][a-z0-9-]{1,62}$/.test(name)
}

export function wranglerConfig({ name, d1, liveId, previewId }) {
  const base = {
    $schema: 'node_modules/wrangler/config-schema.json',
    name,
    main: 'src/index.js',
    compatibility_date: '2025-09-01',
    workers_dev: true,
    preview_urls: true,
    observability: { enabled: true },
    previews: {},
  }
  if (!d1) return base
  return {
    ...base,
    d1_databases: [{ binding: 'DB', database_name: name, migrations_dir: 'migrations', database_id: liveId, preview_database_id: previewId }],
    previews: { d1_databases: [{ binding: 'DB', database_name: `${name}-preview`, migrations_dir: 'migrations', database_id: previewId }] },
  }
}

export function packageJson({ name, d1 }) {
  const deploy = d1
    ? 'wrangler d1 migrations apply DB --remote && wrangler deploy && (wrangler d1 migrations apply DB --remote --preview || echo "Live is deployed, but the preview database was not migrated")'
    : 'wrangler deploy'
  const deployPreview = d1 ? 'wrangler d1 migrations apply DB --remote --preview && wrangler preview' : 'wrangler preview'
  return {
    name,
    private: true,
    type: 'module',
    engines: { node: '>=24' },
    scripts: {
      dev: 'npm run build && wrangler dev',
      test: 'node --test',
      check: 'npm test',
      build: 'node scripts/build.mjs',
      verify: 'npm run check && npm run build',
      deploy,
      'deploy:preview': deployPreview,
    },
    devDependencies: { wrangler: '^4.147.0' },
  }
}

export function buildCommands(d1) {
  return {
    production: { build_command: BUILD, deploy_command: d1 ? 'npm run deploy' : 'npx wrangler deploy' },
    previews: { build_command: BUILD, deploy_command: d1 ? 'npm run deploy:preview' : 'npx wrangler preview' },
  }
}

export function writeScaffold(dir, { name, d1, liveId, previewId }) {
  cpSync(TEMPLATE, dir, { recursive: true })
  if (!d1) rmSync(join(dir, 'migrations'), { recursive: true, force: true })
  for (const file of ['README.md', 'CLAUDE.md', 'src/index.js']) {
    const path = join(dir, file)
    writeFileSync(path, readFileSync(path, 'utf8').replaceAll('__NAME__', name))
  }
  writeFileSync(join(dir, 'wrangler.jsonc'), JSON.stringify(wranglerConfig({ name, d1, liveId, previewId }), null, 2) + '\n')
  writeFileSync(join(dir, 'package.json'), JSON.stringify(packageJson({ name, d1 }), null, 2) + '\n')
}

function env(key, required = true) {
  const value = process.env[key]
  if (!value && required) throw new Error(`${key} is not set (claude-setup → Settings → Secrets and variables → Actions)`)
  return value
}

async function api(base, token, path, init = {}) {
  const res = await fetch(base + path, {
    ...init,
    headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), 'content-type': 'application/json', accept: 'application/json', 'user-agent': 'claude-setup new-project', ...(init.headers || {}) },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  })
  const text = await res.text()
  let json = null
  try { json = text ? JSON.parse(text) : null } catch { json = null }
  return { status: res.status, ok: res.ok, json, text }
}

// Hides anything secret-like in an API body before it reaches a log: values of keys named
// token/secret/key/password/authorization/hook/uuid/id, every uuid or 32-hex id, and long
// dash-free strings (tokens, hashes). A deploy hook id alone starts builds, so ids count.
export function redact(text) {
  return String(text ?? '')
    .replace(/("(?:[^"]*(?:token|secret|key|password|authorization|hook|uuid)[^"]*|id)"\s*:\s*)"[^"]*"/gi, '$1"***"')
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|[0-9a-f]{32}/gi, '***')
    .replace(/[A-Za-z0-9_=+/.]{40,}/g, '***')
}

// One line that says what an API call really answered, safe to print in a public log.
export function describe(r) {
  const keys = (o) => (o && typeof o === 'object' ? (Array.isArray(o) ? `array(${o.length})` : Object.keys(o).join(',') || '{}') : String(o))
  return `${r.status} keys=[${keys(r.json)}] result=[${keys(r.json?.result)}] body=${JSON.stringify(redact(r.text).slice(0, 300))}`
}

function cfClient(token, account) {
  const base = 'https://api.cloudflare.com/client/v4'
  return async (path, init) => {
    const r = await api(base, token, `/accounts/${account}${path}`, init)
    if (path.startsWith('/builds/')) log('api', `${init?.method || 'GET'} ${path.replace(/\/deploy_hooks\/[^/]+/, '/deploy_hooks/<hook>')} → ${describe(r)}`)
    if (!r.ok && r.status !== 404) throw new Error(`Cloudflare ${init?.method || 'GET'} ${path}: ${r.status} ${redact(r.text).slice(0, 400)}`)
    return r
  }
}

function ghClient(token) {
  return async (path, init) => api('https://api.github.com', token, path, init)
}

function log(step, detail) { console.log(`[new-project] ${step}: ${detail}`) }

async function ensureRepo(gh, org, name) {
  const existing = await gh(`/repos/${org}/${name}`)
  if (existing.ok) { log('repo', `exists ${existing.json.html_url}`); return existing.json }
  const created = await gh(`/orgs/${org}/repos`, { method: 'POST', body: { name, private: true, auto_init: false, description: 'made by claude-setup new-project' } })
  if (!created.ok) throw new Error(`GitHub create repo: ${created.status} ${created.text.slice(0, 300)}`)
  log('repo', `created ${created.json.html_url}`)
  return created.json
}

async function repoIsEmpty(gh, org, name) {
  const r = await gh(`/repos/${org}/${name}/commits?per_page=1`)
  return r.status === 409 || (r.ok && Array.isArray(r.json) && r.json.length === 0)
}

async function ensureD1(cf, name) {
  const list = await cf(`/d1/database?name=${encodeURIComponent(name)}&per_page=100`)
  const found = (list.json?.result || []).find((d) => d.name === name)
  if (found) { log('d1', `exists ${name} ${found.uuid}`); return found.uuid }
  const created = await cf('/d1/database', { method: 'POST', body: { name, jurisdiction: 'eu' } })
  log('d1', `created ${name} ${created.json.result.uuid} (eu)`)
  return created.json.result.uuid
}

async function ensureWorker(cf, name, previewSecret, { adopt }) {
  let page = 1
  for (;;) {
    const r = await cf(`/workers/workers?per_page=100&page=${page}`)
    const hit = (r.json?.result || []).find((w) => w.name === name)
    if (hit && !adopt) throw new Error(`a Worker named ${name} already exists but the repo is new: pick another name (a re-run adopts a Worker only when its repo exists)`)
    if (hit) { log('worker', `exists ${name} ${hit.id}`); return hit }
    if ((r.json?.result || []).length < 100) break
    page += 1
  }
  const created = await cf('/workers/workers', {
    method: 'POST',
    body: {
      name,
      observability: { enabled: true },
      subdomain: { enabled: true, previews_enabled: true },
      previews_base_config: { env: { BETTER_AUTH_SECRET: { type: 'secret_text', text: previewSecret } } },
    },
  })
  log('worker', `created ${name} ${created.json.result.id}`)
  return created.json.result
}

async function registerBuildToken(cf, buildToken) {
  // First project in a fresh account: no build token exists yet. CLOUDFLARE_BUILD_TOKEN is a
  // second, narrower user token (Workers Scripts Edit, D1 Edit) that builds deploy with.
  const verify = await api('https://api.cloudflare.com/client/v4', buildToken, '/user/tokens/verify')
  if (!verify.ok) throw new Error(`CLOUDFLARE_BUILD_TOKEN is not a valid token: ${verify.status}`)
  const created = await cf('/builds/tokens', { method: 'POST', body: { build_token_name: 'claude-setup-builds', build_token_secret: buildToken, cloudflare_token_id: verify.json.result.id } })
  log('build token', `registered claude-setup-builds ${created.json.result.build_token_uuid}`)
  return created.json.result.build_token_uuid
}

async function pickBuildToken(cf, preferredName, newToken) {
  // Never registers the setup token as a build token: every pushed branch of every project
  // would then build with Workers Builds Configuration Edit and D1 create rights. Builds use
  // the existing build token (duo-test's, Workers Scripts + D1 Edit), named by BUILD_TOKEN_NAME.
  const list = await cf('/builds/tokens')
  const tokens = list.json?.result || []
  const preferred = preferredName ? tokens.find((t) => t.build_token_name === preferredName) : null
  if (!preferredName && tokens.length > 1) throw new Error(`${tokens.length} build tokens exist: set the variable BUILD_TOKEN_NAME to the one builds should deploy with`)
  const pick = preferred || (preferredName ? null : tokens[0])
  if (!pick && newToken) return registerBuildToken(cf, newToken)
  if (!pick) throw new Error(`no build token${preferredName ? ` named "${preferredName}"` : ''}: set the secret CLOUDFLARE_BUILD_TOKEN once (publish skill, §A new project)`)
  log('build token', `${pick.build_token_name} ${pick.build_token_uuid}`)
  return pick.build_token_uuid
}

async function ensureBuilds(cf, { tag, repo, org, name, branch, d1, buildTokenUuid }) {
  const existing = await cf(`/builds/workers/${tag}`)
  if (existing.ok) { log('builds', 'already connected'); return existing.json.result }
  const commands = buildCommands(d1)
  const created = await cf('/builds/workers', {
    method: 'POST',
    body: {
      script_tag: tag,
      git_repository: { provider_type: 'github', provider_account_id: String(repo.owner.id), provider_account_name: org, repo_id: String(repo.id), repo_name: name, branch },
      production_settings: { ...commands.production, build_token_uuid: buildTokenUuid, root_directory: '/' },
      previews_enabled: true,
      previews_base_config: { ...commands.previews, build_token_uuid: buildTokenUuid, root_directory: '/' },
    },
  })
  if (!created.ok || !created.json?.success || !created.json?.result) {
    // Run 7 on 2026-10-08 answered 404 / 8000008 "This project is disconnected from your Git
    // account" here and the run went on as if connected. Any non-success stops the run now.
    const errors = (created.json?.errors || []).map((e) => `${e.code} ${redact(e.message)}`).join('; ') || `status ${created.status}`
    const linkFix = 'link the GitHub org to Claude\'s Cloudflare account once: Workers & Pages > Create > Import a repository > Add account > yverse-studio > All repositories'
    throw new Error(`Workers Builds did not connect ${org}/${name}: ${errors}. Fix: ${(created.json?.errors || []).some((e) => e.code === 8000008) ? linkFix : `check the answer above; if it names the Git account, ${linkFix}`}`)
  }
  log('builds', `connected ${org}/${name} (${branch})`)
  return created.json.result
}

const HOOK_NAME = 'claude-setup first build'

// The hook id, whatever the answer calls it (the schema says deploy_hook_uuid; runs showed
// answers the schema did not predict, so the other names seen in Cloudflare docs count too).
export function hookIdFrom(result) {
  const r = result?.deploy_hook || result || {}
  return r.deploy_hook_uuid || r.hook_id || r.uuid || r.id || null
}

// Workers Builds paths take the script tag, not the name (a 404 comes back as an empty answer).
async function listHooks(cf, tag) {
  const list = await cf(`/builds/workers/${tag}/deploy_hooks`)
  const result = list.json?.result
  return Array.isArray(result) ? result : Array.isArray(result?.deploy_hooks) ? result.deploy_hooks : []
}

async function deleteHook(cf, tag, id) {
  await cf(`/builds/workers/${tag}/deploy_hooks/${id}`, { method: 'DELETE' }).catch(() => log('deploy hook', 'not deleted; remove it in the dashboard (Settings > Build > Deploy hooks)'))
}

// Hooks an earlier run left behind (its uuid alone starts builds) go first.
async function removeOldHooks(cf, tag) {
  for (const hook of await listHooks(cf, tag)) {
    const id = hookIdFrom(hook)
    if (hook.deploy_hook_name === HOOK_NAME && id) { log('deploy hook', 'removing one left by an earlier run'); await deleteHook(cf, tag, id) }
  }
}

async function makeHook(cf, tag, branch) {
  const made = await cf(`/builds/workers/${tag}/deploy_hooks`, { method: 'POST', body: { deploy_hook_name: HOOK_NAME, branch } })
  const direct = made.ok ? hookIdFrom(made.json?.result) : null
  if (direct) return direct
  // An empty or unexpected answer: the hook may still exist, so the list is the second source.
  const listed = (await listHooks(cf, tag)).find((h) => h.deploy_hook_name === HOOK_NAME && h.branch === branch)
  const fromList = hookIdFrom(listed)
  if (fromList) return fromList
  throw new Error(`deploy hook not made: POST answered ${describe(made)}`)
}

async function startBuild(cf, tag, name, branch) {
  // A config made with POST /builds/workers lists no legacy trigger (run 5 on 2026-10-08:
  // "status 200, 0 listed"), so a trigger is used when one exists and a deploy hook otherwise:
  // POST /builds/workers/{tag}/deploy_hooks makes a hook for the branch, an unauthenticated
  // POST to /workers/builds/deploy_hooks/{uuid} starts the build (Cloudflare docs, Deploy Hooks),
  // and the hook is deleted again because its uuid alone can start builds.
  const triggers = await cf(`/builds/workers/${tag}/triggers`)
  const production = (triggers.json?.result || []).find((t) => (t.branch_includes || []).includes(branch)) || (triggers.json?.result || [])[0]
  if (production) {
    const started = await cf(`/builds/triggers/${production.trigger_uuid}/builds`, { method: 'POST', body: { branch } })
    const uuid = started.json?.result?.build_uuid
    if (!uuid) throw new Error(`trigger answered without a build uuid: ${describe(started)}`)
    return uuid
  }
  await removeOldHooks(cf, tag)
  const hookId = await makeHook(cf, tag, branch)
  try {
    const fired = await api('https://api.cloudflare.com/client/v4', null, `/workers/builds/deploy_hooks/${hookId}`, { method: 'POST' })
    log('api', `POST /workers/builds/deploy_hooks/<hook> → ${describe(fired)}`)
    const uuid = fired.json?.result?.build_uuid
    if (!fired.ok || !uuid) throw new Error(`deploy hook did not start a build: ${describe(fired)}`)
    log('build', 'started through a deploy hook')
    return uuid
  } finally {
    await deleteHook(cf, tag, hookId)
  }
}

async function firstBuild(cf, tag, name, branch) {
  const uuid = await startBuild(cf, tag, name, branch)
  log('build', `started ${uuid}`)
  const until = Date.now() + BUILD_WAIT_MS
  while (Date.now() < until) {
    await new Promise((r) => setTimeout(r, POLL_MS))
    const b = await cf(`/builds/builds/${uuid}`)
    const state = buildState(b.json?.result)
    log('build', state.running ? state.status : `${state.status}, outcome ${state.outcome}`)
    if (!state.running) return { uuid, status: state.outcome }
  }
  return { uuid, status: 'timeout' }
}

// A build's status says whether it still runs (queued, initializing, running, stopped), its
// build_outcome how it ended (success, fail, skipped, cancelled, terminated). Run 9 on
// 2026-10-08 deployed fine and was reported red because "stopped" was read as a failure.
export function buildState(result) {
  const status = result?.status || 'unknown'
  const running = !result || ['queued', 'pending', 'initializing', 'running', 'in_progress'].includes(status)
  return { status, running, outcome: running ? null : result.build_outcome || status }
}

async function ensureSecret(cf, name, key, text) {
  const list = await cf(`/workers/scripts/${name}/secrets`)
  if ((list.json?.result || []).some((s) => s.name === key)) { log('secret', `${key} exists`); return }
  await cf(`/workers/scripts/${name}/secrets`, { method: 'PUT', body: { name: key, text, type: 'secret_text' } })
  log('secret', `${key} set`)
}

function pushScaffold(dir, org, name, branch, token) {
  const run = (args) => execFileSync('git', args, { cwd: dir, stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' })
  run(['init', '-q', '-b', branch])
  run(['config', 'user.name', 'Claude'])
  run(['config', 'user.email', 'noreply@anthropic.com'])
  run(['add', '-A'])
  run(['commit', '-q', '-m', `feat: day-zero site for ${name}\n\nMade by claude-setup's new-project workflow.`])
  try {
    run(['push', '-q', `https://x-access-token:${token}@github.com/${org}/${name}.git`, `HEAD:${branch}`])
  } catch (err) {
    throw new Error(`git push to ${org}/${name} failed: ${String(err.stderr || err.message).replaceAll(token, '***').slice(0, 300)}`)
  }
}

export async function main() {
  const fromBranch = process.env.NAME ? null : projectFromBranch(process.env.PROJECT_BRANCH, (file) => (existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null))
  const name = fromBranch?.name || env('NAME')
  if (!validName(name)) throw new Error(`name "${name}" must be lowercase letters, digits and dashes`)
  const org = fromBranch?.org || env('ORG')
  if (!/^[A-Za-z0-9-]{1,39}$/.test(org)) throw new Error(`org "${org}" is not a GitHub org name`)
  const d1 = fromBranch ? fromBranch.d1 : env('D1', false) !== 'false'
  const branch = 'main'
  const cfToken = env('CLOUDFLARE_API_TOKEN')
  const account = env('CLOUDFLARE_ACCOUNT_ID')
  const ghToken = env('PROJECTS_GITHUB_TOKEN')
  const cf = cfClient(cfToken, account)
  const gh = ghClient(ghToken)

  const repoExisted = (await gh(`/repos/${org}/${name}`)).ok
  const repo = await ensureRepo(gh, org, name)
  const liveId = d1 ? await ensureD1(cf, name) : undefined
  const previewId = d1 ? await ensureD1(cf, `${name}-preview`) : undefined

  if (await repoIsEmpty(gh, org, name)) {
    const dir = mkdtempSync(join(tmpdir(), 'new-project-'))
    writeScaffold(dir, { name, d1, liveId, previewId })
    pushScaffold(dir, org, name, branch, ghToken)
    log('repo', `pushed the day-zero site to ${branch}`)
  } else {
    log('repo', 'has commits, nothing pushed')
  }

  const worker = await ensureWorker(cf, name, randomBytes(32).toString('base64url'), { adopt: repoExisted })
  const buildTokenUuid = await pickBuildToken(cf, process.env.BUILD_TOKEN_NAME, process.env.CLOUDFLARE_BUILD_TOKEN)
  await ensureBuilds(cf, { tag: worker.id, repo, org, name, branch, d1, buildTokenUuid })
  const build = await firstBuild(cf, worker.id, name, branch)
  if (build.status === 'success') await ensureSecret(cf, name, 'BETTER_AUTH_SECRET', randomBytes(32).toString('base64url'))

  const sub = await cf('/workers/subdomain')
  const url = `https://${name}.${sub.json?.result?.subdomain}.workers.dev`
  const result = { repo: repo.html_url, url, worker: worker.id, d1: d1 ? { live: liveId, preview: previewId } : null, build }
  console.log(JSON.stringify(result, null, 2))
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## ${name}\n\n- Repo: ${repo.html_url}\n- Live: ${url}\n- First build: ${build.status} (${build.uuid})\n- D1: ${d1 ? `${liveId} / preview ${previewId}` : 'none'}\n`)
  }
  if (build.status !== 'success') throw new Error(`first build ended with ${build.status}; logs: Cloudflare → Workers & Pages → ${name} → Builds`)
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((err) => { console.error(`[new-project] ${err.message}`); process.exit(1) })
}
