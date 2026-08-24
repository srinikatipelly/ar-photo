// ─────────────────────────────────────────────────────────────────────────────
// Region config - the single source of truth for country-localized content.
// Phase 3 (Workstream A): region → currency display, contact channel, pricing.
//
// This module is framework-agnostic (no next/headers, no 'server-only') so it can
// be imported from both Server Components and Client Components (e.g. the country
// switcher). Reading the *active* region from the request lives in ./region-server.
//
// ⚠️ PLACEHOLDER VALUES: the India WhatsApp number, the INR/USD price strings, and
// the US contact channel are stand-ins until the real values are confirmed. Search
// for "TODO(region)" to find every value that still needs sign-off.
// ─────────────────────────────────────────────────────────────────────────────

import { brand as baseBrand, pricingTiers, type PricingKey, type PricingTier } from './site-content'

export type Region = 'au' | 'in' | 'us'

/** Cookie name that stores a manual region override (set by the country switcher). */
export const REGION_COOKIE = 'region'
/** Request header the proxy sets so pages can read the region on the first request. */
export const REGION_HEADER = 'x-region'
/** Fallback region when geo is unknown and no override cookie is present. */
export const DEFAULT_REGION: Region = 'au'

/** Display order for the country switcher / geo mapping. */
export const REGIONS_ORDER: Region[] = ['au', 'in', 'us']

/**
 * Regions currently live to visitors. US is scaffolded but OFF for now (AU + India
 * only) - add 'us' here to switch it on everywhere: switcher, geo mapping, and
 * cookie/header validation.
 */
export const ACTIVE_REGIONS: Region[] = ['au', 'in']

type RegionContact = {
  /** Local display phone, e.g. '0427 649 892'. Omit for WhatsApp-only regions. */
  phone?: string
  /** Dial-able international form, e.g. '+61427649892'. Omit if no phone line. */
  phoneIntl?: string
  /** Digits only for wa.me links, e.g. '61427649892'. */
  whatsappNumber: string
  email: string
  /** Canonical site URL for this region (used for metadata/SEO later). */
  siteUrl: string
}

/** Paddle price IDs per tier for this region's currency (Workstream B - filled at B0). */
type PaddlePriceIds = Partial<Record<PricingKey, string>>

export type RegionConfig = {
  region: Region
  /** ISO-3166 alpha-2 label shown in the switcher. */
  label: string
  flag: string
  currency: 'AUD' | 'INR' | 'USD'
  locale: 'en-AU' | 'en-IN' | 'en-US'
  contact: RegionContact
  /** Per-tier price display strings for this region. */
  prices: Record<PricingKey, { price: string; was?: string }>
  paddlePriceIds?: PaddlePriceIds
}

export const REGIONS: Record<Region, RegionConfig> = {
  au: {
    region: 'au',
    label: 'Australia',
    flag: '🇦🇺',
    currency: 'AUD',
    locale: 'en-AU',
    contact: {
      phone: '0427 649 892',
      phoneIntl: '+61427649892',
      whatsappNumber: '61427649892',
      email: 'hello@thegoldenframe.com.au',
      siteUrl: 'https://www.thegoldenframe.com.au',
    },
    prices: {
      frame: { price: '$39', was: '$79' },
      digital: { price: 'From $19' },
      realEstate: { price: 'Custom' },
    },
  },
  in: {
    region: 'in',
    label: 'India',
    flag: '🇮🇳',
    currency: 'INR',
    locale: 'en-IN',
    contact: {
      // India is WhatsApp-first - no local phone line needed.
      whatsappNumber: '917259453806',
      email: 'hello@thegoldenframe.com',
      siteUrl: 'https://www.thegoldenframe.com',
    },
    prices: {
      digital: { price: '₹499' },
      // India is a digital-only market (no physical shipping). Frame/realEstate kept
      // for type completeness but hidden from India's pricing - see TIER_VISIBILITY.
      frame: { price: '₹499' },
      realEstate: { price: 'Custom' },
    },
  },
  us: {
    region: 'us',
    label: 'United States',
    flag: '🇺🇸',
    currency: 'USD',
    locale: 'en-US',
    contact: {
      // TODO(region): confirm US contact channel - defaulting to email + global WhatsApp,
      // no US phone line. Swap whatsappNumber for a US number if one is set up.
      whatsappNumber: '61427649892',
      email: 'hello@thegoldenframe.com',
      siteUrl: 'https://www.thegoldenframe.com',
    },
    prices: {
      // TODO(region): confirm the real USD price (this is the plan's example figure).
      digital: { price: 'From $15' },
      // US is a digital-only market (no physical shipping), same as India.
      // Frame/realEstate kept for type completeness but hidden - see TIER_VISIBILITY.
      frame: { price: 'From $15' },
      realEstate: { price: 'Custom' },
    },
  },
}

/** Type guard for untrusted strings (cookie values, headers, query params). */
export function isRegion(value: unknown): value is Region {
  return value === 'au' || value === 'in' || value === 'us'
}

/** Like isRegion, but also requires the region to be currently live (ACTIVE_REGIONS). */
export function isActiveRegion(value: unknown): value is Region {
  return isRegion(value) && ACTIVE_REGIONS.includes(value)
}

/**
 * Map an ISO-3166 alpha-2 country code (from the host's geo signal) to a live
 * region. Countries whose region isn't active (e.g. US for now) fall back to the
 * default so we never render a switched-off region.
 */
export function countryToRegion(country?: string | null): Region {
  const byCountry: Record<string, Region> = { AU: 'au', IN: 'in', US: 'us' }
  const region = byCountry[country?.toUpperCase() ?? '']
  return region && ACTIVE_REGIONS.includes(region) ? region : DEFAULT_REGION
}

/**
 * Brand contact details resolved for a region. Region-independent fields (name,
 * tagline, socials, orderUrl) come from the base brand; contact + currency are
 * region-specific.
 */
export function getBrand(region: Region) {
  const { contact, currency, locale } = REGIONS[region]
  return {
    ...baseBrand,
    phone: contact.phone,
    phoneIntl: contact.phoneIntl,
    whatsapp: `https://wa.me/${contact.whatsappNumber}`,
    whatsappNumber: contact.whatsappNumber,
    email: contact.email,
    siteUrl: contact.siteUrl,
    currency,
    locale,
  }
}

export type RegionalBrand = ReturnType<typeof getBrand>

/**
 * Which tiers each region actually sells. Export markets are digital-only (no
 * physical shipping - see the "Global expansion direction" note), so India and
 * the US both show just the digital product. Australia is the only market with
 * the physical frame.
 */
export const TIER_VISIBILITY: Record<Region, PricingKey[]> = {
  au: ['frame', 'digital', 'realEstate'],
  in: ['digital'],
  us: ['digital'],
}

/** Pricing tiers this region sells, with its price/currency display strings merged in. */
export function getPricing(region: Region): PricingTier[] {
  const { prices } = REGIONS[region]
  const visible = TIER_VISIBILITY[region]
  return pricingTiers
    .filter((tier) => visible.includes(tier.key))
    .map((tier) => ({
      ...tier,
      price: prices[tier.key].price,
      was: prices[tier.key].was,
    }))
}
