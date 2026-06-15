/**
 * Creates a 100%-off Stripe promotion code for dev/QA use.
 * Run once: npx tsx scripts/create-test-coupon.ts
 *
 * The coupon is reusable (no redemption limit) so you can test as many
 * times as needed. It only works in the key's environment — a test-mode
 * key creates a test-mode coupon that never touches real money.
 */

import Stripe from 'stripe'

const CODE = 'TESTORDER'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
  apiVersion: '2025-08-27.basil',
})

async function main() {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('❌  STRIPE_SECRET_KEY is not set. Export it before running this script.')
    process.exit(1)
  }

  // Check if the promo code already exists to keep this idempotent
  const existing = await stripe.promotionCodes.list({ code: CODE, limit: 1 })
  if (existing.data.length > 0) {
    const pc = existing.data[0]
    console.log(`✅  Promotion code "${CODE}" already exists (${pc.id}).`)
    console.log(`    Active: ${pc.active}`)
    console.log(`    Coupon: ${pc.coupon.id} — ${pc.coupon.percent_off}% off`)
    return
  }

  // Create the underlying coupon (100% off, no expiry, unlimited uses)
  const coupon = await stripe.coupons.create({
    percent_off: 100,
    duration: 'once',
    name: 'Test / QA — bypass payment',
  })
  console.log(`  Created coupon: ${coupon.id}`)

  // Attach a human-readable promotion code
  const promo = await stripe.promotionCodes.create({
    coupon: coupon.id,
    code: CODE,
  })

  console.log(`\n✅  Promotion code created successfully!`)
  console.log(`    Code:   ${promo.code}`)
  console.log(`    ID:     ${promo.id}`)
  console.log(`    Coupon: ${coupon.id} — ${coupon.percent_off}% off, once`)
  console.log(`\n    Use "${CODE}" at Stripe checkout to bypass payment during testing.`)
}

main().catch((err) => {
  console.error('❌ ', err.message ?? err)
  process.exit(1)
})
