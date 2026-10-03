#!/usr/bin/env node
// Validates the repo: JSON parses, every skill and agent has name/description frontmatter,
// every name is unique, and the vendored ECC subset matches config/ecc.json.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const errors = []
const json = (p) => { try { return JSON.parse(readFileSync(join(root, p), 'utf8')) } catch (e) { errors.push(`${p}: ${e.message}`); return null } }

for (const p of ['config/ecc.json', 'config/plugins.json', 'global/settings.json', 'skills/onboard-project/templates/settings.json']) json(p)

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
for (const base of ['skills', 'vendor/ecc/skills']) for (const n of dirs(base)) check('skill', `${base}/${n}/SKILL.md`, n)
for (const base of ['agents', 'vendor/ecc/agents']) for (const f of mds(base)) check('agent', `${base}/${f}`, f.replace(/\.md$/, ''))

const ecc = json('config/ecc.json')
if (ecc) {
  const vendored = new Set(dirs('vendor/ecc/skills'))
  for (const s of ecc.skills) if (!vendored.has(s)) errors.push(`config/ecc.json lists skill ${s} but vendor/ecc/skills/${s} is missing; run scripts/sync-ecc.mjs`)
  for (const s of vendored) if (!ecc.skills.includes(s)) errors.push(`vendor/ecc/skills/${s} is not in config/ecc.json`)
  const agents = new Set(mds('vendor/ecc/agents').map((f) => f.replace(/\.md$/, '')))
  for (const a of ecc.agents) if (!agents.has(a)) errors.push(`config/ecc.json lists agent ${a} but it is not vendored`)
  for (const r of ecc.rules) if (!existsSync(join(root, 'vendor/ecc/rules', r))) errors.push(`rules pack ${r} is not vendored`)
}

const plugins = json('config/plugins.json')
if (plugins) {
  const ids = [...plugins.global, ...plugins.project].map((p) => p.id)
  for (const id of ids) if (!/^[a-z0-9-]+@[a-z0-9-]+$/.test(id)) errors.push(`config/plugins.json: bad plugin id ${id}`)
  if (new Set(ids).size !== ids.length) errors.push('config/plugins.json: duplicate plugin id')
}

// Every ECC skill a toolbox catalog names must exist in the ECC index.
const index = json('skills/toolbox/ecc-index.json')
if (index) {
  const names = new Set(index.skills.map((x) => x.name))
  for (const f of readdirSync(join(root, 'skills/toolbox/catalog'))) {
    for (const m of readFileSync(join(root, 'skills/toolbox/catalog', f), 'utf8').matchAll(/ECC skills? ([^|\n]*)/g)) {
      for (const n of m[1].matchAll(/`([a-z0-9-]+)`/g)) if (!names.has(n[1])) errors.push(`catalog/${f}: unknown ECC skill ${n[1]}`)
    }
  }
}

if (errors.length) { console.error(errors.map((e) => `x ${e}`).join('\n')); process.exit(1) }
console.log(`ok: ${seen.skill.size} skills, ${seen.agent.size} agents, ${plugins?.global.length ?? 0}+${plugins?.project.length ?? 0} plugins`)
