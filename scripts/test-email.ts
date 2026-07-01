/**
 * Diagnostic: sends a real email via Resend and prints the FULL response,
 * including the { error } object that the app currently ignores.
 *
 *   npx tsx --env-file=.env.local scripts/test-email.ts you@example.com
 */

import 'dotenv/config'
import { Resend } from 'resend'

const to = process.argv[2] || process.env.ADMIN_EMAIL || ''
const from = `${process.env.EMAIL_FROM_NAME ?? 'The Golden Frame'} <${process.env.EMAIL_FROM_ADDRESS ?? 'hello@thegoldenframe.co'}>`

async function main() {
  console.log('RESEND_API_KEY present:', !!process.env.RESEND_API_KEY)
  console.log('From:', from)
  console.log('To:  ', to)

  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not set — every email is silently skipped.')
    process.exit(1)
  }
  if (!to) {
    console.error('No recipient. Pass one: npx tsx --env-file=.env.local scripts/test-email.ts you@example.com')
    process.exit(1)
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const result = await resend.emails.send({
    from,
    to,
    subject: 'Golden Frame — email diagnostic',
    html: '<p>If you can read this, Resend delivery works from this environment.</p>',
  })

  console.log('\n── Resend response ─────────────────────────')
  console.log('data: ', JSON.stringify(result.data, null, 2))
  console.log('error:', JSON.stringify(result.error, null, 2))

  if (result.error) {
    console.error('\n❌ Send FAILED — this is the root cause the app was hiding.')
    process.exit(1)
  }
  console.log('\n✅ Accepted by Resend. Check the inbox (and spam).')
}

main().catch((err) => {
  console.error('Threw:', err)
  process.exit(1)
})
