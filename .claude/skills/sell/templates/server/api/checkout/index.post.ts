import { z } from 'zod'
import { KLEINUNTERNEHMER, POSTAL_CODES, SHIPPING_COUNTRIES, SHIPPING_RATES, findProduct } from '#shared/shop'

/** Plain text only: no control characters or line breaks end up in emails, labels or exports. */
const text = (min: number, max: number) => z.string().trim().min(min).max(max).regex(/^[^\p{Cc}]*$/u)

const body = z.object({
  items: z.array(z.object({ id: z.string().max(64), quantity: z.number().int().min(1).max(20) })).min(1).max(20),
  email: z.email().max(254),
  address: z.object({
    name: text(2, 100),
    line1: text(3, 100),
    line2: text(0, 100).optional(),
    postalCode: z.string().trim().max(10),
    city: text(2, 60),
    country: z.enum(SHIPPING_COUNTRIES),
  }),
  shippingRate: z.number().int().min(0),
  locale: z.enum(['de', 'en']),
}).refine((order) => POSTAL_CODES[order.address.country].test(order.address.postalCode))

/**
 * Called by the "Zahlungspflichtig bestellen" button on our own order page, where the law wants
 * it (§ 312j BGB): Stripe's hosted button only says "Bezahlen". Writes the order from server-side
 * prices, then sends the buyer to the Stripe-hosted page to pay.
 */
export default defineEventHandler(async (event) => {
  const parsed = body.safeParse(await readBody(event).catch(() => null))
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Invalid order' })
  const { email, address, locale } = parsed.data
  const items = parsed.data.items.map(({ id, quantity }) => {
    const product = findProduct(id)
    if (!product) throw createError({ statusCode: 400, statusMessage: 'Unknown product' })
    return { id, name: product.name, quantity, unitAmount: product.price, grams: quantity * product.weightGrams }
  })
  const rate = SHIPPING_RATES[address.country][parsed.data.shippingRate]
  const grams = items.reduce((sum, item) => sum + item.grams, 0)
  if (!rate || grams > rate.maxGrams) throw createError({ statusCode: 400, statusMessage: 'No shipping rate fits this order' })

  const stripe = useStripe(event)
  const orderId = await createPendingOrder(event, {
    items: items.map(({ grams: _, ...item }) => item),
    email,
    address,
    shipping: { name: rate.name, amount: rate.amount },
  })
  const site = siteUrl(event)
  const prefix = locale === 'en' ? '/en' : ''
  // With VAT, prices stay gross and Stripe Tax itemises it (needs a registration in the Dashboard).
  const tax = KLEINUNTERNEHMER ? {} : { tax_behavior: 'inclusive' as const }
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    locale,
    client_reference_id: orderId,
    customer_email: email,
    line_items: items.map((item) => ({
      quantity: item.quantity,
      price_data: { currency: 'eur', unit_amount: item.unitAmount, product_data: { name: item.name }, ...tax },
    })),
    shipping_options: [{
      shipping_rate_data: { type: 'fixed_amount', display_name: rate.name, fixed_amount: { amount: rate.amount, currency: 'eur' }, ...tax },
    }],
    automatic_tax: { enabled: !KLEINUNTERNEHMER },
    invoice_creation: {
      enabled: true,
      invoice_data: KLEINUNTERNEHMER ? { footer: 'Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.' } : {},
    },
    success_url: `${site}${prefix}/danke?session={CHECKOUT_SESSION_ID}`,
    cancel_url: `${site}${prefix}/kasse`,
  })
  if (!session.url) throw createError({ statusCode: 502, statusMessage: 'Checkout unavailable' })
  await attachSession(event, orderId, session.id)
  return { url: session.url }
})
