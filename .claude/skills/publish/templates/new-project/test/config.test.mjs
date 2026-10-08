import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const config = JSON.parse(readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8'))

test('previews take nothing from production', () => {
  assert.ok(config.previews, 'wrangler.jsonc needs a previews block')
  assert.equal(config.workers_dev, true)
  assert.equal(config.preview_urls, true)
  const live = config.d1_databases ?? []
  const preview = config.previews.d1_databases ?? []
  assert.equal(preview.length, live.length, 'every binding needs a preview resource')
  for (const db of live) {
    const twin = preview.find((p) => p.binding === db.binding)
    assert.ok(twin, `preview binding ${db.binding}`)
    assert.notEqual(twin.database_id, db.database_id, 'a preview must not use the live database')
    assert.equal(twin.database_id, db.preview_database_id)
  }
})
