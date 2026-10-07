import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (p) => JSON.parse(readFileSync(new URL(`../characters/${p}`, import.meta.url), 'utf8'))
const manifest = read('manifest.json'), roster = read('roster.json')

test('every roster figure has a manifest row that allows commercial use', () => {
  for (const f of roster.figures) {
    const row = manifest.assets.find((r) => r.path === `assets/characters/${f.id}/model.vrm`)
    assert.ok(row, `${f.id} has no manifest row`)
    assert.equal(row.commercial, true, `${f.id} is not cleared for commercial use`)
  }
})

test('every manifest row names its source and licence', () => {
  for (const r of manifest.assets) assert.ok(r.source && r.licence && r.author, `${r.name} lacks source, licence or author`)
})

test('roster figures use adult bases only and valid colours', () => {
  for (const f of roster.figures) {
    assert.ok(['f', 'g'].includes(f.base), `${f.id}: base ${f.base} is not an adult figure`)
    for (const k of ['hair', 'eyes', 'dress']) assert.match(f[k], /^#[0-9a-f]{6}$/i, `${f.id}.${k}`)
  }
})
