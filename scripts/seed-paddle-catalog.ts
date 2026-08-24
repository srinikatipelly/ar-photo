/**
 * Creates the Paddle products + prices this app sells, then prints the env vars
 * to paste into .env.local / Vercel.
 *
 * One multi-currency price per tier: a single Paddle price carries AUD + INR +
 * USD via unitPriceOverrides, which is what lib/paddle.ts expects (it looks up
 * PADDLE_PRICE_<TIER> and only falls back to a _<REGION> suffix if you set one).
 *
 * Safe to re-run: products and prices are matched by name/description and
 * reused rather than duplicated.
 *
 * Sandbox (do this first):
 *   npx tsx --env-file=.env.local scripts/seed-paddle-catalog.ts
 * Production (only after sandbox testing passes):
 *   PADDLE_ENV=production npx tsx --env-file=.env.local scripts/seed-paddle-catalog.ts
 */

import { Environment, Paddle, type Price, type Product } from '@paddle/paddle-node-sdk'

const apiKey = process.env.PADDLE_API_KEY
if (!apiKey) {
  console.error('PADDLE_API_KEY is not set. Paddle > Developer tools > Authentication.')
  process.exit(1)
}

const isProduction = process.env.PADDLE_ENV === 'production'
const paddle = new Paddle(apiKey, {
  environment: isProduction ? Environment.production : Environment.sandbox,
})

/**
 * Amounts are strings in minor units (cents / paise): '1900' = A$19.00,
 * '49900' = ₹499.00. Keep these in step with the display strings in
 * lib/regions.ts — nothing enforces that they match.
 *
 * `taxCategory: 'standard'` is used throughout because it needs no approval.
 * 'digital-goods' is arguably the better fit for the AR experience, but Paddle
 * has to approve that category on the account first — switch it here once they
 * do (a product's tax category can't change after its first sale).
 */
const CATALOG = [
  {
    envVar: 'PADDLE_PRICE_DIGITAL',
    product: {
      name: 'Digital AR Experience',
      description: 'Your photo + video brought to life in AR. QR code delivered by email — no physical frame.',
      taxCategory: 'standard' as const,
    },
    price: {
      description: 'Digital AR Experience — multi-currency',
      // AUD is the base: buyers in countries without an override see this,
      // auto-converted.
      unitPrice: { amount: '1900', currencyCode: 'AUD' as const },
      unitPriceOverrides: [
        { countryCodes: ['IN' as const], unitPrice: { amount: '49900', currencyCode: 'INR' as const } },
        { countryCodes: ['US' as const], unitPrice: { amount: '1500', currencyCode: 'USD' as const } },
      ],
    },
  },
  {
    envVar: 'PADDLE_PRICE_FRAME',
    product: {
      name: 'Personalised AR Photo Frame',
      description: 'A handcrafted photo frame with an embedded AR video experience. Dispatched in 2–3 business days.',
      taxCategory: 'standard' as const,
    },
    price: {
      // Australia only: the frame is physical, and export markets are
      // digital-only (TIER_VISIBILITY in lib/regions.ts), so no overrides.
      description: 'Personalised AR Photo Frame — AUD',
      unitPrice: { amount: '3900', currencyCode: 'AUD' as const },
      unitPriceOverrides: [],
    },
  },
  {
    envVar: 'PADDLE_PRICE_DELIVERY',
    product: {
      name: 'Standard delivery',
      description: 'Standard delivery for physical frame orders.',
      taxCategory: 'standard' as const,
    },
    price: {
      description: 'Standard delivery (Australia)',
      unitPrice: { amount: '995', currencyCode: 'AUD' as const },
      unitPriceOverrides: [],
    },
  },
]

/** Reuse a product with the same name instead of creating a second one. */
async function findOrCreateProduct(spec: (typeof CATALOG)[number]['product']): Promise<Product> {
  for await (const product of paddle.products.list({ status: ['active'] })) {
    if (product.name === spec.name) {
      console.log(`  product exists  ${product.id}  ${product.name}`)
      return product
    }
  }

  const created = await paddle.products.create(spec)
  console.log(`  product created ${created.id}  ${created.name}`)
  return created
}

/** Same for prices — matched on description within the product. */
async function findOrCreatePrice(
  productId: string,
  spec: (typeof CATALOG)[number]['price'],
): Promise<Price> {
  for await (const price of paddle.prices.list({ productId: [productId], status: ['active'] })) {
    if (price.description === spec.description) {
      console.log(`  price exists    ${price.id}  ${price.description}`)
      return price
    }
  }

  // No billingCycle: every product here is a one-off purchase, not a
  // subscription. Adding one would silently turn orders into recurring charges.
  const created = await paddle.prices.create({ productId, ...spec })
  console.log(`  price created   ${created.id}  ${created.description}`)
  return created
}

async function main() {
  console.log(`Seeding Paddle catalogue (${isProduction ? 'PRODUCTION' : 'sandbox'})\n`)

  const env: string[] = []

  for (const entry of CATALOG) {
    console.log(entry.product.name)
    const product = await findOrCreateProduct(entry.product)
    const price = await findOrCreatePrice(product.id, entry.price)
    env.push(`${entry.envVar}=${price.id}`)
    console.log('')
  }

  console.log('─'.repeat(64))
  console.log('Paste into .env.local (and Vercel env vars):\n')
  console.log(env.join('\n'))
  console.log('')
  console.log('Delivery is optional — omit PADDLE_PRICE_DELIVERY to treat shipping')
  console.log('as included in the frame price.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
