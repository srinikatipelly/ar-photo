// Crops the brand logos to their artwork by scanning pixels and finding the
// bounding box of everything that ISN'T the green plate. Robust to gradient
// backgrounds and perimeter artefacts that defeat sharp's edge `trim()`.
// Run: node scripts/trim-logo.mjs
import sharp from 'sharp'
import { join } from 'path'

// The artwork is gold/cream; the plate is green (~#0F3535). A pixel is "art" if
// it's clearly brighter/warmer than green. We test how far it is from greenish.
function isArtwork(r, g, b) {
  // Distance from the green plate family. Gold/cream are far; green is near.
  const greenR = 18, greenG = 60, greenB = 58 // a touch above plate to absorb gradient
  const d = Math.abs(r - greenR) + Math.abs(g - greenG) + Math.abs(b - greenB)
  return d > 90
}

const jobs = [
  { src: ['public', 'logo.png'], out: ['public', 'logo-trimmed.png'], pad: 0.06 },
  { src: ['brand', 'logo', '1 logo-16.png'], out: ['public', 'logo-mark.png'], pad: 0.08 },
]

for (const job of jobs) {
  const src = join(process.cwd(), ...job.src)
  const out = join(process.cwd(), ...job.out)

  const { data, info } = await sharp(src)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const { width, height, channels } = info
  let minX = width, minY = height, maxX = 0, maxY = 0
  let found = false

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels
      if (isArtwork(data[i], data[i + 1], data[i + 2])) {
        found = true
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }

  if (!found) {
    console.log(`${job.src.join('/')}  no artwork detected — skipped`)
    continue
  }

  // Add a little breathing room around the artwork, clamped to image bounds.
  const padX = Math.round((maxX - minX) * job.pad)
  const padY = Math.round((maxY - minY) * job.pad)
  const left = Math.max(0, minX - padX)
  const top = Math.max(0, minY - padY)
  const cropW = Math.min(width - left, maxX - minX + 1 + padX * 2)
  const cropH = Math.min(height - top, maxY - minY + 1 + padY * 2)

  await sharp(src).extract({ left, top, width: cropW, height: cropH }).toFile(out)
  console.log(`${job.src.join('/')}  ${width}x${height} -> ${job.out.join('/')}  ${cropW}x${cropH}`)
}
