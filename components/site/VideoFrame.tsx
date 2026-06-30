'use client'

import { useEffect, useState } from 'react'

type VideoFrameProps = {
  /** Path to the looping video (placeholder until a real clip is supplied). */
  src?: string
  /** Optional poster image — shown before playback and when motion is reduced. */
  poster?: string
  /** Caption shown over the gradient fallback when the video is missing. */
  fallbackLabel?: string
  className?: string
}

/**
 * 16:9 framed showcase video — muted autoplay loop, gold border, rounded corners.
 * • Falls back to a luxe gradient + label if the file is missing or fails to load.
 * • Respects `prefers-reduced-motion`: shows the poster (or gradient) instead of
 *   autoplaying, so the page is calm and accessible for those who opt out of motion.
 */
export function VideoFrame({
  src,
  poster,
  fallbackLabel = 'Video coming soon',
  className = '',
}: VideoFrameProps) {
  const [failed, setFailed] = useState(!src)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const onChange = () => setReducedMotion(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const showVideo = src && !failed && !reducedMotion

  return (
    <div
      className={`relative aspect-video w-full overflow-hidden rounded-3xl border border-gold-brand/30 bg-green-mid/40 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)] ${className}`}
    >
      {/* Gradient backdrop — always present */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,#1c4a47_0%,#0F3535_60%,#082020_100%)]" />

      {/* Poster (if provided) sits above the gradient as a still fallback */}
      {poster && !showVideo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={poster} alt="" className="absolute inset-0 h-full w-full object-cover" />
      )}

      {showVideo && (
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src={src}
          poster={poster}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          onError={() => setFailed(true)}
        />
      )}

      {failed && !poster && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center">
          <span className="text-4xl" aria-hidden="true">🎞️</span>
          <span className="text-sm text-cream/60">{fallbackLabel}</span>
        </div>
      )}
    </div>
  )
}
