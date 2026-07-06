import type { Metadata } from 'next'
import { demoImage, demoQr } from '@/lib/site-content'
import { Section, Eyebrow } from '@/components/site/Section'
import { Steps } from '@/components/site/Steps'

export const metadata: Metadata = {
  title: 'Demo',
  description: 'See how an AR photo frame works - scan, watch and relive your memory in augmented reality.',
  alternates: { canonical: '/landing/demo' },
}

export default function DemoPage() {
  return (
    <>
      <Section tone="deep" className="pt-28">
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow>See it in action</Eyebrow>
          <h1 className="mt-3 font-display text-4xl text-cream sm:text-5xl">Watch the magic</h1>
          <p className="mt-4 text-sm leading-relaxed text-cream/70">
            This is what your customers experience - point a phone at the photo, and the video
            comes alive in augmented reality. No app required.
          </p>
        </div>

        {/* Demo still */}
        <div className="mx-auto mt-12 w-full max-w-3xl">
          <div className="relative aspect-video w-full overflow-hidden rounded-3xl border border-gold-brand/30 bg-green-mid/40 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={demoImage}
              alt="An AR photo frame playing a video in augmented reality"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        </div>

        {/* Try-it block - scan the live sample */}
        <div className="mx-auto mt-10 max-w-xl rounded-3xl border border-cream/15 bg-green-mid/40 p-8 text-center">
          <h2 className="font-display text-2xl text-cream">Try it yourself</h2>
          <p className="mt-3 text-sm leading-relaxed text-cream/70">
            Point your phone camera at the code below to experience a live WebAR frame - no app
            required.
          </p>
          <div className="mx-auto mt-6 w-40 rounded-2xl bg-cream p-3 shadow-[0_16px_40px_-16px_rgba(0,0,0,0.6)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={demoQr}
              alt="Scan to open a live AR sample frame"
              width={160}
              height={160}
              className="h-auto w-full"
            />
          </div>
        </div>
      </Section>

      <Section tone="mid">
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow>How it works</Eyebrow>
          <h2 className="mt-3 font-display text-3xl text-cream sm:text-4xl">Scan. Watch. Relive.</h2>
        </div>
        <div className="mt-12">
          <Steps />
        </div>
      </Section>

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
