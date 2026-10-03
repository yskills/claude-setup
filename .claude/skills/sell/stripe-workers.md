# Stripe on Cloudflare Workers

## Verified

The templates in `templates/` were checked on 2026-10-03:

- They ran in a minimal Nuxt 4 app (`nitro` preset `cloudflare_module`) with `stripe@23.0.0`
  (API `2026-09-30.endive`) and `zod@4`.
- `nuxt typecheck` and `nuxt build` both passed.
- The 6 tests in `templates/tests/shop.spec.ts` passed against `wrangler dev` with a local D1.

The digital-product variant below ran green in yskills/duo-test.

## The flow

1. **Our order page.** It shows the cart, address, email, shipping rate, delivery time, total
   and the AGB and Widerruf links.
2. The buyer presses **"Zahlungspflichtig bestellen"**, which calls `POST /api/checkout`. That
   endpoint:
   - prices the order on the server;
   - writes it to D1 as `pending`;
   - creates a Checkout Session on the Stripe-hosted page and returns its URL.
3. **The buyer pays on Stripe's page.**
4. **We learn about the payment twice, both through `markOrderPaid`, which flips the order
   exactly once:**
   - the webhook `POST /api/stripe/webhook`;
   - the return page `/danke?session=cs_…`, which calls `POST /api/checkout/confirm`.
5. **Whichever call flips it runs `fulfilOrder`** with `waitUntil`: the confirmation email with
   the legal PDFs attached and, for physical goods, the Sendcloud order.

**Why the button is on our page:** German law wants the order button to say "zahlungspflichtig
bestellen" or something just as clear (§ 312j BGB). Stripe's hosted button can only say "Pay"
("Bezahlen"), and courts have rejected similar wording. So the contract is made on our page and
Stripe only takes the money. Stripe.js never loads on our pages either.

## Templates

| Template | Goes to | What it does |
|---|---|---|
| `shared/shop.ts` | `shared/` | Products, prices in cents, shipping countries and rates, Kleinunternehmer switch |
| `server/utils/env.ts` | `server/utils/` | Typed Worker env; merge with an existing one |
| `server/utils/stripe.ts` | `server/utils/` | `useStripe` (fetch client), `readStripeEvent` (raw body + SubtleCrypto signature check) |
| `server/utils/orders.ts` | `server/utils/` | `createPendingOrder`, `markOrderPaid` (idempotent), `setOrderStatus` (moves only from listed states) |
| `server/utils/fulfil.ts` | `server/utils/` | Confirmation email via Resend with AGB, Widerrufsbelehrung and Muster-Widerrufsformular attached. Add the Sendcloud call here (`physical.md`) |
| `server/api/checkout/index.post.ts` | same | The order button's endpoint |
| `server/api/checkout/confirm.post.ts` | same | Return page check |
| `server/api/stripe/webhook.post.ts` | same | Paid, SEPA, failed, expired, refunded, disputed |
| `server/migrations/0001_orders.sql` | the D1 `migrations_dir` | `orders` table |
| `scripts/deploy.mjs` | `scripts/` | D1, migrations, deploy, Worker secrets, Stripe webhook (created once, events kept up to date). `SITE_URL` for a custom domain |
| `ci.yml` | `.github/workflows/` | Verify on PRs; deploy from `main` with the `production` environment |
| `tests/shop.spec.ts` | `tests/e2e/` | Signed fake webhooks against `wrangler dev`, plus order validation |

**What the project still adds:**

- the order page;
- the `/danke` page;
- the legal pages and PDFs (`legal-de.md`);
- the Widerrufsbutton flow;
- the Sendcloud call;
- an admin orders view.

All of these are built in the project's design.

## Wiring

- `wrangler.jsonc` needs:
  - `"compatibility_flags": ["nodejs_compat"]`
  - a D1 binding `DB`
  - `migrations_dir` pointing at the migrations.
- `package.json` needs `"deploy": "node scripts/deploy.mjs"` and a `verify` script that runs
  typecheck, unit tests, build and the e2e tests.
- In `playwright.config.ts`, the `webServer` starts the real runtime with a test-only webhook
  secret, as duo-test does:

  ```ts
  export const WEBHOOK_SECRET = 'whsec_e2e_only_not_a_real_secret'
  // webServer.command:
  `rm -rf .wrangler/state && npx wrangler d1 migrations apply DB --local && npx wrangler dev --port ${PORT} --ip 127.0.0.1 --var STRIPE_WEBHOOK_SECRET:${WEBHOOK_SECRET}`
  ```

- In cloud threads, launch Playwright's browser with `executablePath: '/opt/pw-browsers/chromium'`.
  The webhook tests only use `request`, so they need no browser.
- To try a real test payment locally, on yskills' PC: put test keys in `.dev.vars`, then run
  `stripe listen --forward-to 127.0.0.1:8787/api/stripe/webhook`. It prints a `whsec_…` for
  `.dev.vars`. Test card `4242 4242 4242 4242`; 3-D Secure `4000 0027 6000 3184`.

## Variants

**Digital product, one-off** (duo-test pattern):

- Requires login. Use the user id as `client_reference_id`.
- Use a `purchases` table with a unique `stripe_session_id` instead of `orders`.
- No address or shipping.
- Before the button, a required checkbox: "Ich stimme zu, dass ihr vor Ablauf der Widerrufsfrist
  mit der Ausführung beginnt, und weiß, dass ich dadurch mein Widerrufsrecht verliere"
  (§ 356 Abs. 5 BGB).
  - The endpoint rejects the request without it and stores the consent in the session metadata.
  - The confirmation email repeats it.

**Subscription:**

- `mode: 'subscription'` with a Price created once in the Dashboard. The Stripe Customer Portal
  handles cancelling and card changes.
- The [Better Auth Stripe plugin](https://www.better-auth.com/docs/plugins/stripe) links plans
  to users.
- Add these to the deploy script's `WEBHOOK_EVENTS`: `customer.subscription.created`,
  `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`.
- Add a Kündigungsbutton (`legal-de.md`).

**Selling across the EU above the VAT threshold, digital only:** Stripe Managed Payments.
Stripe becomes the seller, so it works through Checkout only. Check `recheck.md` first.

## Gotchas

- **Raw body.** `readRawBody` must see the exact bytes; any JSON parsing before it breaks the
  signature.
- **Fulfil on `payment_status === 'paid'`, never on the `completed` event alone.** SEPA
  completes unpaid and pays days later.
- **Keep the webhook fast:** do the slow work after the 2xx with `event.waitUntil`. Stripe
  retries for up to 3 days.
- **Stripe sends events more than once and out of order.** Every write is guarded by the state
  it expects.
- **The webhook secret differs between sandbox and live.** `deploy.mjs` creates a new endpoint
  when the key's mode has none.
- **Never put a price in a request body or in metadata the client can influence.**
