import { defineConfig } from '@playwright/test'

const PORT = 8789
/** Test-only signing secret: lets the e2e suite send Stripe-signed webhooks to the local worker. */
export const WEBHOOK_SECRET = 'whsec_e2e_only_not_a_real_secret'
/** Set by CI (stripe-mock service) or locally after `docker run -p 12111:12111 stripe/stripe-mock`. */
const STRIPE_MOCK = process.env.STRIPE_MOCK
const stripeVars = STRIPE_MOCK ? ` --var STRIPE_SECRET_KEY:sk_test_mock --var STRIPE_API_BASE:${STRIPE_MOCK}` : ''

export default defineConfig({
  testDir: 'tests/e2e',
  workers: 1,
  use: { baseURL: `http://127.0.0.1:${PORT}` },
  webServer: {
    command: `rm -rf .wrangler/state && npx wrangler d1 migrations apply DB --local && npx wrangler dev --port ${PORT} --ip 127.0.0.1 --var STRIPE_WEBHOOK_SECRET:${WEBHOOK_SECRET}${stripeVars}`,
    url: `http://127.0.0.1:${PORT}/`,
    timeout: 120_000,
    reuseExistingServer: false,
  },
})
