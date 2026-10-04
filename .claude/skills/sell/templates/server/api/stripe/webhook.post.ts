/** Stripe calls this after payment. Only signed events are trusted; repeats and late events change nothing. */
export default defineEventHandler(async (event) => {
  const stripeEvent = await readStripeEvent(event)
  switch (stripeEvent.type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded': {
      const session = stripeEvent.data.object
      // SEPA and other delayed methods complete unpaid; they pay later via async_payment_succeeded.
      if (await markOrderPaid(event, session)) event.waitUntil(fulfilOrder(event, session.client_reference_id!))
      break
    }
    case 'checkout.session.async_payment_failed':
      await setOrderStatus(event, { id: stripeEvent.data.object.client_reference_id ?? '' }, 'failed', ['pending'])
      break
    case 'checkout.session.expired':
      await setOrderStatus(event, { id: stripeEvent.data.object.client_reference_id ?? '' }, 'expired', ['pending'])
      break
    case 'charge.refunded': {
      const charge = stripeEvent.data.object
      // Partial refunds keep the order as it is; the Dashboard shows the amount.
      if (charge.refunded && typeof charge.payment_intent === 'string') {
        const changed = await setOrderStatus(event, { paymentIntent: charge.payment_intent }, 'refunded', ['paid', 'shipped', 'disputed'])
        // Zero is normal for charges of other projects on the same account; log so a refund that
        // overtook its payment event can still be found.
        if (!changed) console.warn(`[webhook] refund for ${charge.payment_intent} matched no paid order`)
      }
      break
    }
    case 'charge.dispute.created': {
      const paymentIntent = stripeEvent.data.object.payment_intent
      if (typeof paymentIntent === 'string' && !(await setOrderStatus(event, { paymentIntent }, 'disputed', ['paid', 'shipped']))) {
        console.warn(`[webhook] dispute for ${paymentIntent} matched no paid order`)
      }
      break
    }
  }
  return { received: true }
})
