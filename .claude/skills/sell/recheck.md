# Re-check at every new project

Confirm each row that is more than 3 months old, then update its value and date here. In cloud
threads use WebSearch (no Allow prompts); on yskills' PC the official docs sites are
pre-allowed. "open" means it was never confirmed; confirm it before relying on it.

| What | Value | Source | Checked |
|---|---|---|---|
| Stripe card fees (DE account) | 1.5% + €0.25 standard EEA, 2.8% + €0.25 premium, 2.5% + €0.25 UK, 3.15% + €0.25 international, +2% currency conversion, no monthly fee | [stripe.com/de/pricing](https://stripe.com/de/pricing) | 2026-10-03 |
| Stripe local methods | SEPA €0.35; Klarna from 2.99% + €0.35; PayPal 0.2% + €0.10 plus PayPal's own fee (open); giropay gone since 2024-06-30 | [local payment methods](https://stripe.com/de/pricing/local-payment-methods) | 2026-10-03 |
| Stripe post-payment invoices | 0.4%, max $2 per invoice | [support.stripe.com](https://support.stripe.com/questions/pricing-for-post-payment-invoices-for-one-time-purchases-via-checkout-and-payment-links) | 2026-10-03 |
| Stripe disputes | €20, plus €20 to respond (refunded if you win) | [stripe.com/de/pricing](https://stripe.com/de/pricing) | 2026-10-03 |
| Stripe Tax price | 0.5% per transaction? | [Stripe Tax pricing](https://support.stripe.com/questions/understanding-stripe-tax-pricing) | open |
| Stripe Managed Payments | Merchant of record, +3.5%, digital goods only, German businesses supported, Checkout or Payment Links only | [eligibility](https://docs.stripe.com/payments/managed-payments/eligibility) | 2026-10-03 |
| Merchant-of-record services for physical goods | None: Stripe Managed Payments, Paddle, Polar and Lemon Squeezy all exclude them | the providers' policy pages (`physical.md`) | 2026-10-03 |
| Polar fees (digital alternative) | 5% + €0.50, +1.5% for non-EU cards | [polar.sh/docs](https://polar.sh/docs) | 2026-10-03 |
| Stripe SDK on Workers | `stripe@23.0.0`, API `2026-09-30.endive`, fetch client and SubtleCrypto; the templates pass typecheck, build and 9 e2e tests (2 against stripe-mock) | [stripe-node](https://github.com/stripe/stripe-node), [stripe-mock](https://github.com/stripe/stripe-mock) | 2026-10-03 |
| Stripe keys | Restricted keys recommended over secret keys; a live key is shown once | [restricted keys](https://docs.stripe.com/keys/restricted-api-keys) | 2026-10-03 |
| Hosted Checkout button | `submit_type` sets "Pay"/"Book"/"Donate"/"Subscribe" only; `custom_text.submit` adds text but does not rename the button, so the order button stays on our page | [Checkout customization](https://docs.stripe.com/payments/checkout/customization/policies) | 2026-10-03 |
| Sendcloud | Free €0 (label fee open); Lite €31/month or €24.80/month billed yearly (400 labels); Growth €87; returns portal from Lite | [sendcloud.com/de/preise](https://www.sendcloud.com/de/preise/) | 2026-10-03 |
| DHL business contract | Monthly fee since 2025-07 (€119.95? open); possible minimum of 200 parcels a year (open) | [Händlerbund](https://ohn.haendlerbund.de/logistik/paketdienste/dhl-monatspauschale-geschaeftskunden) | open |
| Kleinunternehmer | ≤ €25,000 last year and ≤ €100,000 this year; founding year ≤ €25,000; ends at once when crossed | [BMF letter, 18 Mar 2025](https://www.bundesfinanzministerium.de/Content/DE/Downloads/BMF_Schreiben/Steuerarten/Umsatzsteuer/Umsatzsteuer-Anwendungserlass/2025-03-18-sonderregelung-kleinunternehmer.pdf) | 2026-10-03 |
| EU distance-sales threshold | €10,000 a year EU-wide, goods and digital together | [existenzgruendungsportal.de](https://www.existenzgruendungsportal.de/Redaktion/DE/BMWK-Infopool/Antworten/Auslandsgeschaefte/Umsatzsteuer/Kleinunternehmer-Warenverkauf-an-Kunden-in-und-ausserhalb-der-EU) | 2026-10-03 |
| E-invoices | B2C excluded; Kleinunternehmer receive only; others issue from 2027 (turnover > €800k) or 2028 | [BMF FAQ](https://www.bundesfinanzministerium.de/Content/DE/FAQ/e-rechnung.html) | 2026-10-03 |
| Widerrufsbutton | § 356a BGB since 2026-06-19: "Vertrag widerrufen", then "Widerruf bestätigen"; new model Widerrufsbelehrung | [§ 356a BGB](https://www.gesetze-im-internet.de/bgb/__356a.html) | 2026-10-03 |
| Order button | "Zahlungspflichtig bestellen" on our own page (§ 312j BGB) | [IT-Recht Kanzlei](https://www.it-recht-kanzlei.de/beschriftung-bestellbutton-mit-zahlungsart-unzulaessig.html) | 2026-10-03 |
| Warranty notice and eco claims | EmpCo: harmonised warranty notice and guarantee label since 2026-09-27 | [IT-Recht Kanzlei](https://www.it-recht-kanzlei.de/gestaltung-neue-label-gewaehrleistung-garantie.html) | 2026-10-03 |
| Packaging | PPWR plus VerpackDG since 2026-08-12; LUCID and a dual system before the first parcel | [e-recht24](https://www.e-recht24.de/ecommerce/13537-verpackungsverordnung.html), [LUCID](https://lucid.verpackungsregister.org/) | 2026-10-03 |
| GPSR | Manufacturer, EU responsible person, identifier, picture and German warnings on each listing | [IT-Recht Kanzlei](https://www.it-recht-kanzlei.de/eu-produktsicherheitsverordnung-gpsr-haendler-informationspflichten.html) | 2026-10-03 |
| Electronics and batteries | Producers register with stiftung ear (ElektroG, BattDG since 2025-08-18) | [stiftung ear](https://www.stiftung-ear.de/anleitungen/batterie-registrierung-beantragen/) | 2026-10-03 |
| ODR link | Remove it: the platform closed on 2025-07-20 | [IHK](https://www.ihk.de/osnabrueck/recht-und-fair-play/recht/internetrecht/einstellung-os-plattform-6474562) | 2026-10-03 |
| BFSG | Applies since 2025-06-28; micro-enterprises are exempt for services | [§ 2 BFSG](https://www.gesetze-im-internet.de/bfsg/__2.html) | 2026-10-03 |
| Legal-text services | IT-Recht Kanzlei Unlimited €54.90/month; the others open | [IT-Recht Kanzlei](https://www.it-recht-kanzlei.de/unlimited-paket-rechtscheck-tiefenpruefung-rechtssicherheit.html) | 2026-10-03 |
| GitHub environment secrets | Only jobs that reference the environment can read them; restrict deployment branches to `main` | [docs.github.com](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments) | 2026-10-03 |
| Cloudflare deploy token | "Edit Cloudflare Workers" template plus Account · D1 · Edit, on all Workers. Tokens can be limited to specific Workers since 2026-09-15; such a token, or a read-only one, lists Workers and D1 but gets 403 creating a Worker (seen in duo-test) | [changelog](https://developers.cloudflare.com/changelog/post/2026-09-15-granular-worker-permissions/), [Workers permissions](https://developers.cloudflare.com/workers/authorization/workers/) | 2026-10-03 |
| Cloudflare Secrets Store | Beta since 2025-04-09; use Worker secrets until it is GA | [changelog](https://developers.cloudflare.com/changelog/product/secrets-store/) | 2026-10-03 |
| Shopify (alternative) | From about €25/month; Shopify Payments EU cards 2.1% + €0.30 on Basic (third-party figures) | [shopify.com/de/preise](https://www.shopify.com/de/preise) | open |
| App stores | Take 15 to 30% of digital sales; the exceptions keep changing | Apple and Google developer policies | when going to a store |
| Stripe plugin | `stripe@claude-plugins-official` 0.10.3: `stripe-best-practices` skill (Stripe's plan; checks API version, restricted keys, webhooks, tax). MCP at `mcp.stripe.com` needs a browser OAuth login. Its hooks ask Claude to offer `stripe feedback` after Stripe work; nothing is sent without yskills' OK | [Stripe MCP](https://docs.stripe.com/mcp) | 2026-10-04 |
| Better Auth Stripe plugin | `@better-auth/stripe` 1.7.7, peer `stripe` ^18 to ^22 (so not `stripe@23`) | [npm](https://www.npmjs.com/package/@better-auth/stripe) | 2026-10-04 |
| Retention periods | Invoices and payment records 8 years (BEG IV, since 2025-01-01); books and annual accounts 10 | § 147 AO, § 257 HGB | 2026-10-04 |
