// Generates brand assets for the marketing site from the logo:
//   • app/icon.png        — favicon (icon-only glyph on green, 512×512)
//   • public/apple-icon.png — same, for iOS home screen
//   • public/og.png       — Open Graph share image (1200×630, full lockup on green)
// Run: node scripts/generate-brand-assets.mjs
import sharp from 'sharp'
import { join } from 'path'

const GREEN = { r: 15, g: 53, b: 53, alpha: 1 }

function isArt(r, g, b) {
  return Math.abs(r - 18) + Math.abs(g - 60) + Math.abs(b - 58) > 90
}

// ── 1. Extract the icon-only glyph (first artwork band of logo.png) ───────────
const src = join(process.cwd(), 'public', 'logo.png')
const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
const { width, height, channels } = info

// Which rows contain artwork?
const rowArt = new Array(height).fill(false)
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const i = (y * width + x) * channels
    if (isArt(data[i], data[i + 1], data[i + 2])) { rowArt[y] = true; break }
  }
}

// Group rows into vertical bands separated by green gaps (icon / wordmark / tagline)
const bands = []
let start = -1
for (let y = 0; y < height; y++) {
  if (rowArt[y] && start < 0) start = y
  else if (!rowArt[y] && start >= 0) { bands.push([start, y - 1]); start = -1 }
}
if (start >= 0) bands.push([start, height - 1])

const [iy0, iy1] = bands[0] // icon band
let ix0 = width, ix1 = 0
for (let y = iy0; y <= iy1; y++) {
  for (let x = 0; x < width; x++) {
    const i = (y * width + x) * channels
    if (isArt(data[i], data[i + 1], data[i + 2])) { if (x < ix0) ix0 = x; if (x > ix1) ix1 = x }
  }
}

const iconBuf = await sharp(src)
  .extract({ left: ix0, top: iy0, width: ix1 - ix0 + 1, height: iy1 - iy0 + 1 })
  .toBuffer()

// Square icon on a green canvas (icon scaled to ~70% of the canvas)
const ICON = 512
const iconGlyph = await sharp(iconBuf).resize({ height: Math.round(ICON * 0.66), fit: 'inside' }).toBuffer()
for (const out of [['app', 'icon.png'], ['public', 'apple-icon.png']]) {
  await sharp({ create: { width: ICON, height: ICON, channels: 4, background: GREEN } })
    .composite([{ input: iconGlyph, gravity: 'center' }])
    .png()
    .toFile(join(process.cwd(), ...out))
  console.log(`icon -> ${out.join('/')} ${ICON}x${ICON}`)
}

// ── 2. Open Graph share image (full lockup on green) ──────────────────────────
const OG_W = 1200, OG_H = 630
const lockup = await sharp(join(process.cwd(), 'public', 'logo-mark.png'))
  .resize({ width: Math.round(OG_W * 0.62), fit: 'inside' })
  .toBuffer()
await sharp({ create: { width: OG_W, height: OG_H, channels: 4, background: GREEN } })
  .composite([{ input: lockup, gravity: 'center' }])
  .png()
  .toFile(join(process.cwd(), 'public', 'og.png'))
console.log(`og -> public/og.png ${OG_W}x${OG_H}`)
