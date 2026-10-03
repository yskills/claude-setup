# Making money

Checked 2026-10-03. Plugins are `@claude-plugins-official` unless noted. yskills is in Germany:
EU VAT and German legal pages apply from the first euro.

| Need | Pick | Why / watch out | Add it |
|---|---|---|---|
| Subscriptions or one-off payments, EU VAT handled for you | **Stripe Managed Payments** (Stripe as merchant of record; GA for German businesses, 195 markets) | Stripe handles tax and compliance; higher fee than plain Stripe, check current terms | `stripe` plugin; MCP `https://mcp.stripe.com` |
| Same, full control | **Stripe Checkout + Billing + Customer Portal**, Stripe Tax | You file VAT yourself (OSS) | `stripe` plugin |
| Alternative merchant of record | **Paddle** | | API key |
| PayPal buyers | **PayPal** | | `paypal` plugin |
| In-app purchases (iOS / Android) | **RevenueCat** | One API over App Store and Play billing | `revenuecat` plugin |
| Ads on a website | **Google AdSense** | Needs cookie consent in the EU (TCF CMP) | script tag + consent banner |
| Ads in a web game (interstitial, rewarded) | **AdSense H5 Games Ads** (beta) | Made for HTML5 games like TellMeY | AdSense sign-up, Ad Placement API |
| Ads in a native app | **AdMob** | | SDK |
| Running your own ads (marketing) | Meta, TikTok and Google Ads managers + campaign copy | Set up conversion tracking first (see growth.md) | ECC skill `marketing-campaign` |
| Billing support ops (refunds, churn, failed payments) | Stripe + ops skills | | ECC skills `customer-billing-ops`, `finance-billing-ops` |
| Pricing and market check | Competitor research | | ECC skills `market-research` (global), `product-lens` (global) |

## German / EU legal checklist (before going live)

- **Impressum** (required for any commercial site in Germany).
- **Datenschutzerklärung** naming every processor (Stripe, analytics, ads, AI APIs, hosting).
- **Cookie consent** before any non-essential cookie or tracker (TDDDG + GDPR); cookieless
  analytics (Plausible, Umami, PostHog cookieless mode) avoid the banner for analytics alone.
- **AGB and Widerrufsbelehrung** for paid digital products; the checkout must collect the
  consumer's consent to start immediately, or the 14-day withdrawal right applies.
- **Licensing** of content you use (music, stock, AI-generated assets' terms).
- Data processing agreements (AVV) with processors; prefer EU regions where offered.
