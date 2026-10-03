#!/usr/bin/env node
// Copies the curated ECC subset listed in config/ecc.json from an ECC checkout into vendor/ecc.
// Usage: node scripts/sync-ecc.mjs <path-to-ECC-checkout>
// Check out the tag you want first (git -C <path> checkout vX.Y.Z), then update
// "version" and "commit" in config/ecc.json and re-run.
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = process.argv[2];
if (!src || !existsSync(join(src, 'agents'))) {
  console.error('Usage: node scripts/sync-ecc.mjs <path-to-ECC-checkout>');
  process.exit(1);
}

const cfg = JSON.parse(readFileSync(join(root, 'config/ecc.json'), 'utf8'));
const out = join(root, 'vendor/ecc');
rmSync(out, { recursive: true, force: true });
mkdirSync(join(out, 'skills'), { recursive: true });
mkdirSync(join(out, 'agents'), { recursive: true });
mkdirSync(join(out, 'rules'), { recursive: true });

const missing = [];
for (const s of cfg.skills) {
  const p = join(src, 'skills', s);
  if (!existsSync(p)) { missing.push(`skill ${s}`); continue; }
  cpSync(p, join(out, 'skills', s), { recursive: true });
}
for (const a of cfg.agents) {
  const p = join(src, 'agents', `${a}.md`);
  if (!existsSync(p)) { missing.push(`agent ${a}`); continue; }
  cpSync(p, join(out, 'agents', `${a}.md`));
}
for (const r of cfg.rules) {
  const p = join(src, 'rules', r);
  if (!existsSync(p)) { missing.push(`rules ${r}`); continue; }
  cpSync(p, join(out, 'rules', r), { recursive: true });
}
for (const x of cfg.ruleExcludes ?? []) rmSync(join(out, 'rules', x), { force: true });
cpSync(join(src, 'LICENSE'), join(out, 'LICENSE'));

let commit = 'unknown';
try { commit = execFileSync('git', ['-C', src, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(); } catch {}
writeFileSync(join(out, 'SOURCE.md'),
  `# Vendored from Everything Claude Code\n\n` +
  `Source: ${cfg.repo} (MIT, see LICENSE in this folder)\n` +
  `Version: ${cfg.version}\nCommit: ${commit}\n\n` +
  `Only the subset listed in config/ecc.json is copied. Do not edit these files by hand;\n` +
  `change config/ecc.json and run \`node scripts/sync-ecc.mjs <ECC checkout>\`.\n`);

// Index of every ECC skill, so the toolbox skill can find and pull in extras per project.
const index = []
for (const name of readdirSync(join(src, 'skills')).sort()) {
  const f = join(src, 'skills', name, 'SKILL.md')
  if (!existsSync(f)) continue
  const fm = readFileSync(f, 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/)
  const desc = fm?.[1].match(/^description:\s*(.*)$/m)?.[1].replace(/^["']|["']$/g, '') ?? ''
  index.push({ name, description: desc.slice(0, 300), installedGlobally: cfg.skills.includes(name) })
}
writeFileSync(join(root, 'skills/toolbox/ecc-index.json'),
  JSON.stringify({ repo: cfg.repo, version: cfg.version, commit, skills: index }, null, 1) + '\n')

if (commit !== cfg.commit) console.warn(`warning: checkout is at ${commit}, config/ecc.json pins ${cfg.commit}`);
if (missing.length) { console.error(`missing in ECC checkout: ${missing.join(', ')}`); process.exit(1); }
console.log(`indexed ${index.length} ECC skills; vendored ${cfg.skills.length} skills, ${cfg.agents.length} agents, ${cfg.rules.length} rule packs from ECC ${cfg.version}`);
