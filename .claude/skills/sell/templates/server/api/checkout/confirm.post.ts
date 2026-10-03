import { z } from 'zod'

const body = z.object({ sessionId: z.string().startsWith('cs_').max(200) })

/** Return page check: shows "paid" at once instead of waiting for the webhook. Reveals nothing else. */
export default defineEventHandler(async (event) => {
  const parsed = body.safeParse(await readBody(event).catch(() => null))
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Invalid session' })
  const session = await useStripe(event).checkout.sessions.retrieve(parsed.data.sessionId).catch(() => null)
  if (!session) throw createError({ statusCode: 404, statusMessage: 'Unknown session' })
  if (await markOrderPaid(event, session)) event.waitUntil(fulfilOrder(event, session.client_reference_id!))
  return { paid: session.payment_status === 'paid' }
})
