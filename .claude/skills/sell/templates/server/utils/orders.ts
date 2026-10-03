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

const UNPAID_RETENTION_MS = 30 * 24 * 60 * 60 * 1000

export async function createPendingOrder(event: H3Event, order: NewOrder): Promise<string> {
  const id = crypto.randomUUID()
  const now = Date.now()
  const db = useEnv(event).DB
  await db.batch([
    db.prepare(`DELETE FROM orders WHERE status IN ('pending', 'failed', 'expired') AND created_at < ?`).bind(now - UNPAID_RETENTION_MS),
    db.prepare('INSERT INTO orders (id, status, items, email, shipping, country, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind(id, 'pending', JSON.stringify(order.items), order.email, JSON.stringify({ address: order.address, rate: order.shipping }), order.address.country, now),
  ])
  return id
}

/** Binds the order to its one Checkout Session; only that session can ever pay it. */
export async function attachSession(event: H3Event, orderId: string, sessionId: string): Promise<void> {
  await useEnv(event).DB.prepare('UPDATE orders SET stripe_session_id = ? WHERE id = ?').bind(sessionId, orderId).run()
}

/**
 * Marks a pending order paid, once, whether the webhook or the return page sees it first.
 * True only for the call that flipped it, so fulfilment starts exactly once. The session id must
 * match: a Payment Link or another project on the same Stripe account can set any
 * client_reference_id, and every endpoint of the account receives every session event.
 */
export async function markOrderPaid(event: H3Event, session: Stripe.Checkout.Session): Promise<boolean> {
  if (session.payment_status !== 'paid' || !session.client_reference_id) return false
  const db = useEnv(event).DB
  const paymentIntent = typeof session.payment_intent === 'string' ? session.payment_intent : (session.payment_intent?.id ?? null)
  const result = await db
    .prepare(
      `UPDATE orders SET status = 'paid', payment_intent = ?, amount_total = ?, currency = ?, livemode = ?, paid_at = ?
       WHERE id = ? AND stripe_session_id = ? AND status = 'pending'`,
    )
    .bind(paymentIntent, session.amount_total, session.currency ?? 'eur', session.livemode ? 1 : 0, Date.now(), session.client_reference_id, session.id)
    .run()
  if (result.meta.changes === 1) return true
  const order = await db.prepare('SELECT status FROM orders WHERE id = ? AND stripe_session_id = ?')
    .bind(session.client_reference_id, session.id)
    .first<{ status: string }>()
  // Money arrived for an order we already closed: someone has to refund or ship by hand.
  if (order && (order.status === 'failed' || order.status === 'expired')) {
    console.error(`[orders] ${session.id} paid but order ${session.client_reference_id} is ${order.status}`)
  }
  return false
}

/** Moves an order on only from the states listed, so late or repeated events change nothing. Returns rows changed. */
export async function setOrderStatus(
  event: H3Event,
  match: { id: string } | { paymentIntent: string },
  status: 'failed' | 'expired' | 'refunded' | 'disputed',
  from: string[],
): Promise<number> {
  const [column, value] = 'id' in match ? ['id', match.id] : ['payment_intent', match.paymentIntent]
  const result = await useEnv(event)
    .DB.prepare(`UPDATE orders SET status = ? WHERE ${column} = ? AND status IN (${from.map(() => '?').join(', ')})`)
    .bind(status, value, ...from)
    .run()
  return result.meta.changes
}

export async function markFulfilled(event: H3Event, orderId: string): Promise<void> {
  await useEnv(event).DB.prepare('UPDATE orders SET fulfilled_at = ? WHERE id = ?').bind(Date.now(), orderId).run()
}
