export function generateFrameId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let id = ''

  for (let i = 0; i < 6; i += 1) {
    id += chars[Math.floor(Math.random() * chars.length)]
  }

  return id
}
