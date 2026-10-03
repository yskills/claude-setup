import { z } from 'zod'
import { KLEINUNTERNEHMER, SHIPPING_COUNTRIES, SHIPPING_RATES, findProduct } from '#shared/shop'

const body = z.object({
  items: z.array(z.object({ id: z.string().max(64), quantity: z.number().int().min(1).max(20) })).min(1).max(50),
  email: z.email().max(254),
  address: z.object({
    name: z.string().trim().min(2).max(100),
    line1: z.string().trim().min(3).max(100),
    line2: z.string().trim().max(100).optional(),
    postalCode: z.string().trim().regex(/^[A-Za-z0-9 -]{3,10}$/),
    city: z.string().trim().min(2).max(60),
    country: z.enum(SHIPPING_COUNTRIES),
  }),
  shippingRate: z.number().int().min(0),
  locale: z.enum(['de', 'en']),
})

/**
 * Called by the "Zahlungspflichtig bestellen" button on our own order page, where the law wants
 * it (§ 312j BGB): Stripe's hosted button only says "Bezahlen". Writes the order from server-side
 * prices, then sends the buyer to the Stripe-hosted page to pay.
 */
export default defineEventHandler(async (event) => {
  const parsed = body.safeParse(await readBody(event).catch(() => null))
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Invalid order' })
  const { email, address, locale } = parsed.data
  const rate = SHIPPING_RATES[address.country][parsed.data.shippingRate]
  if (!rate) throw createError({ statusCode: 400, statusMessage: 'Unknown shipping rate' })
  const items = parsed.data.items.map(({ id, quantity }) => {
    const product = findProduct(id)
    if (!product) throw createError({ statusCode: 400, statusMessage: 'Unknown product' })
    return { id, name: product.name, quantity, unitAmount: product.price }
  })

  const stripe = useStripe(event)
  const orderId = await createPendingOrder(event, { items, email, address, shipping: rate })
  const origin = getRequestURL(event).origin
  const prefix = locale === 'en' ? '/en' : ''
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    locale,
    client_reference_id: orderId,
    customer_email: email,
    line_items: items.map((item) => ({
      quantity: item.quantity,
      price_data: { currency: 'eur', unit_amount: item.unitAmount, product_data: { name: item.name } },
    })),
    shipping_options: [{ shipping_rate_data: { type: 'fixed_amount', display_name: rate.name, fixed_amount: { amount: rate.amount, currency: 'eur' } } }],
    invoice_creation: {
      enabled: true,
      invoice_data: KLEINUNTERNEHMER ? { footer: 'Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.' } : {},
    },
    success_url: `${origin}${prefix}/danke?session={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}${prefix}/kasse`,
  })
  if (!session.url) throw createError({ statusCode: 502, statusMessage: 'Checkout unavailable' })
  return { url: session.url }
})
