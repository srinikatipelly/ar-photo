import 'server-only'
import { Environment, Paddle } from '@paddle/paddle-node-sdk'
import { REGIONS, TIER_VISIBILITY, type Region } from './regions'
import type { PricingKey } from './site-content'

// ─────────────────────────────────────────────────────────────────────────────
// Paddle — Merchant of Record for every market (Phase 3, Workstream B).
//
// Why Paddle and not Stripe: Paddle is the legal seller, so it collects and
// remits each country's sales tax for us (AU GST, India GST/OIDAR, US
// multi-state) — no foreign entity or tax registration anywhere. It also
// settles domestic *and* international payments in one checkout, including
// India UPI + INR, which Stripe can't do from an AU account.
//
// Stripe is still in the tree during cutover: see getPaymentProvider() below.
// ─────────────────────────────────────────────────────────────────────────────

export type PaymentProvider = 'paddle' | 'stripe'

/** Line-item kinds we sell. Mirrors the `kind` field carried through checkout. */
export type OrderKind = 'digital' | 'frame'

/**
 * Which provider handles checkout.
 *
 * Defaults to Paddle as soon as `PADDLE_API_KEY` exists, and falls back to
 * Stripe until then, so deploying this code before Paddle onboarding (B0) is
 * finished cannot leave the site unable to take payments. Set
 * `PAYMENT_PROVIDER=stripe|paddle` to force one either way.
 */
export function getPaymentProvider(): PaymentProvider {
  const forced = process.env.PAYMENT_PROVIDER?.toLowerCase()
  if (forced === 'paddle' || forced === 'stripe') return forced
  return process.env.PADDLE_API_KEY ? 'paddle' : 'stripe'
}

export function getPaddleEnvironment(): Environment {
  return process.env.PADDLE_ENV === 'production' ? Environment.production : Environment.sandbox
}

let client: Paddle | null = null

/**
 * Lazily-built Paddle client. Built on first use (not at import time) so that
 * importing this module in a Stripe-only deployment doesn't throw.
 */
export function getPaddle(): Paddle {
  if (client) return client

  const apiKey = process.env.PADDLE_API_KEY
  if (!apiKey) {
    throw new Error('PADDLE_API_KEY is not set — cannot talk to Paddle.')
  }

  client = new Paddle(apiKey, { environment: getPaddleEnvironment() })
  return client
}

// ── Price IDs ────────────────────────────────────────────────────────────────

/**
 * Paddle price IDs live in env, not in code, so sandbox and production can point
 * at different catalogues without a redeploy of `lib/regions.ts`.
 *
 * Lookup order for e.g. the digital tier in India:
 *   1. PADDLE_PRICE_DIGITAL_IN   — a price created specifically for that market
 *   2. PADDLE_PRICE_DIGITAL      — one multi-currency price covering all markets
 *
 * A single Paddle price can carry AUD/INR/USD unit prices at once, so (2) alone
 * is enough for most setups; (1) exists for when a market needs its own product
 * positioning rather than just a different number.
 */
const PRICE_ENV_TIER: Record<PricingKey | 'delivery', string> = {
  frame: 'FRAME',
  digital: 'DIGITAL',
  realEstate: 'REAL_ESTATE',
  delivery: 'DELIVERY',
}

function lookupPriceId(tier: PricingKey | 'delivery', region: Region): string | undefined {
  const suffix = PRICE_ENV_TIER[tier]
  // `delivery` isn't a pricing tier on the marketing site, so it has no entry in
  // the region config — env only.
  const fromRegionConfig = tier === 'delivery' ? undefined : REGIONS[region].paddlePriceIds?.[tier]

  return (
    process.env[`PADDLE_PRICE_${suffix}_${region.toUpperCase()}`] ||
    process.env[`PADDLE_PRICE_${suffix}`] ||
    fromRegionConfig
  )
}

export type PaddleLineItem = { priceId: string; quantity: number }

/**
 * Resolve the Paddle line items for an order.
 *
 * Currency is deliberately NOT passed: Paddle picks the buyer's currency and
 * payment methods (UPI in India, cards, wallets, …) from their location and the
 * price's configured currencies. That is the whole point of the MoR model.
 *
 * Delivery is only charged where we actually ship. Export markets are
 * digital-only (no physical shipping), which `TIER_VISIBILITY` already encodes.
 */
export function resolveLineItems(kind: OrderKind, region: Region): PaddleLineItem[] {
  const tier: PricingKey = kind === 'digital' ? 'digital' : 'frame'

  if (!TIER_VISIBILITY[region].includes(tier)) {
    throw new Error(`The ${tier} product is not sold in region "${region}".`)
  }

  const priceId = lookupPriceId(tier, region)
  if (!priceId) {
    throw new Error(
      `No Paddle price configured for "${tier}" in region "${region}". ` +
        `Set PADDLE_PRICE_${PRICE_ENV_TIER[tier]}_${region.toUpperCase()} or PADDLE_PRICE_${PRICE_ENV_TIER[tier]}.`,
    )
  }

  const items: PaddleLineItem[] = [{ priceId, quantity: 1 }]

  // Physical orders may carry a separate delivery line. If no delivery price is
  // configured, shipping is treated as included in the frame price.
  if (kind === 'frame') {
    const deliveryPriceId = lookupPriceId('delivery', region)
    if (deliveryPriceId) items.push({ priceId: deliveryPriceId, quantity: 1 })
  }

  return items
}

// ── Customers ────────────────────────────────────────────────────────────────

/**
 * Find (or create) the Paddle customer for an email so the checkout opens with
 * the address prefilled and repeat orders land on one customer record.
 *
 * Best-effort: a failure here must not block a sale, so callers treat a null
 * result as "let Paddle collect the email at checkout".
 */
export async function findOrCreateCustomerId(
  email: string,
  name?: string,
): Promise<string | null> {
  const paddle = getPaddle()

  try {
    const [existing] = await paddle.customers.list({ email: [email] }).next()
    if (existing) return existing.id

    const created = await paddle.customers.create({ email, name: name || undefined })
    return created.id
  } catch (error) {
    console.error('Paddle customer lookup/create failed; continuing without one:', error)
    return null
  }
}

// ── Custom data ──────────────────────────────────────────────────────────────

/**
 * Everything the webhook needs to fulfil the order, carried on the transaction
 * as `custom_data` (Paddle's equivalent of Stripe's session `metadata`).
 *
 * The R2 keys aren't secrets, but this is set server-side anyway so a tampered
 * client can't point fulfilment at someone else's upload.
 */
export type CheckoutCustomData = {
  photoKey: string
  videoKey: string
  targetKey: string
  customerEmail: string
  customerName: string
  mobile: string
  deliveryAddress: string
  postalAddress: string
  kind: OrderKind
  region: Region
}

/** Narrow Paddle's loose `customData` (Record<string, unknown>) into our shape. */
export function readCustomData(customData: unknown): Partial<CheckoutCustomData> {
  if (!customData || typeof customData !== 'object') return {}
  const raw = customData as Record<string, unknown>
  const str = (key: string) => (typeof raw[key] === 'string' ? (raw[key] as string) : undefined)

  return {
    photoKey: str('photoKey'),
    videoKey: str('videoKey'),
    targetKey: str('targetKey'),
    customerEmail: str('customerEmail'),
    customerName: str('customerName'),
    mobile: str('mobile'),
    deliveryAddress: str('deliveryAddress'),
    postalAddress: str('postalAddress'),
    kind: str('kind') === 'digital' ? 'digital' : 'frame',
    region: str('region') as Region | undefined,
  }
}
