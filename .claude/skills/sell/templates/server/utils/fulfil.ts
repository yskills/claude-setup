import type { H3Event } from 'h3'

/** Shop name and sender; the domain must be verified in Resend. Replace before going live. */
const SHOP = { name: 'Beispielshop', from: 'Beispielshop <bestellung@example.de>' }
/** The legal texts as PDFs in public/rechtliches/ (Claude prints them from the legal pages, `legal-de.md`). Attached so the buyer keeps them (durable medium). */
const LEGAL_PDFS = ['agb.pdf', 'widerrufsbelehrung.pdf', 'muster-widerrufsformular.pdf']

const euro = (cents: number) => (cents / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)

/**
 * Runs once per paid order, after markOrderPaid. Sets fulfilled_at only when everything worked;
 * the admin orders view lists paid orders without it and offers to run this again. Physical shops
 * also hand the order to Sendcloud here (physical.md).
 */
export async function fulfilOrder(event: H3Event, orderId: string): Promise<void> {
  try {
    const env = useEnv(event)
    const order = await env.DB.prepare('SELECT items, email, amount_total FROM orders WHERE id = ?')
      .bind(orderId)
      .first<{ items: string, email: string | null, amount_total: number | null }>()
    if (!order?.email) throw new Error('order has no email')
    if (!env.RESEND_API_KEY) throw new Error('RESEND_API_KEY missing, no confirmation sent')

    const items = JSON.parse(order.items) as OrderItem[]
    const lines = items.map((item) => `<li>${item.quantity} × ${escapeHtml(item.name)}: ${euro(item.quantity * item.unitAmount)}</li>`).join('')
    const site = siteUrl(event)
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'authorization': `Bearer ${env.RESEND_API_KEY}`,
        'content-type': 'application/json',
        // A retry of the same order never sends a second email.
        'idempotency-key': `order-confirmation-${orderId}`,
      },
      body: JSON.stringify({
        from: SHOP.from,
        to: [order.email],
        subject: `Deine Bestellung bei ${SHOP.name}`,
        html: `<p>Danke für deine Bestellung. Wir haben sie angenommen.</p><ul>${lines}</ul>`
          + `<p>Gesamt inkl. Versand: ${euro(order.amount_total ?? 0)}</p>`
          + '<p>Im Anhang findest du unsere AGB, die Widerrufsbelehrung und das Muster-Widerrufsformular.</p>',
        attachments: LEGAL_PDFS.map((file) => ({ path: `${site}/rechtliches/${file}`, filename: file })),
      }),
    })
    if (!response.ok) throw new Error(`Resend answered ${response.status}`)
    await markFulfilled(event, orderId)
  } catch (error) {
    console.error(`[fulfil] order ${orderId}: ${error instanceof Error ? error.message : error}`)
  }
}
