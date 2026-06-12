import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

interface OrderEmailParams {
  to: string
  name: string
  frameId: string
  qrDataUrl: string
  sessionId?: string
}

export async function sendOrderConfirmationEmail({ to, name, frameId, qrDataUrl, sessionId }: OrderEmailParams) {
  if (!resend) {
    throw new Error('RESEND_API_KEY is not configured')
  }

  const base64Data = qrDataUrl.replace(/^data:image\/png;base64,/, '')
  const buffer = Buffer.from(base64Data, 'base64')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://arframes.com.au'
  const fromName = process.env.EMAIL_FROM_NAME ?? 'AR Frames'
  const fromEmail = process.env.EMAIL_FROM_ADDRESS ?? 'hello@arframes.com.au'
  const shortOrder = (sessionId ?? frameId).slice(-8).toUpperCase()

  await resend.emails.send({
    from: `${fromName} <${fromEmail}>`,
    to,
    subject: `Order confirmed — your AR frame QR code is here! (#${shortOrder})`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08);">

        <!-- Header -->
        <tr><td style="background:#18181b;padding:28px 36px;">
          <p style="margin:0;color:#ffffff;font-size:18px;font-weight:600;letter-spacing:-0.3px;">AR Frames</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:36px 36px 0;">
          <h1 style="margin:0 0 8px;font-size:24px;font-weight:600;color:#18181b;letter-spacing:-0.4px;">
            Order confirmed! 🎉
          </h1>
          <p style="margin:0 0 20px;font-size:16px;color:#71717a;">
            Hi ${name || 'there'}, thank you for your order. Your QR code is attached below.
          </p>

          <!-- QR image -->
          <div style="text-align:center;margin:24px 0;">
            <img src="cid:qrcode" alt="Your AR Frame QR Code"
              style="width:180px;height:180px;border-radius:12px;border:1px solid #e4e4e7;" />
            <p style="margin:10px 0 0;font-size:12px;color:#a1a1aa;">Scan this QR code to launch your AR experience</p>
          </div>

          <!-- How to use -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;border-radius:12px;padding:20px 24px;margin:0 0 24px;">
            <tr><td>
              <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#18181b;">How to use your frame</p>
              <ol style="margin:0;padding-left:18px;font-size:14px;color:#52525b;line-height:2;">
                <li>Save and print the QR code above</li>
                <li>Stick it on the back of your AR frame when it arrives</li>
                <li>Open your phone camera and point it at the photo</li>
                <li>Watch your video appear in augmented reality!</li>
              </ol>
            </td></tr>
          </table>

          <!-- Timeline -->
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e4e4e7;border-radius:12px;padding:20px 24px;margin:0 0 24px;">
            <tr><td>
              <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#18181b;">Your order timeline</p>
              <p style="margin:0 0 8px;font-size:13px;color:#52525b;">
                <strong style="color:#18181b;">Today</strong> — QR code delivered to your inbox ✓
              </p>
              <p style="margin:0 0 8px;font-size:13px;color:#52525b;">
                <strong style="color:#18181b;">1–2 business days</strong> — We craft your personalised frame
              </p>
              <p style="margin:0;font-size:13px;color:#52525b;">
                <strong style="color:#18181b;">2–3 business days</strong> — Your frame is shipped to your door
              </p>
            </td></tr>
          </table>

          <!-- AR link -->
          <p style="margin:0 0 24px;font-size:13px;color:#71717a;">
            You can also share this AR link directly:<br />
            <a href="${appUrl}/ar?frame=${frameId}" style="color:#18181b;word-break:break-all;">
              ${appUrl}/ar?frame=${frameId}
            </a>
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:24px 36px 32px;border-top:1px solid #f4f4f5;">
          <p style="margin:0;font-size:12px;color:#a1a1aa;">
            Order reference: <strong style="color:#71717a;">#${shortOrder}</strong><br />
            Questions? Reply to this email and we'll help.<br />
            © ${new Date().getFullYear()} AR Frames
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
    attachments: [
      { filename: `ar-frame-qr-${frameId}.png`, content: buffer },
    ],
  })
}

// Keep the old export name as an alias so existing callers (if any) don't break
export { sendOrderConfirmationEmail as sendQREmail }
