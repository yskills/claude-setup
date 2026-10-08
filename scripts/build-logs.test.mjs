import { test } from 'node:test'
import assert from 'node:assert/strict'
import { logLines, latestBuild, scrub } from './build-logs.mjs'

test('logLines keeps the tail and reads [time, text] pairs and plain strings', () => {
  const json = { result: { lines: [['t1', 'one'], ['t2', 'two'], 'three'] } }
  assert.deepEqual(logLines(json, 2), ['two', 'three'])
  assert.deepEqual(logLines(null), [])
})

test('logLines hides ids and token-like strings', () => {
  const json = { result: { lines: [['t', 'hook 764d0fbf-4683-4d83-8d3c-16b144363ff2 worker 2e53788183964d888ce090f30ea2ea32']] } }
  assert.deepEqual(logLines(json), ['hook *** worker ***'])
})

test('latestBuild picks the newest by created_on', () => {
  const builds = [{ build_uuid: 'a', created_on: '2026-10-08T20:01:00Z' }, { build_uuid: 'b', created_on: '2026-10-08T20:05:00Z' }]
  assert.equal(latestBuild(builds).build_uuid, 'b')
  assert.equal(latestBuild([]), null)
})

test('scrub hides secret-looking pairs, URL credentials and bearer headers', () => {
  assert.equal(scrub('STRIPE_SECRET_KEY=sk_test_abc api_key: "x y"'), 'STRIPE_SECRET_KEY=*** api_key: ***')
  assert.equal(scrub('fetch https://user:pa55@example.com/x'), 'fetch https://***@example.com/x')
  assert.equal(scrub('Authorization: Bearer abc.def'), 'Authorization: *** ***')
  assert.equal(scrub('npm run build ok'), 'npm run build ok')
})
