import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, existsSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { projectFromBranch, validName, wranglerConfig, packageJson, buildCommands, writeScaffold, describe, redact, hookIdFrom } from './new-project.mjs'

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
  assert.equal(hookIdFrom({ deploy_hook_uuid: 'a' }), 'a')
  assert.equal(hookIdFrom({ hook_id: 'b' }), 'b')
  assert.equal(hookIdFrom({ deploy_hook: { uuid: 'c' } }), 'c')
  assert.equal(hookIdFrom(null), null)
})
