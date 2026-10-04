/** Everything the shop sells. Prices are gross, in cents. The client only ever sends ids. */
export interface Product {
  name: string
  price: number
  weightGrams: number
}

export const PRODUCTS: Record<string, Product> = {
  'example-mug': { name: 'Beispieltasse', price: 1900, weightGrams: 450 },
}

/** Kleinunternehmer (§ 19 UStG): no VAT on prices, and invoices must say why. */
export const KLEINUNTERNEHMER = true

/** Countries we ship to. The shop must say so before the order starts (§ 312j Abs. 1 BGB). */
export const SHIPPING_COUNTRIES = ['DE'] as const
export type ShippingCountry = (typeof SHIPPING_COUNTRIES)[number]

export const POSTAL_CODES: Record<ShippingCountry, RegExp> = {
  DE: /^\d{5}$/,
}

export interface ShippingRate {
  name: string
  amount: number
  /** Heaviest parcel this rate covers, packaging included. */
  maxGrams: number
  /** Business days, shown at checkout: the delivery time must be known before the order (Art. 246a EGBGB). */
  days: [number, number]
}

export const SHIPPING_RATES: Record<ShippingCountry, ShippingRate[]> = {
  DE: [{ name: 'DHL Paket', amount: 590, maxGrams: 31_500, days: [1, 3] }],
}

export function findProduct(id: string): Product | undefined {
  return Object.hasOwn(PRODUCTS, id) ? PRODUCTS[id] : undefined
}
