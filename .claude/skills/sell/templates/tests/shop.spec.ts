// Goes to tests/e2e/. Runs against `wrangler dev` with a local D1, the same code path as production.
// playwright.config.ts starts it with `--var STRIPE_WEBHOOK_SECRET:${WEBHOOK_SECRET}`, and with
// STRIPE_MOCK set (CI runs stripe-mock as a service) also points the Stripe client at the mock.
// See stripe-workers.md.
import { execFileSync } from 'node:child_process'
import { expect, test, type APIRequestContext } from '@playwright/test'
import Stripe from 'stripe'
import { WEBHOOK_SECRET } from '../../playwright.config'

const stripe = new Stripe('sk_test_unused')
let counter = 0

function d1(sql: string): Array<Record<string, unknown>> {
  const out = execFileSync('npx', ['wrangler', 'd1', 'execute', 'DB', '--local', '--json', '--command', sql], { encoding: 'utf8' })
  return JSON.parse(out)[0].results
}

/** A pending order as the checkout endpoint writes it, without calling Stripe. */
function seedOrder(): string {
  const id = `order-${Date.now()}-${++counter}`
  const items = JSON.stringify([{ id: 'example-mug', name: 'Beispieltasse', quantity: 1, unitAmount: 1900 }])
  d1(`INSERT INTO orders (id, status, items, email, country, stripe_session_id, created_at) VALUES ('${id}', 'pending', '${items}', 'kunde@example.com', 'DE', 'cs_test_${id}', 0)`)
  return id
}

const statusOf = (id: string) => d1(`SELECT status FROM orders WHERE id = '${id}'`)[0]?.status

function stripeEvent(type: string, object: Record<string, unknown>) {
  return JSON.stringify({ id: `evt_${Date.now()}_${++counter}`, object: 'event', type, data: { object } })
}

function session(orderId: string, paymentStatus: 'paid' | 'unpaid') {
  return {
    id: `cs_test_${orderId}`,
    object: 'checkout.session',
    client_reference_id: orderId,
    payment_status: paymentStatus,
    payment_intent: `pi_${orderId}`,
    amount_total: 2490,
    currency: 'eur',
  }
}

async function signedPost(request: APIRequestContext, payload: string, secret = WEBHOOK_SECRET) {
  const signature = await stripe.webhooks.generateTestHeaderStringAsync({ payload, secret })
  return request.post('/api/stripe/webhook', { headers: { 'stripe-signature': signature, 'content-type': 'application/json' }, data: payload })
}

test('an unsigned or forged webhook is rejected and changes nothing', async ({ request }) => {
  const id = seedOrder()
  const payload = stripeEvent('checkout.session.completed', session(id, 'paid'))
  expect((await request.post('/api/stripe/webhook', { data: payload })).status()).toBe(400)
  expect((await signedPost(request, payload, 'whsec_wrong')).status()).toBe(400)
  expect(statusOf(id)).toBe('pending')
})

test('a paid checkout marks the order paid once, even when Stripe sends it twice', async ({ request }) => {
  const id = seedOrder()
  const payload = stripeEvent('checkout.session.completed', session(id, 'paid'))
  expect((await signedPost(request, payload)).ok()).toBe(true)
  expect((await signedPost(request, payload)).ok()).toBe(true)
  const [order] = d1(`SELECT status, payment_intent, amount_total FROM orders WHERE id = '${id}'`)
  expect(order).toMatchObject({ status: 'paid', payment_intent: `pi_${id}`, amount_total: 2490 })
})

test('a paid session that is not the order\'s own never marks it paid', async ({ request }) => {
  const id = seedOrder()
  // e.g. a cheap Payment Link on the same Stripe account with ?client_reference_id=<this order>
  await signedPost(request, stripeEvent('checkout.session.completed', { ...session(id, 'paid'), id: 'cs_test_someone_else' }))
  expect(statusOf(id)).toBe('pending')
})

test('SEPA: completed unpaid stays pending until the async payment succeeds', async ({ request }) => {
  const id = seedOrder()
  await signedPost(request, stripeEvent('checkout.session.completed', session(id, 'unpaid')))
  expect(statusOf(id)).toBe('pending')
  await signedPost(request, stripeEvent('checkout.session.async_payment_succeeded', session(id, 'paid')))
  expect(statusOf(id)).toBe('paid')
})

test('failed and expired sessions close pending orders but never paid ones', async ({ request }) => {
  const failed = seedOrder()
  await signedPost(request, stripeEvent('checkout.session.async_payment_failed', session(failed, 'unpaid')))
  expect(statusOf(failed)).toBe('failed')

  const paid = seedOrder()
  await signedPost(request, stripeEvent('checkout.session.completed', session(paid, 'paid')))
  await signedPost(request, stripeEvent('checkout.session.expired', session(paid, 'unpaid')))
  expect(statusOf(paid)).toBe('paid')
})

test('a full refund marks the order refunded; a partial one leaves it', async ({ request }) => {
  const id = seedOrder()
  await signedPost(request, stripeEvent('checkout.session.completed', session(id, 'paid')))
  await signedPost(request, stripeEvent('charge.refunded', { id: 'ch_1', object: 'charge', payment_intent: `pi_${id}`, refunded: false, amount_refunded: 500 }))
  expect(statusOf(id)).toBe('paid')
  await signedPost(request, stripeEvent('charge.refunded', { id: 'ch_1', object: 'charge', payment_intent: `pi_${id}`, refunded: true, amount_refunded: 2490 }))
  expect(statusOf(id)).toBe('refunded')
})

const validOrder = {
  items: [{ id: 'example-mug', quantity: 1 }],
  email: 'kunde@example.com',
  address: { name: 'Mia Muster', line1: 'Hauptstr. 1', postalCode: '10115', city: 'Berlin', country: 'DE' },
  shippingRate: 0,
  locale: 'de',
}

test('the order endpoint rejects what it cannot price or ship, before calling Stripe', async ({ request }) => {
  const post = (change: Record<string, unknown>) => request.post('/api/checkout', { data: { ...validOrder, ...change } })
  const address = (change: Record<string, string>) => ({ address: { ...validOrder.address, ...change } })
  expect((await post({ items: [{ id: 'nope', quantity: 1 }] })).status()).toBe(400)
  expect((await post({ items: [{ id: 'constructor', quantity: 1 }] })).status()).toBe(400)
  expect((await post({ items: [{ id: 'example-mug', quantity: 0 }] })).status()).toBe(400)
  expect((await post({ items: [] })).status()).toBe(400)
  expect((await post({ items: Array.from({ length: 4 }, () => ({ id: 'example-mug', quantity: 20 })) })).status()).toBe(400)
  expect((await post({ email: 'not-an-email' })).status()).toBe(400)
  expect((await post(address({ country: 'US' }))).status()).toBe(400)
  expect((await post(address({ postalCode: 'ABC' }))).status()).toBe(400)
  expect((await post(address({ name: 'Mia\nMuster' }))).status()).toBe(400)
  expect((await post({ shippingRate: 7 })).status()).toBe(400)
  // Without stripe-mock a valid order only fails because there is no Stripe key.
  if (!process.env.STRIPE_MOCK) expect((await post({})).status()).toBe(503)
})

test.describe('against stripe-mock', () => {
  test.skip(!process.env.STRIPE_MOCK, 'set STRIPE_MOCK to run stripe-mock tests')

  test('a valid order is stored as pending and bound to its Checkout Session', async ({ request }) => {
    const email = `kunde-${Date.now()}@example.com`
    const response = await request.post('/api/checkout', { data: { ...validOrder, email } })
    expect(response.status()).toBe(200)
    expect((await response.json()).url).toMatch(/^https:\/\//)
    const [order] = d1(`SELECT status, stripe_session_id, items FROM orders WHERE email = '${email}'`)
    expect(order).toMatchObject({ status: 'pending' })
    expect(String(order!.stripe_session_id)).toMatch(/^cs_/)
    expect(JSON.parse(String(order!.items))[0]).toMatchObject({ id: 'example-mug', unitAmount: 1900 })
  })

  test('the return page check answers for a known session and 400s for junk', async ({ request }) => {
    expect((await request.post('/api/checkout/confirm', { data: { sessionId: 'cs_test_123' } })).status()).toBe(200)
    expect((await request.post('/api/checkout/confirm', { data: { sessionId: 'nope' } })).status()).toBe(400)
  })
})
