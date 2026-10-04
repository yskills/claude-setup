# German and EU law for a shop

Checked 2026-10-03; re-check dates are in `recheck.md`. This is not legal advice. It says what
must exist; the wording comes from a legal-text service, which also keeps the texts updated
and helps with warning letters (Abmahnungen). Markers: **[F]** official page read, **[S]**
search results and legal-publisher titles agree, **[K]** known but not re-read.

## Before the first sale (yskills does these)

| Step | Where | Notes |
|---|---|---|
| Gewerbe registration | The town's Gewerbeamt, often online | The fee depends on the town |
| Tax registration | [ELSTER](https://www.elster.de): "Fragebogen zur steuerlichen Erfassung" | Choose Kleinunternehmer there or not. Free |
| Kleinunternehmer (§ 19 UStG) | Same questionnaire | At most €25,000 last year and at most €100,000 this year. **In the founding year the limit is €25,000 for that year itself.** Crossing a limit ends the scheme at once [S]. Sources: [BMF letter, 18 Mar 2025](https://www.bundesfinanzministerium.de/Content/DE/Downloads/BMF_Schreiben/Steuerarten/Umsatzsteuer/Umsatzsteuer-Anwendungserlass/2025-03-18-sonderregelung-kleinunternehmer.pdf) |
| Wirtschafts-Identifikationsnummer (W-IdNr) | Sent by the BZSt | Goes in the Impressum once issued, even without a USt-IdNr [S] |
| Legal-text service | e.g. IT-Recht Kanzlei (Unlimited package €54.90/month [S]), Händlerbund, Trusted Shops, eRecht24 | It must cover AGB, Widerruf (the 2026 version), Datenschutz, Impressum, shipping and payment information, an update service and Abmahnung help |
| Physical goods | LUCID plus a dual system before the first parcel; GPSR; stiftung ear if you are the producer | Details in `physical.md` |

## Pages and texts

- **Impressum** (§ 5 DDG). Name, postal address, email, a second fast contact channel, and the
  W-IdNr or USt-IdNr if you have one [K]. It must be reachable from every page.
- **Datenschutzerklärung** (DSGVO Art. 13). It names every processor: Cloudflare, Stripe,
  Resend, and for physical goods Sendcloud plus the carriers. It also names Google if the shop
  has Google login. A data processing agreement (AVV) is needed with each processor; they
  offer it in their settings [K].
- **AGB.** The order page links them so the buyer can read them before ordering. A checkbox is
  not required (§ 305 Abs. 2 BGB) [S].
- **Widerrufsbelehrung plus Muster-Widerrufsformular.** The model text changed on
  2026-06-19, so older generated texts are out of date [S]. For goods, the 14 days start on
  receipt [S].
- **Shipping and payment information:** countries, costs, delivery times and payment methods.
- **Statutory warranty notice** (Gewährleistung). Since 2026-09-27 the EU's harmonised notice
  must be shown, plus a label for any extra durability guarantee (EmpCo, Directive (EU)
  2024/825). The same law bans unproven general eco claims such as "klimaneutral" [S].
  [IT-Recht Kanzlei on the new labels](https://www.it-recht-kanzlei.de/gestaltung-neue-label-gewaehrleistung-garantie.html)
- **No ODR link.** The EU platform closed on 2025-07-20 [S].
- **§ 36 VSBG statement:** only required with more than 10 employees [S].

## The order page

Claude builds this; the law is specific.

- **From the start of ordering:** the countries you deliver to and the payment methods you
  accept (§ 312j Abs. 1 BGB) [S].
- **Directly above the button:**
  - the products with their main features, and the quantities;
  - the total price, including shipping;
  - the delivery time (Art. 246a EGBGB, § 312j Abs. 2 BGB) [S].
- **The button says "Zahlungspflichtig bestellen".** Stripe's hosted button ("Bezahlen") does
  not count, and courts have rejected "Weiter zur Zahlung" and "Mit PayPal bezahlen" (one
  court even "Kaufen"). So the button sits on our page and Stripe only collects the money afterwards
  (`stripe-workers.md`) [S].
  [IT-Recht Kanzlei](https://www.it-recht-kanzlei.de/beschriftung-bestellbutton-mit-zahlungsart-unzulaessig.html)
- **Prices:**
  - Kleinunternehmer write "Gemäß § 19 UStG wird keine Umsatzsteuer berechnet" next to prices
    and **never "inkl. MwSt."**. Invoices carry the same note (§ 34a UStDV) [S].
  - Goods sold by weight, volume, length or area show a unit price (Grundpreis) close to the
    price (§ 4 PAngV) [S].
  - A sale price shows the lowest price of the last 30 days (§ 11 PAngV) [S].
- **Links** to the AGB, Widerrufsbelehrung and Datenschutz.

## After the order

- **Confirmation email** (§ 312f BGB) [K]: the contract content plus the AGB,
  Widerrufsbelehrung and Muster-Widerrufsformular, on a durable medium. `fulfil.ts` attaches
  them as PDFs; a link does not count.
- **Widerrufsbutton** (§ 356a BGB, since 2026-06-19) [S], for goods too:
  - Step 1 is a function labelled "Vertrag widerrufen", easy to find and available for the
    whole withdrawal period.
  - Step 2 asks for the details needed to identify the buyer and the contract, then a button
    "Widerruf bestätigen".
  - Then email a confirmation of receipt (durable medium).
  - Build it as a page linked from the footer and from the confirmation email: order number
    plus email, then confirm.
  - [Law text](https://www.gesetze-im-internet.de/bgb/__356a.html),
    [IHK FAQ](https://www.ihk.de/cottbus/service-und-beratung/recht/uebersicht/faq-zur-widerrufsfunktion-widerrufsbutton--7061080)
- **Digital content delivered at once:**
  - Before ordering, the buyer ticks that they agree to the start and lose the withdrawal
    right (§ 356 Abs. 5 BGB).
  - The confirmation email repeats it.
  - The Widerrufsbutton then only matters until delivery.
- **Subscriptions:** a Kündigungsbutton, "Verträge hier kündigen" (§ 312k BGB) [K].

## Cookies, accessibility, tax

- **Cookie banner.** It is only needed for storage that is not essential (§ 25 TDDDG) [K].
  A shop that redirects to Stripe's hosted page and uses only a cart and session cookie and
  cookieless analytics needs no banner. That is an interpretation; ask the legal-text service
  once.
- **Accessibility (BFSG).** It applies to online shops since 2025-06-28. Micro-enterprises
  (fewer than 10 employees **and** turnover or balance-sheet total at most €2M) are exempt for
  services [S]. Build accessibly anyway, since the shop may grow out of the exemption.
- **Selling to other EU countries:**
  - Up to €10,000 a year across the EU, VAT stays German, so Kleinunternehmer stay VAT-free.
    Goods **and** digital sales count toward the same €10,000 [S].
  - Above it, VAT is due in each customer's country. Talk to a Steuerberater before that
    point. Options are OSS, or the EU-wide small-business scheme (§ 19a UStG, since 2025,
    registered with the BZSt) [S].
- **E-invoices.**
  - B2C is excluded.
  - Kleinunternehmer never have to *issue* e-invoices but must be able to *receive* them; an
    email inbox is enough.
  - Other businesses must issue them for B2B from 2027/2028 [S].
  - [BMF FAQ](https://www.bundesfinanzministerium.de/Content/DE/FAQ/e-rechnung.html)
