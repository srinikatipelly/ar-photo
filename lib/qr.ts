import QRCode from 'qrcode'
import sharp from 'sharp'
import path from 'path'
import fs from 'fs'

export async function generateQRWithLogo(url: string): Promise<{ dataUrl: string; buffer: Buffer }> {
  const qrDataUrl = await QRCode.toDataURL(url, {
    width: 400,
    margin: 2,
    errorCorrectionLevel: 'H',
    color: { dark: '#000000', light: '#FFFFFF' },
  })

  const base64Data = qrDataUrl.replace(/^data:image\/png;base64,/, '')
  let qrBuffer: Buffer = Buffer.from(base64Data, 'base64')

  const logoPath = path.join(process.cwd(), 'public', 'qr-logo.png')
  if (fs.existsSync(logoPath)) {
    const logoSize = 80 // ~20% of 400px QR
    const logoBuffer = await sharp(logoPath)
      .resize(logoSize, logoSize, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png()
      .toBuffer()

    qrBuffer = await sharp(qrBuffer)
      .composite([{ input: logoBuffer, gravity: 'center' }])
      .png()
      .toBuffer()
  }

  const finalDataUrl = `data:image/png;base64,${qrBuffer.toString('base64')}`
  return { dataUrl: finalDataUrl, buffer: qrBuffer }
}
