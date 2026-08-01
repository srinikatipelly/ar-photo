import { Resend } from 'resend'
import { adminEmails } from '@/lib/admin'
import { brand } from '@/lib/site-content'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

const fromName  = () => process.env.EMAIL_FROM_NAME    ?? 'The Golden Frame'
const fromEmail = () => process.env.EMAIL_FROM_ADDRESS ?? 'hello@thegoldenframe.co'
const appUrl    = () => process.env.NEXT_PUBLIC_APP_URL ?? 'https://thegoldenframe.co'

// ── Customer: order confirmation (no QR) ────────────────────────────────────
export async function sendCustomerConfirmationEmail({
  to, name, frameId, isDigital = false,
}: { to: string; name: string; frameId: string; isDigital?: boolean }) {
  if (!resend) return

  const shortOrder = frameId.slice(-8).toUpperCase()

  const introLine = isDigital
    ? `Hi ${name || 'there'}, thank you for your order. This is a Digital AR Only order - no physical frame will be sent. Within 1-2 business days we’ll email your photo with the QR code attached, ready for you to print and frame yourself.`
    : `Hi ${name || 'there'}, thank you for your order. Our team will handcraft your personalised AR photo frame and have it on its way to you within 2-3 business days.`

  const nextStepsRows = isDigital
    ? `
              <p style="margin:0 0 8px;font-size:13px;color:#52525b;">
                <strong style="color:#18181b;">Within 1-2 business days</strong> - We email your photo with the QR code attached, ready to print
              </p>
              <p style="margin:0 0 8px;font-size:13px;color:#52525b;">
                <strong style="color:#18181b;">Print &amp; frame it</strong> - Print the photo at home or a print shop, then frame it however you like. Keep the QR code visible so it can be scanned.
              </p>
              <p style="margin:0;font-size:13px;color:#52525b;">
                <strong style="color:#18181b;">Scan &amp; relive</strong> - Point any phone camera at the QR code and watch your video come alive!
              </p>`
    : `
              <p style="margin:0 0 8px;font-size:13px;color:#52525b;">
                <strong style="color:#18181b;">1-2 business days</strong> - We craft your personalised frame
              </p>
              <p style="margin:0 0 8px;font-size:13px;color:#52525b;">
                <strong style="color:#18181b;">2-3 business days</strong> - Your frame is carefully packaged and shipped
              </p>
              <p style="margin:0;font-size:13px;color:#52525b;">
                <strong style="color:#18181b;">When it arrives</strong> - Scan the QR code on the back with your phone camera and watch your video come alive!
              </p>`

  const { error } = await resend.emails.send({
    from: `${fromName()} <${fromEmail()}>`,
    to,
    subject: `We've received your order! (#${shortOrder})`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08);">

        <tr><td style="background:#18181b;padding:28px 36px;">
          <p style="margin:0;color:#ffffff;font-size:18px;font-weight:600;letter-spacing:-0.3px;">The Golden Frame</p>
        </td></tr>

        <tr><td style="padding:36px 36px 0;">
          <h1 style="margin:0 0 8px;font-size:24px;font-weight:600;color:#18181b;letter-spacing:-0.4px;">
            Order received! 🎉
          </h1>
          <p style="margin:0 0 24px;font-size:16px;color:#71717a;line-height:1.6;">
            ${introLine}
          </p>

          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e4e4e7;border-radius:12px;padding:20px 24px;margin:0 0 24px;">
            <tr><td>
              <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#18181b;">What happens next</p>${nextStepsRows}
            </td></tr>
          </table>

          <table width="100%" cellpadding="0" cellspacing="0" style="background:#fefce8;border:1px solid #fde68a;border-radius:12px;padding:16px 24px;margin:0 0 24px;">
            <tr><td>
              <p style="margin:0;font-size:13px;color:#92400e;">
                <strong>Order reference: #${shortOrder}</strong><br />
                Keep this for your records. If you have any questions, reply to this email.
              </p>
            </td></tr>
          </table>
        </td></tr>

        <tr><td style="padding:24px 36px 32px;border-top:1px solid #f4f4f5;">
          <p style="margin:0;font-size:12px;color:#a1a1aa;">
            Questions? Reply to this email and we'll help.<br />
            © ${new Date().getFullYear()} The Golden Frame
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
  })

  // Resend returns { error } instead of throwing on API failures (unverified
  // sending domain, bad key, rate limit). Surface it so the caller can log it
  // instead of the send failing silently.
  if (error) throw new Error(`Resend customer email failed: ${error.name} - ${error.message}`)
}

// ── Admin: new order notification with QR ────────────────────────────────────
export async function sendAdminOrderNotification({
  frameId, customerName, customerEmail, mobile, deliveryAddress, photoUrl, videoUrl, qrDataUrl,
  isDigital = false,
}: {
  frameId: string
  customerName: string
  customerEmail: string
  mobile: string
  deliveryAddress: string
  photoUrl: string
  videoUrl: string
  qrDataUrl: string
  isDigital?: boolean
}) {
  const adminEmail = process.env.ADMIN_EMAIL
  if (!resend || !adminEmail) return

  const base64Data = qrDataUrl.replace(/^data:image\/png;base64,/, '')
  const buffer     = Buffer.from(base64Data, 'base64')
  const shortOrder = frameId.slice(-8).toUpperCase()
  const arUrl      = `${appUrl()}/ar?frame=${frameId}`
  const orderType  = isDigital ? 'DIGITAL AR ONLY (no frame to ship)' : 'AR Photo Frame (ship physical frame)'

  const { error } = await resend.emails.send({
    from: `${fromName()} <${fromEmail()}>`,
    to: adminEmail,
    subject: `New ${isDigital ? 'DIGITAL' : 'frame'} order #${shortOrder} - ${customerName || customerEmail}`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08);">

        <tr><td style="background:#18181b;padding:28px 36px;">
          <p style="margin:0;color:#f59e0b;font-size:13px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;">Admin - New Order</p>
          <p style="margin:4px 0 0;color:#ffffff;font-size:20px;font-weight:600;">Order #${shortOrder}</p>
        </td></tr>

        <tr><td style="padding:32px 36px 0;">

          <!-- Order type -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:${isDigital ? '#fef3c7' : '#dcfce7'};border:1px solid ${isDigital ? '#fcd34d' : '#86efac'};border-radius:12px;padding:14px 24px;margin:0 0 24px;">
            <tr><td>
              <p style="margin:0;font-size:14px;font-weight:700;color:#18181b;">Order type: ${orderType}</p>
            </td></tr>
          </table>

          <!-- Customer details -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;border-radius:12px;padding:20px 24px;margin:0 0 24px;">
            <tr><td>
              <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#18181b;">Customer details</p>
              <p style="margin:0 0 6px;font-size:13px;color:#52525b;"><strong style="color:#18181b;">Name:</strong> ${customerName || '-'}</p>
              <p style="margin:0 0 6px;font-size:13px;color:#52525b;"><strong style="color:#18181b;">Email:</strong> ${customerEmail}</p>
              <p style="margin:0 0 6px;font-size:13px;color:#52525b;"><strong style="color:#18181b;">Mobile:</strong> ${mobile || '-'}</p>
              <p style="margin:0 0 6px;font-size:13px;color:#52525b;"><strong style="color:#18181b;">Delivery Address:</strong> ${deliveryAddress || '-'}</p>
              <p style="margin:0;font-size:13px;color:#52525b;"><strong style="color:#18181b;">Frame ID:</strong> ${frameId}</p>
            </td></tr>
          </table>

          <!-- Files -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:20px 24px;margin:0 0 24px;">
            <tr><td>
              <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#18181b;">Customer files</p>
              <p style="margin:0 0 8px;font-size:13px;color:#1e40af;">
                <strong style="color:#18181b;">Photo:</strong>&nbsp;
                <a href="${photoUrl}" style="color:#1d4ed8;word-break:break-all;">${photoUrl}</a>
              </p>
              <p style="margin:0;font-size:13px;color:#1e40af;">
                <strong style="color:#18181b;">Video:</strong>&nbsp;
                <a href="${videoUrl}" style="color:#1d4ed8;word-break:break-all;">${videoUrl}</a>
              </p>
            </td></tr>
          </table>

          <!-- QR code -->
          <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#18181b;">QR Code - print and stick to the back of the frame</p>
          <div style="text-align:center;margin:0 0 24px;">
            <img src="cid:qrcode" alt="QR Code"
              style="width:200px;height:200px;border-radius:12px;border:1px solid #e4e4e7;" />
          </div>

          <!-- AR link -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px 24px;margin:0 0 24px;">
            <tr><td>
              <p style="margin:0;font-size:13px;color:#166534;">
                <strong>AR viewer link:</strong><br />
                <a href="${arUrl}" style="color:#166534;word-break:break-all;">${arUrl}</a>
              </p>
            </td></tr>
          </table>
        </td></tr>

        <tr><td style="padding:24px 36px 32px;border-top:1px solid #f4f4f5;">
          <p style="margin:0;font-size:12px;color:#a1a1aa;">The Golden Frame - Admin Notification</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
    attachments: [
      // inlineContentId makes the QR render inline via <img src="cid:qrcode">
      // (above), and it's still downloadable as an attachment.
      { filename: `qr-${frameId}.png`, content: buffer, inlineContentId: 'qrcode' },
    ],
  })

  if (error) throw new Error(`Resend admin email failed: ${error.name} - ${error.message}`)
}

// ── Contact: enquiry from the website contact form ──────────────────────────
export async function sendContactEnquiry({
  name, email, phone, message,
}: { name: string; email: string; phone?: string; message: string }) {
  if (!resend) throw new Error('Email service is not configured.')

  // Send to the business inbox; fall back to the sending address if ADMIN_EMAIL isn't set.
  const to = process.env.ADMIN_EMAIL ?? fromEmail()

  const { error } = await resend.emails.send({
    from: `${fromName()} <${fromEmail()}>`,
    to,
    // Replies go straight back to the customer.
    replyTo: email,
    subject: `New enquiry from ${name || email}`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08);">

        <tr><td style="background:#0F3535;padding:28px 36px;">
          <p style="margin:0;color:#C9A24B;font-size:13px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;">The Golden Frame - New enquiry</p>
        </td></tr>

        <tr><td style="padding:32px 36px 0;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;border-radius:12px;padding:20px 24px;margin:0 0 24px;">
            <tr><td>
              <p style="margin:0 0 6px;font-size:13px;color:#52525b;"><strong style="color:#18181b;">Name:</strong> ${escapeHtml(name) || '-'}</p>
              <p style="margin:0 0 6px;font-size:13px;color:#52525b;"><strong style="color:#18181b;">Email:</strong> ${escapeHtml(email)}</p>
              <p style="margin:0;font-size:13px;color:#52525b;"><strong style="color:#18181b;">Phone:</strong> ${escapeHtml(phone || '') || '-'}</p>
            </td></tr>
          </table>

          <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#18181b;">Message</p>
          <p style="margin:0 0 28px;font-size:14px;color:#3f3f46;line-height:1.6;white-space:pre-wrap;">${escapeHtml(message)}</p>
        </td></tr>

        <tr><td style="padding:20px 36px 32px;border-top:1px solid #f4f4f5;">
          <p style="margin:0;font-size:12px;color:#a1a1aa;">Reply to this email to respond to ${escapeHtml(name) || 'the customer'} directly.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
  })

  if (error) throw new Error(`Resend contact email failed: ${error.name} - ${error.message}`)
}

// ── Admin: new partner application ──────────────────────────────────────────
export async function sendPartnerRequestAdminEmail({
  requestId, token, name, email, mobile, city, company, message,
}: { requestId: string; token: string; name: string; email: string; mobile?: string; city?: string; company?: string; message?: string }) {
  const adminEmail = process.env.ADMIN_EMAIL
  if (!resend || !adminEmail) return

  // Token-protected review page — approve/reject without signing in.
  const reviewUrl = `${appUrl()}/partner-review/${requestId}?token=${token}`
  const { error } = await resend.emails.send({
    from: `${fromName()} <${fromEmail()}>`,
    to: adminEmail,
    replyTo: email,
    subject: `New partner application - ${name || email}`,
    html: `
<!DOCTYPE html><html lang="en"><head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;"><tr><td align="center">
    <table width="100%" style="max-width:520px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08);">
      <tr><td style="background:#0F3535;padding:28px 36px;">
        <p style="margin:0;color:#C9A24B;font-size:13px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;">The Golden Frame - Partner application</p>
      </td></tr>
      <tr><td style="padding:32px 36px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;border-radius:12px;padding:20px 24px;margin:0 0 24px;"><tr><td>
          <p style="margin:0 0 6px;font-size:13px;color:#52525b;"><strong style="color:#18181b;">Name:</strong> ${escapeHtml(name) || '-'}</p>
          <p style="margin:0 0 6px;font-size:13px;color:#52525b;"><strong style="color:#18181b;">Email:</strong> ${escapeHtml(email)}</p>
          <p style="margin:0 0 6px;font-size:13px;color:#52525b;"><strong style="color:#18181b;">Mobile:</strong> ${escapeHtml(mobile || '') || '-'}</p>
          <p style="margin:0 0 6px;font-size:13px;color:#52525b;"><strong style="color:#18181b;">City:</strong> ${escapeHtml(city || '') || '-'}</p>
          <p style="margin:0;font-size:13px;color:#52525b;"><strong style="color:#18181b;">Company:</strong> ${escapeHtml(company || '') || '-'}</p>
        </td></tr></table>
        ${message ? `<p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#18181b;">Message</p><p style="margin:0 0 24px;font-size:14px;color:#3f3f46;line-height:1.6;white-space:pre-wrap;">${escapeHtml(message)}</p>` : ''}
        <div style="text-align:center;margin:0 0 12px;">
          <a href="${reviewUrl}&action=approve" style="display:inline-block;background:#C9A24B;color:#0F3535;font-size:14px;font-weight:700;text-decoration:none;padding:12px 26px;border-radius:999px;margin:0 6px 8px;">✓ Approve</a>
          <a href="${reviewUrl}&action=reject" style="display:inline-block;background:#ffffff;color:#3f3f46;border:1px solid #d4d4d8;font-size:14px;font-weight:700;text-decoration:none;padding:11px 26px;border-radius:999px;margin:0 6px 8px;">✕ Reject</a>
        </div>
        <p style="margin:0 0 24px;font-size:12px;color:#a1a1aa;text-align:center;">Opens a secure review page — no sign-in needed.</p>
      </td></tr>
      <tr><td style="padding:20px 36px 32px;border-top:1px solid #f4f4f5;">
        <p style="margin:0;font-size:12px;color:#a1a1aa;">Or manage all applications at ${appUrl()}/admin/partners</p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`,
  })
  if (error) throw new Error(`Resend partner-request email failed: ${error.name} - ${error.message}`)
}

// ── Partner: application approved ────────────────────────────────────────────
export async function sendPartnerApprovedEmail({ to, name }: { to: string; name?: string }) {
  if (!resend) return
  // Land them on the import screen, not the dashboard — a brand-new partner has no
  // albums yet, so bulk import is the first thing they actually need. The sign-in
  // step is unavoidable (magic link), but `next` carries them straight through.
  const loginUrl = `${appUrl()}/account/login?next=${encodeURIComponent('/partners/albums/import')}`
  const { error } = await resend.emails.send({
    from: `${fromName()} <${fromEmail()}>`,
    to,
    subject: `You're approved - welcome to The Golden Frame partners`,
    html: `
<!DOCTYPE html><html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;"><tr><td align="center">
    <table width="100%" style="max-width:520px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08);">
      <tr><td style="background:#0F3535;padding:28px 36px;">
        <p style="margin:0;color:#ffffff;font-size:18px;font-weight:600;">The Golden Frame</p>
      </td></tr>
      <tr><td style="padding:36px 36px 0;">
        <h1 style="margin:0 0 8px;font-size:24px;font-weight:600;color:#18181b;">You're approved 🎉</h1>
        <p style="margin:0 0 24px;font-size:16px;color:#71717a;line-height:1.6;">
          Hi ${escapeHtml(name || 'there')}, your partner account is active. Sign in to create AR albums for your customers - upload photo &amp; video pairs, or bulk-import from Google Drive or a ZIP.
        </p>
        <div style="text-align:center;margin:0 0 28px;">
          <a href="${loginUrl}" style="display:inline-block;background:#C9A24B;color:#0F3535;font-size:14px;font-weight:700;text-decoration:none;padding:13px 30px;border-radius:999px;">Sign in &amp; import your first album</a>
        </div>
        <p style="margin:0 0 24px;font-size:13px;color:#a1a1aa;">We'll email you a secure sign-in link - no password needed. Once you're in, you'll land straight on the import screen.</p>
      </td></tr>
      <tr><td style="padding:20px 36px 32px;border-top:1px solid #f4f4f5;">
        <p style="margin:0;font-size:12px;color:#a1a1aa;">© ${new Date().getFullYear()} The Golden Frame</p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`,
  })
  if (error) throw new Error(`Resend partner-approved email failed: ${error.name} - ${error.message}`)
}

// ── Admin: partner album ready, QR attached ─────────────────────────────────
/**
 * Sent when a PARTNER creates an album. The QR is the deliverable, so it goes to
 * admins only — never to the partner — along with a ready-to-send draft the admin
 * can forward to the partner once payment clears.
 */
export async function sendPartnerAlbumAdminEmail({
  frameId, arUrl, qrDataUrl, count, albumName, partnerEmail, partnerCompany, source,
}: {
  frameId: string
  arUrl: string
  qrDataUrl: string
  count: number
  albumName?: string
  partnerEmail: string
  partnerCompany?: string | null
  source?: string | null
}) {
  const to = adminEmails()
  if (!resend || to.length === 0) return

  const shortRef = frameId.slice(-8).toUpperCase()
  const partnerLabel = partnerCompany ? `${partnerCompany} (${partnerEmail})` : partnerEmail

  // The QR is only attachable if album creation actually produced one.
  const attachments = qrDataUrl
    ? [{
        filename: `qr-${frameId}.png`,
        content: Buffer.from(qrDataUrl.replace(/^data:image\/png;base64,/, ''), 'base64'),
        inlineContentId: 'qrcode',
      }]
    : undefined

  // Plain-text draft the admin can copy straight into a reply to the partner.
  const draft = [
    `Subject: Your AR album is ready - ${albumName || shortRef}`,
    ``,
    `Hi${partnerCompany ? ` ${partnerCompany}` : ''},`,
    ``,
    `Your AR album "${albumName || shortRef}" is ready - ${count} photo${count === 1 ? '' : 's'}, one QR code for the whole album.`,
    `The QR code is attached to this email. Print it and place it with the photos; scanning it opens the AR viewer.`,
    ``,
    `Album reference: ${frameId}`,
    `AR link: ${arUrl}`,
    ``,
    `Thanks for your payment - shout if you need anything.`,
    ``,
    `- ${fromName()}`,
  ].join('\n')

  const { error } = await resend.emails.send({
    from: `${fromName()} <${fromEmail()}>`,
    to,
    replyTo: partnerEmail,
    subject: `Partner album ready #${shortRef} - ${partnerLabel} (QR attached, awaiting payment)`,
    html: `
<!DOCTYPE html><html lang="en"><head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;"><tr><td align="center">
    <table width="100%" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08);">

      <tr><td style="background:#0F3535;padding:28px 36px;">
        <p style="margin:0;color:#C9A24B;font-size:13px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;">Admin - Partner album</p>
        <p style="margin:4px 0 0;color:#ffffff;font-size:20px;font-weight:600;">Album #${shortRef}</p>
      </td></tr>

      <tr><td style="padding:32px 36px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#fefce8;border:1px solid #fde68a;border-radius:12px;padding:14px 24px;margin:0 0 24px;"><tr><td>
          <p style="margin:0;font-size:14px;font-weight:700;color:#92400e;">Payment not yet confirmed - do not send the QR until it is.</p>
        </td></tr></table>

        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;border-radius:12px;padding:20px 24px;margin:0 0 24px;"><tr><td>
          <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#18181b;">Album details</p>
          <p style="margin:0 0 6px;font-size:13px;color:#52525b;"><strong style="color:#18181b;">Partner:</strong> ${escapeHtml(partnerLabel)}</p>
          <p style="margin:0 0 6px;font-size:13px;color:#52525b;"><strong style="color:#18181b;">Album name:</strong> ${escapeHtml(albumName || '-')}</p>
          <p style="margin:0 0 6px;font-size:13px;color:#52525b;"><strong style="color:#18181b;">Photos:</strong> ${count}</p>
          <p style="margin:0 0 6px;font-size:13px;color:#52525b;"><strong style="color:#18181b;">Source:</strong> ${escapeHtml(source || 'manual')}</p>
          <p style="margin:0;font-size:13px;color:#52525b;"><strong style="color:#18181b;">Album reference:</strong> ${frameId}</p>
        </td></tr></table>

        ${qrDataUrl ? `
        <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#18181b;">QR code (attached - forward this to the partner after payment)</p>
        <div style="text-align:center;margin:0 0 24px;">
          <img src="cid:qrcode" alt="Album QR code" style="width:200px;height:200px;border-radius:12px;border:1px solid #e4e4e7;" />
        </div>` : `
        <p style="margin:0 0 24px;font-size:13px;color:#b91c1c;">QR generation failed for this album - regenerate it before sending.</p>`}

        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px 24px;margin:0 0 24px;"><tr><td>
          <p style="margin:0;font-size:13px;color:#166534;"><strong>AR viewer link:</strong><br />
            <a href="${arUrl}" style="color:#166534;word-break:break-all;">${arUrl}</a></p>
        </td></tr></table>

        <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#18181b;">Draft reply to the partner</p>
        <p style="margin:0 0 8px;font-size:12px;color:#a1a1aa;">Copy this once payment is confirmed, and attach the QR above.</p>
        <pre style="margin:0 0 24px;padding:16px 20px;background:#f4f4f5;border:1px solid #e4e4e7;border-radius:12px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;color:#3f3f46;white-space:pre-wrap;">${escapeHtml(draft)}</pre>
      </td></tr>

      <tr><td style="padding:20px 36px 32px;border-top:1px solid #f4f4f5;">
        <p style="margin:0;font-size:12px;color:#a1a1aa;">${fromName()} - Admin notification</p>
      </td></tr>

    </table>
  </td></tr></table>
</body></html>`,
    ...(attachments ? { attachments } : {}),
  })

  if (error) throw new Error(`Resend partner-album admin email failed: ${error.name} - ${error.message}`)
}

// ── Partner: album built, QR held until payment ─────────────────────────────
export async function sendPartnerAlbumPendingEmail({
  to, frameId, arUrl, count, albumName, partnerCompany,
}: {
  to: string
  frameId: string
  arUrl: string
  count: number
  albumName?: string
  partnerCompany?: string | null
}) {
  if (!resend) return

  const shortRef = frameId.slice(-8).toUpperCase()
  // Contact details come from the single source of truth in site-content, with an
  // env override in case the partner-facing number differs from the public one.
  const whatsappHref = process.env.NEXT_PUBLIC_WHATSAPP_URL ?? brand.whatsapp
  const contactEmail = process.env.EMAIL_FROM_ADDRESS ?? brand.email

  const { error } = await resend.emails.send({
    from: `${fromName()} <${fromEmail()}>`,
    to,
    subject: `Your AR album is ready - QR code pending payment (#${shortRef})`,
    html: `
<!DOCTYPE html><html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;"><tr><td align="center">
    <table width="100%" style="max-width:520px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08);">

      <tr><td style="background:#0F3535;padding:28px 36px;">
        <p style="margin:0;color:#ffffff;font-size:18px;font-weight:600;">${fromName()}</p>
      </td></tr>

      <tr><td style="padding:36px 36px 0;">
        <h1 style="margin:0 0 8px;font-size:24px;font-weight:600;color:#18181b;">Your album is ready 🎉</h1>
        <p style="margin:0 0 24px;font-size:16px;color:#71717a;line-height:1.6;">
          Hi${partnerCompany ? ` ${escapeHtml(partnerCompany)}` : ' there'}, your AR album
          ${albumName ? `<strong style="color:#18181b;">${escapeHtml(albumName)}</strong>` : ''}
          is built - ${count} photo${count === 1 ? '' : 's'}, all linked to a single QR code.
        </p>

        <table width="100%" cellpadding="0" cellspacing="0" style="background:#fefce8;border:1px solid #fde68a;border-radius:12px;padding:16px 24px;margin:0 0 24px;"><tr><td>
          <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#92400e;">One step left: payment</p>
          <p style="margin:0;font-size:13px;color:#92400e;line-height:1.6;">
            We'll email you the QR code as soon as payment for this album is confirmed. Get in touch and we'll share
            the payment details.
          </p>
        </td></tr></table>

        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;border-radius:12px;padding:20px 24px;margin:0 0 24px;"><tr><td>
          <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#18181b;">Get in touch</p>
          <p style="margin:0 0 6px;font-size:13px;color:#52525b;">
            <strong style="color:#18181b;">WhatsApp:</strong>
            <a href="${whatsappHref}" style="color:#1d4ed8;">${whatsappHref}</a>
          </p>
          <p style="margin:0 0 6px;font-size:13px;color:#52525b;">
            <strong style="color:#18181b;">Email:</strong>
            <a href="mailto:${contactEmail}" style="color:#1d4ed8;">${contactEmail}</a>
          </p>
          <p style="margin:0;font-size:13px;color:#52525b;"><strong style="color:#18181b;">Quote this reference:</strong> ${frameId}</p>
        </td></tr></table>

        <p style="margin:0 0 8px;font-size:13px;color:#71717a;">Want to check it first? Preview the album here:</p>
        <p style="margin:0 0 24px;font-size:13px;"><a href="${arUrl}" style="color:#1d4ed8;word-break:break-all;">${arUrl}</a></p>
      </td></tr>

      <tr><td style="padding:20px 36px 32px;border-top:1px solid #f4f4f5;">
        <p style="margin:0;font-size:12px;color:#a1a1aa;">© ${new Date().getFullYear()} ${fromName()}</p>
      </td></tr>

    </table>
  </td></tr></table>
</body></html>`,
  })

  if (error) throw new Error(`Resend partner-album pending email failed: ${error.name} - ${error.message}`)
}

// Escape user-supplied text before interpolating into the enquiry email HTML.
function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// Legacy alias kept for any existing callers
export { sendCustomerConfirmationEmail as sendQREmail }
