import type { Metadata } from 'next'
import { demoImage, demoFrame, demoQr } from '@/lib/site-content'
import { Section, Eyebrow } from '@/components/site/Section'
import { Steps } from '@/components/site/Steps'

export const metadata: Metadata = {
  title: 'Demo',
  description: 'See how an AR photo frame works - open your camera, scan the QR and watch your photo come alive in augmented reality.',
  alternates: { canonical: '/landing/demo' },
}

export default function DemoPage() {
  return (
    <>
      {/* Hero - tell the user exactly what to do */}
      <Section tone="deep" className="pt-28">
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow>See it in action</Eyebrow>
          <h1 className="mt-3 font-display text-4xl text-cream sm:text-5xl">
            Open your camera. Watch it come alive.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-cream/70">
            No app, no sign-up. Just open your phone camera, scan the QR code, then point it at
            the photo - and watch a still image play as a moving video memory in augmented reality.
          </p>
        </div>

        {/* Instruction chips */}
        <div className="mx-auto mt-8 flex max-w-2xl flex-wrap items-center justify-center gap-3">
          {[
            { n: '1', label: 'Open your camera' },
            { n: '2', label: 'Scan the QR code' },
            { n: '3', label: 'Point at the photo' },
          ].map(({ n, label }) => (
            <span
              key={n}
              className="inline-flex items-center gap-2 rounded-full border border-gold-brand/40 bg-green-mid/40 px-4 py-2 text-xs font-semibold text-cream"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gold-brand text-[11px] font-bold text-green-deep">
                {n}
              </span>
              {label}
            </span>
          ))}
        </div>

        {/* Hero still - shows the camera + framed photo idea */}
        <div className="mx-auto mt-12 w-full max-w-3xl">
          <div className="relative aspect-video w-full overflow-hidden rounded-3xl border border-gold-brand/30 bg-green-mid/40 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={demoImage}
              alt="A phone camera scanning a framed wedding photo to play it in augmented reality"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        </div>
      </Section>

      {/* Try it yourself - live, side by side */}
      <Section tone="mid">
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow>Try it yourself</Eyebrow>
          <h2 className="mt-3 font-display text-3xl text-cream sm:text-4xl">
            A real, working sample
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-cream/70">
            Grab your phone, open the camera and scan the code on the left. Then point it at the
            wedding frame on the right - the photo will start to play.
          </p>
        </div>

        {/* Step 1 - scan the QR */}
        <div className="mx-auto mt-12 flex max-w-md flex-col items-center rounded-3xl border border-cream/15 bg-green-deep/40 p-8 text-center">
          <span className="font-display text-sm font-semibold uppercase tracking-[0.25em] text-gold-brand">
            01 · Scan
          </span>
          <h3 className="mt-3 font-display text-xl text-cream">Scan this QR code</h3>
          <p className="mt-2 text-sm leading-relaxed text-cream/70">
            Open your phone camera and hold it over the code - tap the link that pops up.
          </p>
          <div className="relative mx-auto mt-6">
            {/* pulsing glow to draw the eye */}
            <span className="absolute inset-0 -z-10 animate-ping rounded-3xl bg-gold-brand/20" />
            <div className="w-44 rounded-2xl bg-cream p-3 shadow-[0_16px_40px_-16px_rgba(0,0,0,0.6)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={demoQr}
                alt="Scan to open a live AR sample frame"
                width={176}
                height={176}
                className="h-auto w-full"
              />
            </div>
          </div>
        </div>

        {/* Step 2 - point at the photo, shown large at the frame's native ratio */}
        <div className="mx-auto mt-16 max-w-xl text-center">
          <span className="font-display text-sm font-semibold uppercase tracking-[0.25em] text-gold-brand">
            02 · Point
          </span>
          <h3 className="mt-3 font-display text-2xl text-cream sm:text-3xl">Point at this photo</h3>
          <p className="mt-3 text-sm leading-relaxed text-cream/70">
            With the sample open, aim your camera at the frame below and hold steady - the photo
            starts to play.
          </p>
        </div>

        <div className="mx-auto mt-10 w-full max-w-[24rem]">
          <div className="relative aspect-[2/3] w-full overflow-hidden rounded-2xl shadow-[0_28px_80px_-24px_rgba(0,0,0,0.75)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={demoFrame}
              alt="Wedding photo frame with a printed QR code - the live AR target"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
          <p className="mt-4 text-center text-xs uppercase tracking-[0.2em] text-cream/50">
            The live AR target
          </p>
        </div>

        <p className="mx-auto mt-10 max-w-xl text-center text-xs leading-relaxed text-cream/60">
          Tip: it works best in good light. On the printed frame we ship you, the QR and photo sit
          together - so a single scan does both steps at once.
        </p>
      </Section>

      {/* How it works */}
      <Section tone="deep">
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow>How it works</Eyebrow>
          <h2 className="mt-3 font-display text-3xl text-cream sm:text-4xl">Scan. Watch. Relive.</h2>
        </div>
        <div className="mt-12">
          <Steps />
        </div>
      </Section>

      {/* CTA */}
      <Section tone="cream">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl text-green-deep sm:text-4xl">
            Ready to create your own?
          </h2>
          <a
            href="/landing/services"
            className="mt-8 inline-block rounded-full bg-green-deep px-7 py-3.5 text-sm font-semibold text-cream transition hover:bg-green-mid"
          >
            Create Your AR Experience →
          </a>
        </div>
      </Section>
    </>
  )
}
