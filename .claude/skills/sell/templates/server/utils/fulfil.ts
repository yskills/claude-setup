import type { H3Event } from 'h3'

/** Shop name and sender; the domain must be verified in Resend. */
const SHOP = { name: 'Beispielshop', from: 'Beispielshop <bestellung@example.de>' }
/** PDFs from the legal-text service, served from public/. Attached so the buyer keeps them (durable medium). */
const LEGAL_PDFS = ['agb.pdf', 'widerrufsbelehrung.pdf', 'muster-widerrufsformular.pdf']

const euro = (cents: number) => (cents / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })

/** Runs once per paid order (after markOrderPaid). Physical shops also hand the order to Sendcloud here. */
export async function fulfilOrder(event: H3Event, orderId: string): Promise<void> {
  const env = useEnv(event)
  const order = await env.DB.prepare('SELECT items, email, amount_total FROM orders WHERE id = ?')
    .bind(orderId)
    .first<{ items: string, email: string | null, amount_total: number | null }>()
  if (!order?.email) return console.error(`[fulfil] order ${orderId} has no email`)
  if (!env.RESEND_API_KEY) return console.error('[fulfil] RESEND_API_KEY missing, no confirmation sent')

  const items = JSON.parse(order.items) as OrderItem[]
  const lines = items.map((item) => `<li>${item.quantity} × ${item.name}: ${euro(item.quantity * item.unitAmount)}</li>`).join('')
  const origin = getRequestURL(event).origin
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'authorization': `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      from: SHOP.from,
      to: [order.email],
      subject: `Deine Bestellung bei ${SHOP.name}`,
      html: `<p>Danke für deine Bestellung. Wir haben sie angenommen.</p><ul>${lines}</ul>`
        + `<p>Gesamt inkl. Versand: ${euro(order.amount_total ?? 0)}</p>`
        + '<p>Im Anhang findest du unsere AGB, die Widerrufsbelehrung und das Muster-Widerrufsformular.</p>',
      attachments: LEGAL_PDFS.map((file) => ({ path: `${origin}/rechtliches/${file}`, filename: file })),
    }),
  })
  if (!response.ok) console.error(`[fulfil] confirmation for ${orderId} failed: ${response.status}`)
}
