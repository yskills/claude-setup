#!/usr/bin/env node
// delete-project: removes what new-project made, from one GitHub Actions run
// (.github/workflows/delete-project.yml, workflow_dispatch only): the org repo, the Worker with its
// Workers Builds connection, the D1 databases `<name>` and `<name>-preview`, and the shared build
// token once no other Worker in the account builds with it. Each step is skipped when the thing is
// already gone, so a re-run finishes what a failed run left.
// Guards: CONFIRM must repeat NAME, and a repo that still exists must carry new-project's
// description, so a real repo (claude-setup, duo-test, company-xy...) can never be deleted here.
// Reads the same keys as new-project: CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID, PROJECTS_GITHUB_TOKEN.
import { appendFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { validName, redact } from './new-project.mjs'

export const MARKER = 'made by claude-setup new-project'
const BUILD_TOKEN_NAME = 'claude-setup-builds'

export function checkRequest({ name, confirm, org }) {
  if (!validName(name || '')) throw new Error(`name "${name}" must be lowercase letters, digits and dashes`)
  if (confirm !== name) throw new Error(`confirm must repeat the name exactly ("${name}"); nothing was deleted`)
  if (!/^[A-Za-z0-9-]{1,39}$/.test(org || '')) throw new Error(`org "${org}" is not a GitHub org name`)
}

export function madeByWorkflow(repo) {
  return String(repo?.description || '').includes(MARKER)
}

function env(key) {
  const value = process.env[key]
  if (!value) throw new Error(`${key} is not set (claude-setup → Settings → Secrets and variables → Actions)`)
  return value
}

async function api(base, token, path, init = {}) {
  const res = await fetch(base + path, {
    ...init,
    headers: { authorization: `Bearer ${token}`, accept: 'application/json', 'user-agent': 'claude-setup delete-project' },
  })
  const text = await res.text()
  let json = null
  try { json = text ? JSON.parse(text) : null } catch { json = null }
  return { status: res.status, ok: res.ok, json, text }
}

function log(step, detail) { console.log(`[delete-project] ${step}: ${detail}`) }

function must(r, what) {
  if (!r.ok && r.status !== 404) throw new Error(`${what}: ${r.status} ${redact(r.text).slice(0, 300)}`)
  return r
}

async function findWorker(cf, name) {
  for (let page = 1; ; page += 1) {
    const r = must(await cf(`/workers/workers?per_page=100&page=${page}`), 'list Workers')
    const list = r.json?.result || []
    const hit = list.find((w) => w.name === name)
    if (hit || list.length < 100) return { hit, others: list.filter((w) => w.name !== name) }
  }
}

async function deleteWorker(cf, name) {
  const { hit } = await findWorker(cf, name)
  if (!hit) { log('worker', `${name} not found, nothing to delete`); return }
  const builds = await cf(`/builds/workers/${hit.id}`, { method: 'DELETE' })
  log('builds', builds.ok ? 'connection removed' : `connection not removed separately (${builds.status}), it goes with the Worker`)
  must(await cf(`/workers/scripts/${name}?force=true`, { method: 'DELETE' }), `delete Worker ${name}`)
  log('worker', `deleted ${name}`)
}

async function deleteD1(cf, dbName) {
  const list = must(await cf(`/d1/database?name=${encodeURIComponent(dbName)}&per_page=100`), 'list D1')
  const found = (list.json?.result || []).find((d) => d.name === dbName)
  if (!found) { log('d1', `${dbName} not found, nothing to delete`); return }
  must(await cf(`/d1/database/${found.uuid}`, { method: 'DELETE' }), `delete D1 ${dbName}`)
  log('d1', `deleted ${dbName}`)
}

// The build token is shared by every project in the account, so it goes only with the last one.
async function deleteBuildTokenIfUnused(cf, name) {
  const { others } = await findWorker(cf, name)
  for (const w of others) {
    if ((await cf(`/builds/workers/${w.id}`)).ok) { log('build token', `kept, ${w.name} still builds with it`); return }
  }
  const tokens = (must(await cf('/builds/tokens'), 'list build tokens').json?.result || []).filter((t) => t.build_token_name === BUILD_TOKEN_NAME)
  if (!tokens.length) { log('build token', `${BUILD_TOKEN_NAME} not found, nothing to delete`); return }
  for (const t of tokens) must(await cf(`/builds/tokens/${t.build_token_uuid}`, { method: 'DELETE' }), 'delete build token')
  log('build token', `deleted ${BUILD_TOKEN_NAME} (the next new project registers it again)`)
}

export async function main() {
  const name = process.env.NAME
  const org = process.env.ORG || 'yverse-studio'
  checkRequest({ name, confirm: process.env.CONFIRM, org })
  const account = env('CLOUDFLARE_ACCOUNT_ID')
  const cfToken = env('CLOUDFLARE_API_TOKEN')
  const ghToken = env('PROJECTS_GITHUB_TOKEN')
  const cf = (path, init) => api('https://api.cloudflare.com/client/v4', cfToken, `/accounts/${account}${path}`, init)
  const gh = (path, init) => api('https://api.github.com', ghToken, path, init)

  const repo = await gh(`/repos/${org}/${name}`)
  if (repo.ok && !madeByWorkflow(repo.json)) throw new Error(`${org}/${name} was not made by new-project (its description lacks "${MARKER}"); nothing was deleted`)
  if (!repo.ok && repo.status !== 404) throw new Error(`read repo: ${repo.status}`)

  await deleteWorker(cf, name)
  await deleteD1(cf, name)
  await deleteD1(cf, `${name}-preview`)
  await deleteBuildTokenIfUnused(cf, name)
  if (repo.ok) {
    must(await gh(`/repos/${org}/${name}`, { method: 'DELETE' }), `delete repo ${org}/${name}`)
    log('repo', `deleted ${org}/${name}`)
  } else {
    log('repo', `${org}/${name} not found, nothing to delete`)
  }
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## ${name} deleted\n\nRepo, Worker, D1 and (if unused) the build token are gone.\n`)
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((err) => { console.error(`[delete-project] ${err.message}`); process.exit(1) })
}
