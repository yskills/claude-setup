import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, existsSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { projectFromBranch, validName, wranglerConfig, packageJson, buildCommands, writeScaffold, describe, redact, hookIdFrom, connectRepo, ensureBuilds } from './new-project.mjs'

test('names are workers.dev safe', () => {
  assert.ok(validName('duo-test'))
  assert.ok(!validName('Duo Test'))
  assert.ok(!validName('-x'))
})

test('a D1 project keeps previews on their own database', () => {
  const c = wranglerConfig({ name: 'app', d1: true, liveId: 'live', previewId: 'prev' })
  assert.equal(c.d1_databases[0].preview_database_id, 'prev')
  assert.equal(c.previews.d1_databases[0].database_id, 'prev')
  assert.equal(c.workers_dev, true)
  assert.equal(c.preview_urls, true)
  const plain = wranglerConfig({ name: 'app', d1: false })
  assert.deepEqual(plain.previews, {})
  assert.ok(!plain.d1_databases)
})

test('deploy scripts and build commands match the publish skill', () => {
  const d1 = packageJson({ name: 'app', d1: true }).scripts
  assert.match(d1.deploy, /^wrangler d1 migrations apply DB --remote && wrangler deploy/)
  assert.match(d1['deploy:preview'], /^wrangler d1 migrations apply DB --remote --preview && wrangler preview$/)
  assert.equal(packageJson({ name: 'app', d1: false }).scripts.deploy, 'wrangler deploy')
  assert.equal(buildCommands(true).production.deploy_command, 'npm run deploy')
  assert.equal(buildCommands(false).previews.deploy_command, 'npx wrangler preview')
  assert.equal(buildCommands(true).production.build_command, 'npm run check && npm run build')
})

test('the scaffold is written with the name filled in and runs its own verify', () => {
  const dir = mkdtempSync(join(tmpdir(), 'np-test-'))
  writeScaffold(dir, { name: 'probe', d1: false })
  assert.ok(readFileSync(join(dir, 'README.md'), 'utf8').includes('# probe'))
  assert.ok(!existsSync(join(dir, 'migrations')))
  assert.ok(existsSync(join(dir, '.github/workflows/ci.yml')))
  const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
  assert.equal(pkg.name, 'probe')
  rmSync(dir, { recursive: true, force: true })
})

test('a pushed new/<name> branch names the project, its json the options', () => {
  assert.deepEqual(projectFromBranch('new/shop', () => null), { name: 'shop', d1: true, org: 'yverse-studio' })
  assert.deepEqual(projectFromBranch('new/shop', () => ({ d1: false, org: 'other' })), { name: 'shop', d1: false, org: 'other' })
  assert.equal(projectFromBranch('main', () => null), null)
})

test('API answers are logged without secrets or hook ids, and hook ids are read from any known shape', () => {
  const body = '{"result":{"deploy_hook_uuid":"abc-123","build_token_secret":"s3cret","ok":"x"},"success":true}'
  const line = describe({ status: 200, json: JSON.parse(body), text: body })
  assert.match(line, /^200 keys=\[result,success\] result=\[deploy_hook_uuid,build_token_secret,ok\]/)
  assert.doesNotMatch(line, /abc-123|s3cret/)
  assert.doesNotMatch(redact('x'.repeat(40)), /x{40}/)
  assert.doesNotMatch(redact('{"id":"h1","uuid":"h2","x":"0f8fad5b-d9cb-469f-a165-70867728950e","y":"6729db15516a425d985bd27ff6dc179e"}'), /h1|h2|0f8fad5b|6729db15/)
  assert.equal(hookIdFrom({ deploy_hook_uuid: 'a' }), 'a')
  assert.equal(hookIdFrom({ hook_id: 'b' }), 'b')
  assert.equal(hookIdFrom({ deploy_hook: { uuid: 'c' } }), 'c')
  assert.equal(hookIdFrom(null), null)
})

function fakeCf(answer) {
  const calls = []
  const cf = async (path, init) => { calls.push({ path, init }); return answer(path, init, calls.length) }
  return { cf, calls }
}
const refused = { ok: false, status: 404, json: { success: false, errors: [{ code: 8000008, message: 'This project is disconnected from your Git account' }], result: null }, text: '' }
const saved = { ok: true, status: 200, json: { success: true, errors: [], result: { repo_connection_uuid: 'c1' } }, text: '' }
const repo = { id: 123, owner: { id: 456 } }

test('the repo connection is saved first, with the identifiers Cloudflare accepts, and the build configuration uses them', async () => {
  const { cf, calls } = fakeCf((path, init) => (init.body.repo_id === 'deploy-test' ? saved : refused))
  const git = await connectRepo(cf, { repo, org: 'yverse-studio', name: 'deploy-test', tries: 1 })
  assert.deepEqual(calls.map((c) => c.path), ['/builds/repos/connections', '/builds/repos/connections'])
  assert.equal(calls[0].init.body.provider_account_id, '456')
  assert.equal(calls[0].init.body.repo_id, '123')
  assert.deepEqual(git, { provider_type: 'github', provider_account_name: 'yverse-studio', repo_name: 'deploy-test', provider_account_id: 'yverse-studio', repo_id: 'deploy-test' })

  const builds = fakeCf((path) => (path === '/builds/workers' ? saved : refused))
  await ensureBuilds(builds.cf, { tag: 't', git, org: 'yverse-studio', name: 'deploy-test', branch: 'main', d1: false, buildTokenUuid: 'b' })
  assert.deepEqual(builds.calls[1].init.body.git_repository, { ...git, branch: 'main' })
})

test('a repo Cloudflare does not know is retried, then the run stops with the answers and the fix', async () => {
  const { cf, calls } = fakeCf(() => refused)
  await assert.rejects(
    connectRepo(cf, { repo, org: 'yverse-studio', name: 'deploy-test', tries: 3, waitMs: 0 }),
    (err) => /after 3 tries: numeric ids: 8000008 .*; names: 8000008 .*github\.com\/organizations\/yverse-studio\/settings\/installations/.test(err.message),
  )
  assert.equal(calls.length, 6)
  const builds = fakeCf(() => refused)
  await assert.rejects(ensureBuilds(builds.cf, { tag: 't', git: {}, org: 'o', name: 'n', branch: 'main', d1: false, buildTokenUuid: 'b' }), /did not connect o\/n: 8000008/)
})

test('only "repo unknown" is retried; any other answer stops the run at once', async () => {
  const forbidden = fakeCf(() => { throw new Error('Cloudflare PUT /builds/repos/connections: 403 {"errors":[{"code":10000}]}') })
  await assert.rejects(connectRepo(forbidden.cf, { repo, org: 'o', name: 'n', tries: 3, waitMs: 0 }), /403/)
  assert.equal(forbidden.calls.length, 1)
  const otherNotFound = fakeCf(() => ({ ok: false, status: 404, json: { success: false, errors: [{ code: 12040, message: 'no such thing' }], result: null }, text: '' }))
  await assert.rejects(connectRepo(otherNotFound.cf, { repo, org: 'o', name: 'n', tries: 3, waitMs: 0 }), /12040 no such thing/)
  assert.equal(otherNotFound.calls.length, 1)
})
