import Stripe from 'stripe'
import type { H3Event } from 'h3'

export function useStripe(event: H3Event): Stripe {
  const { STRIPE_SECRET_KEY: key, STRIPE_API_BASE: base } = useEnv(event)
  if (!key) throw createError({ statusCode: 503, statusMessage: 'Payments are not set up' })
  const mock = base ? new URL(base) : undefined
  return new Stripe(key, {
    httpClient: Stripe.createFetchHttpClient(),
    ...(mock && { host: mock.hostname, port: Number(mock.port), protocol: 'http' as const }),
  })
}

/** Verifies the Stripe signature on the raw body. Anything unsigned or altered is a 400. */
export async function readStripeEvent(event: H3Event): Promise<Stripe.Event> {
  const secret = useEnv(event).STRIPE_WEBHOOK_SECRET
  if (!secret) throw createError({ statusCode: 503, statusMessage: 'Payments are not set up' })
  const signature = getHeader(event, 'stripe-signature')
  const payload = await readRawBody(event, 'utf8')
  if (!signature || !payload) throw createError({ statusCode: 400, statusMessage: 'Missing signature' })
  try {
    return await Stripe.webhooks.constructEventAsync(payload, signature, secret, undefined, Stripe.createSubtleCryptoProvider())
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Invalid signature' })
  }
}
