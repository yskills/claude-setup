import Stripe from 'stripe'
import type { H3Event } from 'h3'

export function useStripe(event: H3Event): Stripe {
  const key = useEnv(event).STRIPE_SECRET_KEY
  if (!key) throw createError({ statusCode: 503, statusMessage: 'Payments are not set up' })
  return new Stripe(key, { httpClient: Stripe.createFetchHttpClient() })
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
