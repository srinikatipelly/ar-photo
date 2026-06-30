import type { Metadata } from 'next'
import { brand } from '@/lib/site-content'
import { Section, Eyebrow } from '@/components/site/Section'
import { Steps } from '@/components/site/Steps'

export const metadata: Metadata = {
  title: 'Demo',
  description: 'See how an AR photo frame works — scan, watch and relive your memory in augmented reality.',
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
            This is what your customers experience — point a phone at the photo, and the video
            comes alive in augmented reality. No app required.
          </p>
        </div>

        {/* Demo video placeholder */}
        <div className="mx-auto mt-12 flex aspect-video w-full max-w-3xl items-center justify-center rounded-3xl border border-cream/15 bg-green-mid/40">
          <div className="text-center">
            <div className="text-6xl">🎞️</div>
            <p className="mt-3 text-sm text-cream/60">Demo video coming soon</p>
          </div>
        </div>

        {/* Try-it block */}
        <div className="mx-auto mt-10 max-w-xl rounded-3xl border border-cream/15 bg-green-mid/40 p-8 text-center">
          <h2 className="font-display text-2xl text-cream">Try it yourself</h2>
          <p className="mt-3 text-sm leading-relaxed text-cream/70">
            Scan a sample frame with your phone camera to experience WebAR live. (Sample QR
            coming soon — for now, order your own to see it work end to end.)
          </p>
          <div className="mx-auto mt-6 flex h-40 w-40 items-center justify-center rounded-2xl border border-dashed border-cream/30 text-cream/40">
            QR coming soon
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
            href={brand.orderUrl}
            className="mt-8 inline-block rounded-full bg-green-deep px-7 py-3.5 text-sm font-semibold text-cream transition hover:bg-green-mid"
          >
            Create Your AR Experience →
          </a>
        </div>
      </Section>
    </>
  )
}
