import React from 'react'
import {
  AbsoluteFill,
  OffthreadVideo,
  staticFile,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'
import { loadFont as loadDisplay } from '@remotion/google-fonts/CormorantGaramond'
import { loadFont as loadBody } from '@remotion/google-fonts/Montserrat'

const display = loadDisplay().fontFamily
const body = loadBody().fontFamily

// Brand palette (matches the website)
const GREEN = '#0F3535'
const GREEN_MID = '#1c4a47'
const CREAM = '#F9E6C2'
const GOLD = '#C9A24B'

export type HeroProps = {
  /** Path under public/ to your AR screen recording, e.g. "videos/ar-recording.mp4". null = placeholder. */
  arSrc?: string | null
  headline?: string
  sub?: string
}

export const Hero: React.FC<HeroProps> = ({
  arSrc = null,
  headline = 'What if your memories could speak?',
  sub = 'Scan the frame. Watch it come alive.',
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const phoneIn = spring({ frame, fps, durationInFrames: 34, config: { damping: 200 } })
  const phoneY = interpolate(phoneIn, [0, 1], [70, 0])
  const phoneScale = interpolate(phoneIn, [0, 1], [0.9, 1])
  const float = Math.sin(frame / 26) * 7

  const textIn = spring({ frame: frame - 10, fps, durationInFrames: 34, config: { damping: 200 } })
  const textX = interpolate(textIn, [0, 1], [-50, 0])

  return (
    <AbsoluteFill style={{ backgroundColor: GREEN, fontFamily: body }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% -10%, ${GREEN_MID} 0%, ${GREEN} 55%, #082020 100%)`,
        }}
      />

      <AbsoluteFill
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: '0 150px',
          gap: 90,
        }}
      >
        {/* Copy */}
        <div style={{ flex: 1, transform: `translateX(${textX}px)`, opacity: textIn }}>
          <div
            style={{
              color: GOLD,
              letterSpacing: 9,
              fontSize: 22,
              textTransform: 'uppercase',
              fontWeight: 600,
            }}
          >
            The Golden Frame
          </div>
          <div
            style={{
              fontFamily: display,
              color: CREAM,
              fontSize: 86,
              lineHeight: 1.04,
              marginTop: 26,
              fontWeight: 600,
            }}
          >
            {headline}
          </div>
          <div style={{ color: 'rgba(249,230,194,0.82)', fontSize: 30, marginTop: 28, fontWeight: 300 }}>
            {sub}
          </div>
          <div style={{ fontFamily: display, fontStyle: 'italic', color: GOLD, fontSize: 34, marginTop: 22 }}>
            Where Memories Come Alive
          </div>
        </div>

        {/* Phone */}
        <div style={{ width: 420, display: 'flex', justifyContent: 'center' }}>
          <Phone y={phoneY + float} scale={phoneScale} arSrc={arSrc} body={body} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}

const Phone: React.FC<{ y: number; scale: number; arSrc: string | null; body: string }> = ({
  y,
  scale,
  arSrc,
  body,
}) => {
  const W = 384
  const H = 812
  const radius = 58
  const bezel = 14

  return (
    <div
      style={{
        transform: `translateY(${y}px) scale(${scale})`,
        width: W,
        height: H,
        borderRadius: radius,
        background: '#0a0a0a',
        boxShadow: '0 50px 130px rgba(0,0,0,0.6)',
        padding: bezel,
        position: 'relative',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: radius - bezel,
          overflow: 'hidden',
          position: 'relative',
          background: GREEN,
        }}
      >
        {arSrc ? (
          <OffthreadVideo
            src={staticFile(arSrc)}
            muted
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <AbsoluteFill
            style={{
              background: `radial-gradient(circle at 50% 30%, ${GREEN_MID}, ${GREEN})`,
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: 34,
            }}
          >
            <div>
              <div style={{ fontSize: 56 }}>🎞️</div>
              <div style={{ color: 'rgba(249,230,194,0.7)', fontSize: 17, marginTop: 18, fontFamily: body, lineHeight: 1.5 }}>
                Drop your AR screen recording at
                <br />
                <span style={{ color: GOLD }}>public/videos/ar-recording.mp4</span>
              </div>
            </div>
          </AbsoluteFill>
        )}
      </div>

      {/* Notch */}
      <div
        style={{
          position: 'absolute',
          top: bezel + 10,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 122,
          height: 26,
          borderRadius: 14,
          background: '#0a0a0a',
        }}
      />
    </div>
  )
}
