---
name: sell
description: Take money in a project from Germany - pages that bill (one-off or subscription), digital products, or a physical product with shipping. Covers the first-batch questions and keys, Stripe Checkout on Cloudflare Workers, orders and shipping labels, German/EU shop law, go-live and a dated re-check table. Use whenever an app or PRD sells something, has a shop, cart, checkout, pricing, billing, invoices or shipping.
---

# Sell

What works, as of 2026-10-03:

- **Digital payments** were proven in yskills/duo-test.
- **The shop templates** (`templates/`) pass `nuxt typecheck`, `nuxt build` and 9 e2e tests in
  the real Workers runtime. Two of those tests run against Stripe's official mock. A security
  review's fixes are in.
- **The legal and tax facts** were researched and fact-checked.

This is not legal or tax advice. The kit says what is required. The legal texts come from a
legal-text service, and tax questions go to a Steuerberater.

Files next to this one:

| File | Read it when |
|---|---|
| `recheck.md` | first, every new project: dated facts and where to confirm them |
| `keys.md` | writing the first batch of questions, and at go-live |
| `stripe-workers.md` | building checkout, webhook, deploy and tests; it lists `templates/` |
| `physical.md` | anything gets shipped |
| `legal-de.md` | legal pages, checkout wording, registrations |

## 0. Re-check

Open `recheck.md`. For each row checked more than 3 months ago:

- Confirm the current value, with WebSearch in cloud threads (CLAUDE.md says why).
- Update the value and the date in yskills/claude-setup. If a fact changed, fix this skill in
  the same PR.

## 1. What is sold decides the stack

| Selling | Payments | VAT | Fulfilment |
|---|---|---|---|
| Digital, one-off (unlock, download, credits) | Stripe Checkout, hosted page, `mode: 'payment'` | Kleinunternehmer: none. Selling across the EU above the threshold: Stripe Managed Payments (Stripe is the seller and handles VAT; digital only, +3.5%) | Grant access from the webhook |
| Subscription | Checkout `mode: 'subscription'`, Stripe Customer Portal, the Better Auth Stripe plugin | Same as above | Access while the subscription is active. Add a Kündigungsbutton |
| Physical goods | Our order page (address, shipping, the order button), then the Stripe-hosted page to pay | Kleinunternehmer: none. Otherwise Stripe Tax plus OSS. No merchant-of-record service takes physical goods | Order in D1, then Sendcloud, then yskills prints the label |
| Many products, variants, stock, or someone else runs the shop | Shopify instead of building one | Shopify Tax | Shopify |

- Turn payment methods on in the Stripe Dashboard: cards, Apple Pay and Google Pay, PayPal,
  Klarna, SEPA. The hosted page then shows them with no extra code. giropay no longer exists.
- **Why the hosted page:** it has no monthly fee and the lowest fees. Stripe.js never loads on
  our pages, which keeps the cookie banner question simple. Stripe handles PCI.
- **The order button is always on our page.** It must say "Zahlungspflichtig bestellen"
  (§ 312j BGB), and Stripe's hosted button can only say "Bezahlen". This applies to digital
  products too.
- Never build our own card processing.

## 2. First batch of questions

These go into the same batch as the PRD questions, as tap cards, and never mid-build.

1. What is sold: digital, subscription, physical, or a mix. Multi-select.
2. Prices. For physical goods, also:
   - parcel size and weight;
   - where to ship: Germany only (recommended first), DE + EU, or worldwide.
3. Kleinunternehmer (§ 19 UStG)?
   - Yes. Recommended to start; it means no VAT on prices.
   - No.
   - Not sure. Then use yes, and confirm with a Steuerberater.
4. What exists already. Checkboxes:
   - Gewerbe registered
   - Stripe account
   - Sendcloud account
   - legal-text service
   - business bank account
5. Physical only. Checkboxes:
   - your own product (you are the manufacturer: GPSR duties, see `legal-de.md`)
   - bought from a maker
   - contains electronics
   - contains batteries
   - food or cosmetics (stop and research; extra law applies)
6. Legal texts. IT-Recht Kanzlei (recommended), Händlerbund, Trusted Shops, eRecht24, or
   already have one.

In the same message, ask for this project's keys from `keys.md`:

- Use the manual-steps format: one line on why Claude can't, then numbered steps, each with
  the deep link and the exact secret name.
- Ask for test keys only now. Live keys come at go-live.
- Building does not wait for keys. Until they arrive, payment slices are tested with signed fake
  webhooks.

## 3. Build in thin slices, riskiest first

1. **Products and prices live on the server** (`shared/`).
   - The client sends ids and quantities, never a price.
   - For physical goods, also store the weight.
2. **Order page and order endpoint.**
   - The page shows what `legal-de.md` lists and ends in "Zahlungspflichtig bestellen".
   - The endpoint prices the order on the server, writes a `pending` order and returns the
     hosted Checkout URL. The order id becomes `client_reference_id`.
   - Copy `templates/` (see `stripe-workers.md`).
3. **Webhook.**
   - Trust signed events only. Read the raw body.
   - Make it idempotent: a guarded `UPDATE ... WHERE status = 'pending'` or a unique session id.
   - Fulfil only when `payment_status === 'paid'`. SEPA pays later, through
     `checkout.session.async_payment_succeeded`.
   - Handle failed and expired sessions, refunds and disputes.
4. **Return page.** It retrieves the session for instant feedback, because the webhook can lag.
   It records the payment through the same idempotent function the webhook uses.
5. **Fulfilment.**
   - Digital: grant access.
   - Physical: hand the order to Sendcloud from `fulfilOrder`, which runs with `waitUntil`
     after the 2xx. See `physical.md`.
6. **Emails.**
   - Send the order confirmation from our own sender (Resend, via `toolbox`). It must carry the
     AGB, the Widerrufsbelehrung and the Muster-Widerrufsformular, because the law wants them
     on a durable medium.
   - Sendcloud sends the shipping and tracking emails.
   - Stripe sends the receipt or invoice.
7. **Legal pages and checkout wording.** See `legal-de.md`. Covers Impressum, Datenschutz, AGB,
   Widerruf with the Widerrufsbutton, shipping and payment information, and prices with
   shipping and delivery time.
8. **Orders view** for yskills behind the admin login: paid, shipped, refunded. Refunds happen
   in the Stripe Dashboard and come back by webhook.
9. **Report into Luna** once Luna's ingest API exists: one small signed event per paid and
   per refunded order.

Tests that every shop gets (all in `templates/tests/shop.spec.ts`):

- A signed fake webhook marks an order paid exactly once, even when it is sent twice.
- A paid session that is not the order's own never pays it.
- An unsigned or forged webhook gets 400.
- A price sent by the client is ignored.
- SEPA order: `completed` unpaid, then `async_payment_succeeded`, then paid.
- A refund event flips the status.
- The checkout endpoint rejects:
  - unknown products and quantities of 0 or below;
  - orders too heavy for any shipping rate;
  - countries we don't ship to;
  - malformed postal codes and control characters.
- A valid order against stripe-mock is stored as `pending` with its session id.

Run `security-reviewer` on every slice that touches money or addresses.

## 4. Go live

Claude prepares everything, then posts one manual-steps message.

**yskills does** (deep links are in `keys.md` and `legal-de.md`):

1. Gewerbe and the ELSTER questionnaire, if not done.
2. Activate the Stripe account.
3. Put the live restricted key into the GitHub environment `production`.
4. Approve the legal texts.
5. Physical goods: register in LUCID and license the packaging before the first parcel.

**Claude does, as soon as the first test key arrives:** one real sandbox checkout end to end
(order page, Stripe page with test card `4242 4242 4242 4242`, webhook, email). stripe-mock only
checks parameter names.

**Claude does at go-live:**

1. Checks that no placeholder is left (`example-mug`, `Beispielshop`, `example.de`), that the
   rate-limiting rule on `/api/checkout*` exists, and deletes the sandbox orders.
2. Redeploys. The deploy script creates the live webhook by itself.
3. Checks the live site:
   - a Checkout Session opens in live mode;
   - the legal pages are linked from every page;
   - the order button, shipping costs and delivery time read right.
4. Asks yskills to buy once with their own card. Then checks the order, the emails and the
   Sendcloud entry, and refunds it.
5. Turns on the weekly smoke test.

## 5. Keep it working

- **Weekly smoke test.** A scheduled GitHub Actions run costs no Claude tokens. It:
  - opens the shop;
  - creates a Checkout Session (nothing is charged; it expires);
  - sends an unsigned webhook and expects 400;
  - checks that the legal pages answer 200.
  A failed run emails yskills.
- Stripe emails yskills when a webhook endpoint keeps failing. Sentry alerts on errors.
- When a rule or a price in this kit turns out wrong, fix it in yskills/claude-setup.
