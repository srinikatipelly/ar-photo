'use client'

interface QRDisplayProps {
  qrDataUrl: string
  frameId: string
}

export function QRDisplay({ qrDataUrl, frameId }: QRDisplayProps) {
  function downloadQR() {
    const link = document.createElement('a')
    link.href = qrDataUrl
    link.download = `ar-frame-${frameId}.png`
    link.click()
  }

  return (
    <div className="flex flex-col items-center gap-4 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
      <img src={qrDataUrl} alt="AR QR Code" className="h-48 w-48 rounded-2xl border border-zinc-100" />
      <p className="text-sm text-zinc-500">Frame ID: <strong className="text-zinc-900">{frameId}</strong></p>
      <p className="text-center text-xs text-zinc-400">
        Print this QR on the back of the frame.<br />
        Customer scans → points at the photo → the video plays.
      </p>
      <button
        onClick={downloadQR}
        className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
      >
        Download QR Code
      </button>
    </div>
  )
}
