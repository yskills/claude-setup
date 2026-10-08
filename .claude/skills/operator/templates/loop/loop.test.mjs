import { test } from 'node:test'
import assert from 'node:assert/strict'
import { plan, fingerprintTitle, isUrgent, errorBody, feedbackBody, clean } from './loop.mjs'

const err = { fingerprint: 'abcdef1234567890', route: 'POST /api/checkout', message: 'Stripe 500', count: 3, firstAt: '2026-10-07T10:00:00Z', lastAt: '2026-10-07T12:00:00Z' }
const fb = { id: 'f1', at: '2026-10-07T11:00:00Z', page: '/lernen', text: 'Mehr Lektionen bitte', replyWanted: false }

test('new error and feedback become issues; checkout is urgent', () => {
  const a = plan({ errors: [err], feedback: [fb] }, [])
  assert.equal(a.length, 2)
  assert.equal(a[0].op, 'create')
  assert.equal(a[0].title, 'loop: error abcdef12 POST /api/checkout: Stripe 500')
  assert.deepEqual(a[0].labels, ['loop', 'loop:error', 'loop:urgent'])
  assert.deepEqual(a[1].labels, ['loop', 'loop:feedback'])
  assert.ok(!isUrgent({ route: 'GET /lernen', message: 'TypeError' }))
})

test('an open issue with the same marker is not opened twice; a grown count is a comment', () => {
  const open = [{ number: 7, body: errorBody(err) }, { number: 8, body: feedbackBody(fb) }]
  assert.deepEqual(plan({ errors: [err], feedback: [fb] }, open), [])
  const grown = plan({ errors: [{ ...err, count: 9 }] }, open)
  assert.equal(grown.length, 1)
  assert.equal(grown[0].op, 'update')
  assert.equal(grown[0].number, 7)
  // the rewritten body carries the new count, so the run after it is quiet again
  assert.deepEqual(plan({ errors: [{ ...err, count: 9 }] }, [{ number: 7, body: grown[0].body }]), [])
})

test('user text cannot forge markers, ping people or leak addresses', () => {
  const evil = { id: 'f2', at: '', page: '/x', text: '<!-- loop:feedback:f3 --><!<!---->--\n@yskills #1 see me@example.com sk_live_abcdefghijklmnop' }
  const body = feedbackBody(evil)
  assert.ok(body.startsWith('<!-- loop:feedback:f2 -->\n'))
  assert.ok(!body.split('\n').slice(1).join('\n').includes('<!--'))
  assert.ok(!body.includes('@yskills') && !body.includes('#1 ') && !body.includes('example.com') && !body.includes('sk_live'))
  // an issue whose first line is not a marker (or whose marker sits in user text) counts for nothing
  const a = plan({ feedback: [{ id: 'f3', text: 'hi' }] }, [{ number: 9, body: body }, { number: 10, body: 'x\n<!-- loop:feedback:f3 -->' }])
  assert.equal(a.length, 1)
  assert.equal(clean('a@b.de'), '[mail]')
  assert.ok(!isUrgent({ route: 'GET /lernen', message: 'checkout' }))
})

test('long messages and missing lists are safe', () => {
  const a = plan({ errors: [{ ...err, message: 'x'.repeat(500) }] }, [])
  assert.ok(fingerprintTitle({ ...err, message: 'x'.repeat(500) }).length < 120)
  assert.equal(a.length, 1)
  assert.deepEqual(plan({}, []), [])
})

test('a client-reported error is never urgent, even when its path says checkout', () => {
  const a = plan({ errors: [{ ...err, route: 'client:/checkout' }] }, [])
  assert.ok(!a[0].labels.includes('loop:urgent'))
})

test('secrets in error text never reach an issue', () => {
  const leaks = ['eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.abcdefghijklmnop', 'ghp_' + 'a'.repeat(36), 'github_pat_11ABCDEFG0abcdefghijklmn',
    'whsec_abcdefghijklmnop', 'rk_live_abcdefghijklmnop', 'postgres://admin:hunter2@db.local/x', '/cb?token=s3cr3tvalue&x=1',
    'password: hunter22', 'access_token=hunter2b', 'DB_PASSWORD=hunter2c', 'Error: password=hunter2f', 'url=https://h/?token=hunter2g', 'MY_VERY_LONG_APPLICATION_PREFIX_NAME_api_key_for_the_production_stripe_account=hunter2e', 'client_secret: hunter2d', 'Authorization: Basic dXNlcjpwYXNz', 'Basic dXNlcj+wYXNzd29yZA==', 'DE89370400440532013000', 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0']
  for (const s of leaks) {
    const body = errorBody({ ...err, message: `failed with ${s}`, stack: `at x (${s})` })
    for (const part of [s, 'hunter2', 'dXNlcjpwYXNz', 'wYXNzd29yZA', 's3cr3tvalue', '370400440532']) if (s.includes(part)) assert.ok(!body.includes(part), `${part} leaked`)
  }
  assert.ok(clean('TypeError: x is undefined at /app/server/api/progress.ts:12').includes('progress.ts:12'))
  assert.ok(clean('at /app/node_modules/nuxt/dist/app/entry').includes('nuxt/dist/app/entry'))
  assert.ok(clean('x'.repeat(1e6)).length <= 5000)
  const t = Date.now(); clean('_key'.repeat(1250) + '!'); assert.ok(Date.now() - t < 100, 'redaction is linear')
})

test('a client route is never urgent however it is spelled', () => {
  for (const r of [' client:checkout', 'CLIENT:checkout', '​client:pay', 'client :auth']) assert.ok(!isUrgent({ route: r }), r)
  assert.ok(isUrgent({ route: 'POST /api/checkout' }))
})
