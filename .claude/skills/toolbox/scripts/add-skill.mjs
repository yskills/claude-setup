#!/usr/bin/env node
// Copy ECC skills into the current project's .claude/skills/, pinned to the ECC version the
// global setup uses. Keeps a shallow ECC checkout in ~/.claude/claude-setup/cache/ECC-<version>.
//   node add-skill.mjs video-editing fal-ai-media [--global]
import { spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const args = process.argv.slice(2)
const global = args.includes('--global')
const names = args.filter((a) => !a.startsWith('--'))
if (!names.length) {
  console.error('Usage: node add-skill.mjs <ecc-skill> [<ecc-skill>...] [--global]')
  process.exit(1)
}

const idx = JSON.parse(readFileSync(join(here, '..', 'ecc-index.json'), 'utf8'))
const known = new Set(idx.skills.map((s) => s.name))
const unknown = names.filter((n) => !known.has(n))
if (unknown.length) {
  console.error(`Not ECC skills: ${unknown.join(', ')}. Search with: node ${join(here, 'find.mjs')} <keyword>`)
  process.exit(1)
}

const claudeDir = process.env.CLAUDE_CONFIG_DIR || join(homedir(), '.claude')
const cache = join(claudeDir, 'claude-setup', 'cache', `ECC-${idx.version}`)
if (!existsSync(join(cache, 'skills'))) {
  rmSync(cache, { recursive: true, force: true })
  mkdirSync(dirname(cache), { recursive: true })
  console.log(`Fetching ECC v${idx.version}...`)
  const r = spawnSync('git', ['clone', '--quiet', '--depth', '1', '--branch', `v${idx.version}`, `${idx.repo}.git`, cache],
    { stdio: 'inherit', shell: process.platform === 'win32' })
  if (r.status !== 0) { console.error('git clone failed'); process.exit(1) }
}

const target = global ? join(claudeDir, 'skills') : join(process.cwd(), '.claude', 'skills')
mkdirSync(target, { recursive: true })
for (const n of names) {
  const src = join(cache, 'skills', n)
  if (!existsSync(src)) { console.error(`missing in ECC v${idx.version}: ${n}`); process.exitCode = 1; continue }
  rmSync(join(target, n), { recursive: true, force: true })
  cpSync(src, join(target, n), { recursive: true })
  console.log(`+ ${n} -> ${join(target, n)}`)
}
console.log('Start a new session (or /reload-plugins) to load the new skills.')
