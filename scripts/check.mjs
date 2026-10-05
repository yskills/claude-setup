#!/usr/bin/env node
// Validates the repo: JSON parses, every skill and agent has name/description frontmatter,
// every name is unique, and the vendored ECC subset matches config/ecc.json.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const errors = []
const json = (p) => { try { return JSON.parse(readFileSync(join(root, p), 'utf8')) } catch (e) { errors.push(`${p}: ${e.message}`); return null } }

for (const p of ['config/ecc.json', 'config/plugins.json', 'global/settings.json', '.claude/settings.json', '.claude/skills/onboard-project/templates/settings.json', '.claude/skills/operator/templates/features.json', '.claude/skills/operator/templates/metrics.json']) json(p)

function frontmatter(file) {
  const m = readFileSync(file, 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!m) return null
  const out = {}
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([a-zA-Z_-]+):\s*(.*)$/)
    if (kv) out[kv[1]] = kv[2]
  }
  return out
}

const dirs = (p) => (existsSync(join(root, p)) ? readdirSync(join(root, p)).filter((n) => statSync(join(root, p, n)).isDirectory()) : [])
const mds = (p) => (existsSync(join(root, p)) ? readdirSync(join(root, p)).filter((n) => n.endsWith('.md')) : [])
const seen = { skill: new Map(), agent: new Map() }
function check(kind, file, expected) {
  const fm = frontmatter(join(root, file))
  if (!fm) return errors.push(`${file}: missing frontmatter`)
  if (!fm.name) errors.push(`${file}: missing name`)
  if (!fm.description) errors.push(`${file}: missing description`)
  if (fm.name && fm.name !== expected) errors.push(`${file}: name "${fm.name}" does not match "${expected}"`)
  if (seen[kind].has(expected)) errors.push(`${kind} "${expected}" defined twice: ${seen[kind].get(expected)} and ${file}`)
  seen[kind].set(expected, file)
}
for (const n of dirs('.claude/skills')) check('skill', `.claude/skills/${n}/SKILL.md`, n)
for (const f of mds('.claude/agents')) check('agent', `.claude/agents/${f}`, f.replace(/\.md$/, ''))

const ecc = json('config/ecc.json')
if (ecc) {
  const skills = new Set(dirs('.claude/skills'))
  for (const s of ecc.skills) if (!skills.has(s)) errors.push(`config/ecc.json lists skill ${s} but .claude/skills/${s} is missing; run scripts/sync-ecc.mjs`)
  const agents = new Set(mds('.claude/agents').map((f) => f.replace(/\.md$/, '')))
  for (const a of ecc.agents) if (!agents.has(a)) errors.push(`config/ecc.json lists agent ${a} but it is not vendored`)
  for (const r of ecc.rules) if (!existsSync(join(root, '.claude/rules/ecc', r))) errors.push(`rules pack ${r} is not vendored`)
}

const plugins = json('config/plugins.json')
if (plugins) {
  const ids = [...plugins.global, ...plugins.project].map((p) => p.id)
  for (const id of ids) if (!/^[a-z0-9-]+@[a-z0-9-]+$/.test(id)) errors.push(`config/plugins.json: bad plugin id ${id}`)
  if (new Set(ids).size !== ids.length) errors.push('config/plugins.json: duplicate plugin id')
  // cloud/setup.sh installs the global plugins in cloud threads; it must list exactly the same ones,
  // minus those marked "cloud": false (Context7 asks for a sign-in a thread can't do).
  const sh = readFileSync(join(root, 'cloud/setup.sh'), 'utf8')
  const shIds = [...sh.matchAll(/^\s+([a-z0-9-]+@[a-z0-9-]+)/gm)].map((m) => m[1])
  const want = plugins.global.filter((p) => p.cloud !== false).map((p) => p.id)
  if (shIds.join() !== want.join()) errors.push('cloud/setup.sh plugin list differs from config/plugins.json global')
  // Plugins come from setup.sh at user scope; a second list in the repo's settings would drift.
  if (json('.claude/settings.json')?.enabledPlugins) errors.push('.claude/settings.json must not list plugins; cloud/setup.sh installs them')
  for (const m of plugins.marketplaces) if (!sh.includes(`marketplace add ${m.source}`)) errors.push(`cloud/setup.sh does not add marketplace ${m.source}`)
}

// Every ECC skill a toolbox catalog names must exist in the ECC index.
const index = json('.claude/skills/toolbox/ecc-index.json')
if (index) {
  const names = new Set(index.skills.map((x) => x.name))
  for (const f of readdirSync(join(root, '.claude/skills/toolbox/catalog'))) {
    for (const m of readFileSync(join(root, '.claude/skills/toolbox/catalog', f), 'utf8').matchAll(/ECC skills? ([^|\n]*)/g)) {
      for (const n of m[1].matchAll(/`([a-z0-9-]+)`/g)) if (!names.has(n[1])) errors.push(`catalog/${f}: unknown ECC skill ${n[1]}`)
    }
  }
}

if (errors.length) { console.error(errors.map((e) => `x ${e}`).join('\n')); process.exit(1) }
console.log(`ok: ${seen.skill.size} skills, ${seen.agent.size} agents, ${plugins?.global.length ?? 0}+${plugins?.project.length ?? 0} plugins`)
