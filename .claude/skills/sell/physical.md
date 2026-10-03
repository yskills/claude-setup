# Physical goods: shipping, packaging, product law

Checked 2026-10-03. Each claim is marked:

- **[F]**: the official page was read.
- **[S]**: only search results support it.
- **[K]**: known but not re-read; confirm it before relying on it.

## Shipping: Sendcloud first

| Stage | Pick | Why |
|---|---|---|
| Start | **Sendcloud Free** | DHL and 70+ carriers at Sendcloud's own rates, "from the first parcel", with no DHL contract [S]. API, tracking emails and customs papers on every plan [F]. The per-label fee on Free could not be confirmed |
| Returns portal, or own carrier contracts | **Sendcloud Lite**, €31/month (€24.80/month billed yearly), 400 labels [F] | The returns portal needs Lite or higher [F] |
| Steady volume | Your own **DHL business contract**, through Sendcloud or the [DHL Parcel DE API](https://developer.dhl.com/api-reference/parcel-de-shipping-post-parcel-germany-v2) | Needs an EKP and a billing number; production approval takes 1 to 3 working days [F]. Since July 2025 DHL charges business customers a monthly fee (one seller forum says €119.95; unconfirmed) and may drop accounts under about 200 parcels a year [S] |

### Wiring Sendcloud

`fulfilOrder` hands each paid order to Sendcloud. yskills checks the order and prints the label
in the Sendcloud panel. Sendcloud then sends the tracking emails.

- Build the call from Sendcloud's current docs:
  [creating orders](https://sendcloud.dev/docs/orders/creating-and-managing-orders) (API v3,
  orders appear in the panel) or
  [create a parcel](https://sendcloud.dev/docs/shipping/create-a-parcel) (API v2, with
  `request_label: false` until it should be printed).
- Authentication is Basic auth with `SENDCLOUD_PUBLIC_KEY:SENDCLOUD_SECRET_KEY`.
- It is not in the templates because nobody has run it yet. Test it with a mocked `fetch` (the
  route harness pattern), then once for real with a parcel you cancel.
- Store Sendcloud's id on the order. Set `status = 'shipped'` and `tracking` either from
  Sendcloud's parcel-status webhook or from the admin orders view.
- If the Sendcloud call fails, the order is still paid. Log it, show it in the admin view, and
  never refund automatically.

### Before an order

- Show shipping costs and the delivery time before the order (Art. 246a EGBGB, § 6 PAngV) [K].
- Show which countries you deliver to and which payment methods you accept, at the latest when
  the order starts (§ 312j Abs. 1 BGB) [S]. `SHIPPING_COUNTRIES` drives both the order page and
  the endpoint.
- Start with Germany only. EU shipping means:
  - **VAT:** EU sales above €10,000 a year change VAT. Digital sales count toward the same
    €10,000 (`legal-de.md`).
  - **Geo-blocking:** EU customers may not be refused on the same terms if they give an address
    you deliver to [S].
- Outside the EU: Sendcloud and DHL create the customs papers [F]. Exports are VAT-free with
  proof of export [K]. Keep this for later.

## Packaging law: register before the first parcel

Since 12 Aug 2026 the EU Packaging Regulation (PPWR, (EU) 2025/40) applies, and the German
VerpackDG replaced the VerpackG [S]. The duties that matter here have not changed: whoever first
fills a shipping box must, **before the first shipment** [S]:

1. Register in [LUCID](https://lucid.verpackungsregister.org/). Historically free [K].
2. License their packaging (box, filler, tape) with a dual system (*duales System*). Compare
   prices at [verpackungslizenz-vergleich.de](https://www.verpackungslizenz-vergleich.de/verpackungsgesetz/).
   Small volumes cost little; the exact amount is unverified.
3. Enter that system's name in LUCID.

The PPWR adds rules for the packaging itself, for example limits on empty space in shipping
boxes [S]. The legal-text service or the dual system can say what applies.

## Product law

**GPSR** ((EU) 2023/988, in application since 13 Dec 2024). Every online listing shows [S]:

- the manufacturer's name (or trade name or trademark), postal address and electronic address;
- if the manufacturer is outside the EU, the EU responsible person, with the same details;
- what identifies the product: a picture, the type, and a batch or serial number where one
  exists;
- warnings and safety information in German.

**If it is yskills' own product, they are the manufacturer** [K]:

- a risk assessment and technical documentation;
- marking on the product itself: type or batch, plus name and address;
- reporting accidents through the EU Safety Business Gateway.

Read [IT-Recht Kanzlei's GPSR guide](https://www.it-recht-kanzlei.de/eu-produktsicherheitsverordnung-gpsr-haendler-informationspflichten.html)
before the first listing.

**Electronics and batteries.** Only the *producer* registers: the maker, the importer, or
whoever sells under their own brand. Reselling goods from a registered German producer needs
no registration [S]. A producer:

- **Electronics** (ElektroG): registers with [stiftung ear](https://www.stiftung-ear.de)
  before offering anything, and shows the WEEE number on every offer [S].
- **Batteries**, including built-in ones (BattDG, since 18 Aug 2025): registers with stiftung
  ear, and for portable batteries also joins a producer responsibility organisation (OfH) [S].

**Food, cosmetics, toys, textiles:** each has its own extra law. Stop and research before
building.

## Stock and returns

- Small volumes: keep stock by hand. Remove a product from `PRODUCTS` when it sells out. Add a
  `stock` column only when that hurts.
- Returns follow the Widerruf rules in `legal-de.md`.
  - The buyer pays direct return costs only if the Widerrufsbelehrung said so beforehand
    (§ 357 Abs. 5 BGB) [S].
  - The 14 days start when the goods arrive. With split deliveries, they start when the last
    part arrives (§ 356 Abs. 2 BGB) [S].
