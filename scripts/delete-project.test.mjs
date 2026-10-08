import { test } from 'node:test'
import assert from 'node:assert/strict'
import { checkRequest, madeByWorkflow, MARKER } from './delete-project.mjs'

test('nothing is deleted without the name typed twice', () => {
  assert.throws(() => checkRequest({ name: 'app', confirm: 'ap', org: 'yverse-studio' }), /confirm must repeat/)
  assert.throws(() => checkRequest({ name: 'app', confirm: '', org: 'yverse-studio' }), /confirm must repeat/)
  assert.throws(() => checkRequest({ name: 'App!', confirm: 'App!', org: 'yverse-studio' }), /lowercase/)
  assert.doesNotThrow(() => checkRequest({ name: 'app', confirm: 'app', org: 'yverse-studio' }))
})

test('only repos new-project made can be deleted', () => {
  assert.ok(madeByWorkflow({ description: MARKER }))
  assert.ok(!madeByWorkflow({ description: 'Claude setup toolkit' }))
  assert.ok(!madeByWorkflow({ description: null }))
})

test('new-project still writes the marker delete-project looks for', async () => {
  const { readFileSync } = await import('node:fs')
  assert.ok(readFileSync(new URL('./new-project.mjs', import.meta.url), 'utf8').includes(`description: '${MARKER}'`))
})
