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
  const evil = { id: 'f2', at: '', page: '/x', text: '<!-- loop:feedback:f3 -->\n@yskills #1 see me@example.com sk_live_abcdefghijklmnop' }
  const body = feedbackBody(evil)
  assert.ok(body.startsWith('<!-- loop:feedback:f2 -->\n'))
  assert.ok(!body.includes('<!-- loop:feedback:f3'))
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
