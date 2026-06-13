import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

const fromName  = () => process.env.EMAIL_FROM_NAME    ?? 'The Golden Frame'
const fromEmail = () => process.env.EMAIL_FROM_ADDRESS ?? 'hello@thegoldenframe.co'
const appUrl    = () => process.env.NEXT_PUBLIC_APP_URL ?? 'https://thegoldenframe.co'

// ── Customer: order confirmation (no QR) ────────────────────────────────────
export async function sendCustomerConfirmationEmail({
  to, name, frameId,
}: { to: string; name: string; frameId: string }) {
  if (!resend) return

  const shortOrder = frameId.slice(-8).toUpperCase()

  await resend.emails.send({
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
            Hi ${name || 'there'}, thank you for your order. Our team will handcraft your personalised AR photo frame and have it on its way to you within 2–3 business days.
          </p>

          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e4e4e7;border-radius:12px;padding:20px 24px;margin:0 0 24px;">
            <tr><td>
              <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#18181b;">What happens next</p>
              <p style="margin:0 0 8px;font-size:13px;color:#52525b;">
                <strong style="color:#18181b;">1–2 business days</strong> — We craft your personalised frame
              </p>
              <p style="margin:0 0 8px;font-size:13px;color:#52525b;">
                <strong style="color:#18181b;">2–3 business days</strong> — Your frame is carefully packaged and shipped
              </p>
              <p style="margin:0;font-size:13px;color:#52525b;">
                <strong style="color:#18181b;">When it arrives</strong> — Scan the QR code on the back with your phone camera and watch your video come alive!
              </p>
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
}

// ── Admin: new order notification with QR ────────────────────────────────────
export async function sendAdminOrderNotification({
  frameId, customerName, customerEmail, qrDataUrl,
}: { frameId: string; customerName: string; customerEmail: string; qrDataUrl: string }) {
  const adminEmail = process.env.ADMIN_EMAIL
  if (!resend || !adminEmail) return

  const base64Data = qrDataUrl.replace(/^data:image\/png;base64,/, '')
  const buffer     = Buffer.from(base64Data, 'base64')
  const shortOrder = frameId.slice(-8).toUpperCase()
  const arUrl      = `${appUrl()}/ar?frame=${frameId}`

  await resend.emails.send({
    from: `${fromName()} <${fromEmail()}>`,
    to: adminEmail,
    subject: `New order #${shortOrder} — ${customerName || customerEmail}`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08);">

        <tr><td style="background:#18181b;padding:28px 36px;">
          <p style="margin:0;color:#f59e0b;font-size:13px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;">Admin — New Order</p>
          <p style="margin:4px 0 0;color:#ffffff;font-size:20px;font-weight:600;">Order #${shortOrder}</p>
        </td></tr>

        <tr><td style="padding:32px 36px 0;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;border-radius:12px;padding:20px 24px;margin:0 0 24px;">
            <tr><td>
              <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#18181b;">Customer details</p>
              <p style="margin:0 0 4px;font-size:13px;color:#52525b;"><strong>Name:</strong> ${customerName || '—'}</p>
              <p style="margin:0 0 4px;font-size:13px;color:#52525b;"><strong>Email:</strong> ${customerEmail}</p>
              <p style="margin:0;font-size:13px;color:#52525b;"><strong>Frame ID:</strong> ${frameId}</p>
            </td></tr>
          </table>

          <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#18181b;">QR Code — print and stick to the back of the frame</p>
          <div style="text-align:center;margin:0 0 24px;">
            <img src="cid:qrcode" alt="QR Code"
              style="width:200px;height:200px;border-radius:12px;border:1px solid #e4e4e7;" />
          </div>

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
          <p style="margin:0;font-size:12px;color:#a1a1aa;">The Golden Frame — Admin Notification</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
    attachments: [
      { filename: `qr-${frameId}.png`, content: buffer },
    ],
  })
}

// Legacy alias kept for any existing callers
export { sendCustomerConfirmationEmail as sendQREmail }
