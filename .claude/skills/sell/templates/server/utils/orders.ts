import type Stripe from 'stripe'
import type { H3Event } from 'h3'

export interface OrderItem {
  id: string
  name: string
  quantity: number
  unitAmount: number
}

export interface NewOrder {
  items: OrderItem[]
  email: string
  address: { name: string, line1: string, line2?: string, postalCode: string, city: string, country: string }
  shipping: { name: string, amount: number }
}

export async function createPendingOrder(event: H3Event, order: NewOrder): Promise<string> {
  const id = crypto.randomUUID()
  await useEnv(event)
    .DB.prepare('INSERT INTO orders (id, status, items, email, shipping, country, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .bind(id, 'pending', JSON.stringify(order.items), order.email, JSON.stringify({ address: order.address, rate: order.shipping }), order.address.country, Date.now())
    .run()
  return id
}

/**
 * Marks a pending order paid, once, whether the webhook or the return page sees it first.
 * True only for the call that flipped it, so fulfilment runs exactly once.
 */
export async function markOrderPaid(event: H3Event, session: Stripe.Checkout.Session): Promise<boolean> {
  if (session.payment_status !== 'paid' || !session.client_reference_id) return false
  const paymentIntent = typeof session.payment_intent === 'string' ? session.payment_intent : (session.payment_intent?.id ?? null)
  const result = await useEnv(event)
    .DB.prepare(
      `UPDATE orders SET status = 'paid', stripe_session_id = ?, payment_intent = ?, amount_total = ?, currency = ?, paid_at = ?
       WHERE id = ? AND status = 'pending'`,
    )
    .bind(session.id, paymentIntent, session.amount_total, session.currency ?? 'eur', Date.now(), session.client_reference_id)
    .run()
  return result.meta.changes === 1
}

/** Moves an order on only from the states listed, so late or repeated events change nothing. */
export async function setOrderStatus(
  event: H3Event,
  match: { id: string } | { paymentIntent: string },
  status: 'failed' | 'expired' | 'refunded' | 'disputed',
  from: string[],
): Promise<void> {
  const [column, value] = 'id' in match ? ['id', match.id] : ['payment_intent', match.paymentIntent]
  await useEnv(event)
    .DB.prepare(`UPDATE orders SET status = ? WHERE ${column} = ? AND status IN (${from.map(() => '?').join(', ')})`)
    .bind(status, value, ...from)
    .run()
}
