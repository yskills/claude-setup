#!/usr/bin/env node
// Copies the curated ECC subset listed in config/ecc.json from an ECC checkout into .claude/
// (skills, agents, rules/ecc). Our own skills and agents in .claude/ are left alone.
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
const out = join(root, '.claude');
const prev = existsSync(join(root, 'THIRD_PARTY.md')) ? readFileSync(join(root, 'THIRD_PARTY.md'), 'utf8') : '';
// THIRD_PARTY.md has one section per source. This script owns the ECC one; the others are kept.
const sections = prev.split(/\n(?=## )/).slice(1);
const eccPrev = sections.find((x) => x.startsWith('## Everything Claude Code')) ?? '';
const others = sections.filter((x) => !x.startsWith('## Everything Claude Code'));
// Remove what the previous sync wrote (listed in its section), so dropped items disappear.
for (const m of eccPrev.matchAll(/^- (skills|agents)\/([a-z0-9-]+)/gm)) rmSync(join(out, m[1], m[1] === 'agents' ? `${m[2]}.md` : m[2]), { recursive: true, force: true });
rmSync(join(out, 'rules', 'ecc'), { recursive: true, force: true });
mkdirSync(join(out, 'skills'), { recursive: true });
mkdirSync(join(out, 'agents'), { recursive: true });
mkdirSync(join(out, 'rules', 'ecc'), { recursive: true });

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
  cpSync(p, join(out, 'rules', 'ecc', r), { recursive: true });
}
for (const x of cfg.ruleExcludes ?? []) rmSync(join(out, 'rules', 'ecc', x), { force: true });
mkdirSync(join(root, 'licenses'), { recursive: true });
cpSync(join(src, 'LICENSE'), join(root, 'licenses', 'ECC-LICENSE'));

let commit = 'unknown';
try { commit = execFileSync('git', ['-C', src, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(); } catch {}
writeFileSync(join(root, 'THIRD_PARTY.md'),
  `# Third-party content\n\n` +
  `## Everything Claude Code\n\n` +
  `Source: ${cfg.repo} (MIT, see licenses/ECC-LICENSE)\n` +
  `Version: ${cfg.version}\nCommit: ${commit}\n\n` +
  `Copied by scripts/sync-ecc.mjs from the list in config/ecc.json. Do not edit these by hand;\n` +
  `change config/ecc.json and re-run the script.\n\n` +
  cfg.skills.map((x) => `- skills/${x}\n`).join('') +
  cfg.agents.map((x) => `- agents/${x}\n`).join('') +
  `- rules/ecc (${cfg.rules.join(', ')})\n` +
  others.map((x) => `\n${x.trimEnd()}\n`).join(''));

// Index of every ECC skill, so the toolbox skill can find and pull in extras per project.
const index = []
for (const name of readdirSync(join(src, 'skills')).sort()) {
  const f = join(src, 'skills', name, 'SKILL.md')
  if (!existsSync(f)) continue
  const fm = readFileSync(f, 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/)
  const desc = fm?.[1].match(/^description:\s*(.*)$/m)?.[1].replace(/^["']|["']$/g, '') ?? ''
  index.push({ name, description: desc.slice(0, 300), installedGlobally: cfg.skills.includes(name) })
}
writeFileSync(join(root, '.claude/skills/toolbox/ecc-index.json'),
  JSON.stringify({ repo: cfg.repo, version: cfg.version, commit, skills: index }, null, 1) + '\n')

if (commit !== cfg.commit) console.warn(`warning: checkout is at ${commit}, config/ecc.json pins ${cfg.commit}`);
if (missing.length) { console.error(`missing in ECC checkout: ${missing.join(', ')}`); process.exit(1); }
console.log(`indexed ${index.length} ECC skills; vendored ${cfg.skills.length} skills, ${cfg.agents.length} agents, ${cfg.rules.length} rule packs from ECC ${cfg.version}`);
