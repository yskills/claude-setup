import { test } from 'node:test'
import assert from 'node:assert/strict'
import { plan, fingerprintTitle, isUrgent, errorBody } from './loop.mjs'

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
  const open = [{ number: 7, body: errorBody(err) }, { number: 8, body: '<!-- loop:feedback:f1 -->' }]
  assert.deepEqual(plan({ errors: [err], feedback: [fb] }, open), [])
  const grown = plan({ errors: [{ ...err, count: 9 }] }, open)
  assert.equal(grown.length, 1)
  assert.equal(grown[0].op, 'comment')
  assert.equal(grown[0].number, 7)
})

test('long messages and missing lists are safe', () => {
  const a = plan({ errors: [{ ...err, message: 'x'.repeat(500) }] }, [])
  assert.ok(fingerprintTitle({ ...err, message: 'x'.repeat(500) }).length < 120)
  assert.equal(a.length, 1)
  assert.deepEqual(plan({}, []), [])
})
