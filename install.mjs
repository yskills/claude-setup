#!/usr/bin/env node
// yskills' global Claude Code setup. Safe to re-run: it updates what it installed before and
// leaves everything else alone.
//
//   node install.mjs [--dry-run] [--skip-plugins] [--skip-hooks]
//
// What it does, in order:
//   1. backs up ~/.claude/CLAUDE.md and ~/.claude/settings.json
//   2. installs the ECC hook runtime (npx ecc-universal, pinned in config/ecc.json)
//   3. installs plugins from config/plugins.json with the claude CLI
//   4. copies skills, agents and rules into ~/.claude (curated ECC subset + our own)
//   5. writes the managed block of ~/.claude/CLAUDE.md
//   6. merges global/settings.json into ~/.claude/settings.json
import { spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = dirname(fileURLToPath(import.meta.url))
const args = new Set(process.argv.slice(2))
const DRY = args.has('--dry-run')
const SKIP_PLUGINS = args.has('--skip-plugins')
const SKIP_HOOKS = args.has('--skip-hooks')
const IS_WIN = process.platform === 'win32'
const CLAUDE_DIR = process.env.CLAUDE_CONFIG_DIR || join(homedir(), '.claude')
const STATE_DIR = join(CLAUDE_DIR, 'claude-setup')
const MANIFEST = join(STATE_DIR, 'manifest.json')
const START = '<!-- claude-setup:start (managed by yskills/claude-setup; edits inside are overwritten) -->'
const END = '<!-- claude-setup:end -->'

const readJson = (p, fallback) => (existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : fallback)
const ecc = readJson(join(ROOT, 'config/ecc.json'))
const plugins = readJson(join(ROOT, 'config/plugins.json'))
const log = (m) => console.log(m)
const step = (m) => console.log(`\n== ${m}`)
const warnings = []
const warn = (m) => { warnings.push(m); console.log(`  ! ${m}`) }

function run(cmd, argv, { allowFail = false, quiet = false } = {}) {
  if (DRY) { log(`  (dry run) ${cmd} ${argv.join(' ')}`); return { ok: true, out: '' } }
  const r = spawnSync(cmd, argv, { encoding: 'utf8', shell: IS_WIN, stdio: quiet ? 'pipe' : ['ignore', 'pipe', 'pipe'] })
  const out = `${r.stdout || ''}${r.stderr || ''}`.trim()
  const ok = r.status === 0
  if (!ok && !allowFail) throw new Error(`${cmd} ${argv.join(' ')} failed:\n${out}`)
  return { ok, out }
}
const has = (cmd) => spawnSync(cmd, ['--version'], { encoding: 'utf8', shell: IS_WIN }).status === 0
const write = (p, s) => { if (DRY) return; mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, s) }

// ---------------------------------------------------------------- 0. prerequisites
step('Checking prerequisites')
const nodeMajor = Number(process.versions.node.split('.')[0])
if (nodeMajor < 18) { console.error(`Node ${process.versions.node} is too old; install Node 20+ (24 recommended).`); process.exit(1) }
log(`  node ${process.versions.node}`)
if (!has('git')) warn('git not found: install Git, then re-run.')
const hasClaude = has('claude')
if (!hasClaude) warn('claude CLI not found: install Claude Code (https://code.claude.com), then re-run to add plugins.')
log(`  config dir ${CLAUDE_DIR}${DRY ? '  (dry run: nothing is written)' : ''}`)

// ---------------------------------------------------------------- 1. backup
step('Backing up current config')
const stamp = new Date().toISOString().replace(/[:.]/g, '-')
const backupDir = join(CLAUDE_DIR, 'backups', `claude-setup-${stamp}`)
for (const f of ['CLAUDE.md', 'settings.json']) {
  const p = join(CLAUDE_DIR, f)
  if (existsSync(p)) {
    if (!DRY) { mkdirSync(backupDir, { recursive: true }); cpSync(p, join(backupDir, f)) }
    log(`  ${f} -> ${backupDir}`)
  }
}

// ---------------------------------------------------------------- 2. ECC hooks
step(`ECC hook runtime (${ecc.npmPackage})`)
if (SKIP_HOOKS) log('  skipped (--skip-hooks)')
else {
  const r = run('npx', ['-y', ecc.npmPackage, 'install', '--target', 'claude', '--modules', 'hooks-runtime', '--enable-hooks'], { allowFail: true })
  if (r.ok) log('  installed')
  else warn(`ECC hooks failed (setup continues without them):\n${r.out.split('\n').slice(-5).join('\n')}`)
}

// ---------------------------------------------------------------- 3. plugins
step('Plugins')
const pluginState = {}
if (SKIP_PLUGINS) log('  skipped (--skip-plugins)')
else if (!hasClaude) warn('skipped plugins: no claude CLI')
else {
  for (const m of plugins.marketplaces) {
    const r = run('claude', ['plugin', 'marketplace', 'add', m.source], { allowFail: true, quiet: true })
    log(`  marketplace ${m.name}: ${r.ok ? 'ok' : /already/i.test(r.out) ? 'already added' : 'FAILED'}`)
    if (!r.ok && !/already/i.test(r.out)) warn(`marketplace ${m.source}: ${r.out}`)
    else run('claude', ['plugin', 'marketplace', 'update', m.name], { allowFail: true, quiet: true })
  }
  for (const [group, list] of [['global', plugins.global], ['project', plugins.project]]) {
    for (const p of list) {
      const r = run('claude', ['plugin', 'install', p.id, '--scope', 'user'], { allowFail: true, quiet: true })
      const ok = r.ok || /already installed/i.test(r.out)
      pluginState[p.id] = group === 'global'
      log(`  ${ok ? '+' : 'x'} ${p.id}${group === 'project' ? ' (off until a project enables it)' : ''}`)
      if (!ok) warn(`plugin ${p.id}: ${r.out.split('\n').slice(-2).join(' ')}`)
    }
  }
}

// ---------------------------------------------------------------- 4. skills, agents, rules
step('Skills, agents and rules')
const prev = readJson(MANIFEST, { files: [] })
const items = []
const listDirs = (p) => (existsSync(p) ? readdirSync(p).filter((n) => statSync(join(p, n)).isDirectory()) : [])
const listMd = (p) => (existsSync(p) ? readdirSync(p).filter((n) => n.endsWith('.md')) : [])
for (const base of ['vendor/ecc/skills', 'skills']) for (const n of listDirs(join(ROOT, base))) items.push([join(base, n), join('skills', n)])
for (const base of ['vendor/ecc/agents', 'agents']) for (const n of listMd(join(ROOT, base))) items.push([join(base, n), join('agents', n)])
for (const n of listDirs(join(ROOT, 'vendor/ecc/rules'))) items.push([join('vendor/ecc/rules', n), join('rules', 'ecc', n)])
items.push(['vendor/ecc/LICENSE', join('rules', 'ecc', 'LICENSE')])
items.push(['global/statusline.mjs', join('claude-setup', 'statusline.mjs')])

const now = new Set(items.map(([, dest]) => dest))
for (const old of prev.files) {
  if (!now.has(old)) { if (!DRY) rmSync(join(CLAUDE_DIR, old), { recursive: true, force: true }); log(`  - removed ${old}`) }
}
let replacedUserFiles = 0
for (const [src, dest] of items) {
  const target = join(CLAUDE_DIR, dest)
  if (existsSync(target) && !prev.files.includes(dest)) {
    // Something with this name existed before we managed it: keep a copy.
    if (!DRY) { mkdirSync(dirname(join(backupDir, dest)), { recursive: true }); cpSync(target, join(backupDir, dest), { recursive: true }) }
    replacedUserFiles++
  }
  if (!DRY) { rmSync(target, { recursive: true, force: true }); mkdirSync(dirname(target), { recursive: true }); cpSync(join(ROOT, src), target, { recursive: true }) }
}
const count = (prefix) => items.filter(([, d]) => d.startsWith(prefix)).length
log(`  ${count('skills')} skills, ${count('agents')} agents, ${count(join('rules', 'ecc')) - 1} rule packs`)
if (replacedUserFiles) log(`  ${replacedUserFiles} existing file(s) with the same names were backed up to ${backupDir}`)
write(MANIFEST, JSON.stringify({ version: 1, source: ROOT, installedAt: new Date().toISOString(), files: [...now] }, null, 2) + '\n')

// ---------------------------------------------------------------- 5. CLAUDE.md
step('CLAUDE.md')
const claudeMdPath = join(CLAUDE_DIR, 'CLAUDE.md')
const block = `${START}\n${readFileSync(join(ROOT, 'global/CLAUDE.md'), 'utf8').trim()}\n${END}`
const current = existsSync(claudeMdPath) ? readFileSync(claudeMdPath, 'utf8') : ''
const s = current.indexOf(START.slice(0, 26))
const e = current.indexOf(END)
const next = s >= 0 && e > s
  ? current.slice(0, s) + block + current.slice(e + END.length)
  : (current.trim() ? `${block}\n\n${current.trim()}\n` : `${block}\n`)
write(claudeMdPath, next)
log(`  managed block ${s >= 0 ? 'updated' : 'added'}${current.trim() && s < 0 ? ' (your existing notes kept below it)' : ''}`)

// ---------------------------------------------------------------- 6. settings.json
step('settings.json')
const settingsPath = join(CLAUDE_DIR, 'settings.json')
const settings = readJson(settingsPath, {})
const ours = readJson(join(ROOT, 'global/settings.json'))
const union = (a = [], b = []) => [...new Set([...a, ...b])]
function merge(dst, src) {
  for (const [k, v] of Object.entries(src)) {
    if (Array.isArray(v)) dst[k] = union(dst[k], v)
    else if (v && typeof v === 'object') dst[k] = merge(dst[k] && typeof dst[k] === 'object' ? dst[k] : {}, v)
    else dst[k] = v
  }
  return dst
}
merge(settings, ours)
// A rule we deny must not also be allowed by an older entry.
settings.permissions.allow = settings.permissions.allow.filter((r) => !settings.permissions.deny.includes(r))
settings.statusLine = { type: 'command', command: `node "${join(CLAUDE_DIR, 'claude-setup', 'statusline.mjs')}"`, padding: 0 }
settings.env ??= {}
if (!SKIP_HOOKS) {
  settings.env.ECC_HOOK_PROFILE = ecc.hooks.profile
  settings.env.ECC_GATEGUARD = 'off'
  settings.env.ECC_DISABLED_HOOKS = union((settings.env.ECC_DISABLED_HOOKS || '').split(',').filter(Boolean), ecc.hooks.disabled).join(',')
}
settings.extraKnownMarketplaces ??= {}
for (const m of plugins.marketplaces) {
  const [owner, repo] = m.source.split('/')
  settings.extraKnownMarketplaces[m.name] ??= { source: { source: 'github', repo: `${owner}/${repo}` } }
}
settings.enabledPlugins ??= {}
for (const p of plugins.global) settings.enabledPlugins[p.id] = true
for (const p of plugins.project) settings.enabledPlugins[p.id] = false
// The full ECC plugin would load ~45k tokens per session on top of the curated copy.
if (settings.enabledPlugins['ecc@ecc']) { settings.enabledPlugins['ecc@ecc'] = false; warn('turned off the full ecc@ecc plugin: this setup installs a curated part of it instead') }
write(settingsPath, JSON.stringify(settings, null, 2) + '\n')
log(`  merged (permissions mode: ${settings.permissions.defaultMode}, ${Object.values(settings.enabledPlugins).filter(Boolean).length} plugins on)`)

// ---------------------------------------------------------------- done
step(DRY ? 'Dry run finished' : 'Done')
if (warnings.length) { log(`${warnings.length} warning(s):`); for (const w of warnings) log(`  - ${w.split('\n')[0]}`) }
log(`Start a new Claude Code session (or run /reload-plugins) to load everything.
Backup of your previous config: ${existsSync(backupDir) ? backupDir : '(nothing to back up)'}
Update later with: git -C "${ROOT}" pull && node "${join(ROOT, 'install.mjs')}"`)
