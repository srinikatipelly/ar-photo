'use client'

import { useRef, useState } from 'react'

type HeroVideoProps = {
  /** Path to the looping hero video (placeholder until a real clip is supplied). */
  src?: string
  /** Optional poster image shown before playback / if the video is missing. */
  poster?: string
  className?: string
}

/**
 * Background hero video - native <video>, muted autoplay loop (no extra deps).
 * Falls back gracefully to the gradient backdrop if the file is missing or fails,
 * so the hero always looks premium even before a real video is added.
 */
export function HeroVideo({ src = '/hero.mp4', poster, className = '' }: HeroVideoProps) {
  const ref = useRef<HTMLVideoElement>(null)
  const [failed, setFailed] = useState(false)

  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      {/* Luxe gradient backdrop - always present */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,#1c4a47_0%,#0F3535_55%,#082020_100%)]" />

      {!failed && (
        <video
          ref={ref}
          className="absolute inset-0 h-full w-full object-cover opacity-40"
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

      {/* Darkening overlay for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-green-deep/40 via-green-deep/55 to-green-deep" />
    </div>
  )
}
