import { brand, services, pricingTiers, testimonials, landingHeroVideo } from '@/lib/site-content'
import { Section, Eyebrow } from '@/components/site/Section'
import { Steps } from '@/components/site/Steps'
import { ServiceCard } from '@/components/site/ServiceCard'
import { PricingCard } from '@/components/site/PricingCard'
import { TestimonialCard } from '@/components/site/TestimonialCard'
import { VideoFrame } from '@/components/site/VideoFrame'
import { WhatsAppButton } from '@/components/site/WhatsAppButton'

export default function LandingHome() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 sm:px-10">
        {/* Static luxe gradient backdrop */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,#1c4a47_0%,#0F3535_55%,#082020_100%)]"
        />
        {/* Fills the first screen (viewport minus the ~5rem nav) and centres content */}
        <div className="relative z-10 mx-auto grid min-h-[calc(100svh-6rem)] max-w-6xl items-center gap-10 py-10 lg:grid-cols-2 lg:gap-14">
          {/* Copy */}
          <div className="text-center lg:text-left">
            <Eyebrow>Living memories in augmented reality</Eyebrow>
            <h1 className="mt-5 text-4xl leading-[1.05] text-cream sm:text-5xl lg:text-6xl">
              What if your memories could speak?
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-cream/75 sm:text-base lg:mx-0">
              We craft premium AR photo frames that bring your most treasured moments to life.
              Scan the frame, and watch your video play in augmented reality — with sound and
              all the emotion of the moment.
            </p>
            <p className="tagline mt-4 text-xl text-gold-brand sm:text-2xl">{brand.tagline}</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <a
                href={brand.orderUrl}
                className="rounded-full bg-gold-brand px-7 py-3.5 text-sm font-semibold text-green-deep transition hover:bg-cream"
              >
                Create Your AR Experience →
              </a>
              <a
                href="/landing/demo"
                className="rounded-full border border-cream/30 px-7 py-3.5 text-sm font-semibold text-cream transition hover:border-gold-brand hover:text-gold-brand"
              >
                Watch the Demo
              </a>
            </div>
          </div>

          {/* 16:9 hero showcase video */}
          <div className="mx-auto w-full max-w-xl lg:max-w-none">
            <VideoFrame src={landingHeroVideo} fallbackLabel="Showcase video coming soon" />
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────────── */}
      <Section id="how-it-works" tone="deep">
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow>How it works</Eyebrow>
          <h2 className="mt-3 font-display text-3xl text-cream sm:text-4xl">
            Scan. Watch. Relive.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-cream/70">
            No app to download. WebAR opens straight in any phone camera — on iOS and Android.
          </p>
        </div>
        <div className="mt-12">
          <Steps />
        </div>
      </Section>

      {/* ── Services ─────────────────────────────────────────────────────────── */}
      <Section id="services" tone="mid">
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow>What we create</Eyebrow>
          <h2 className="mt-3 font-display text-3xl text-cream sm:text-4xl">
            Memories for every occasion
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-cream/70">
            From weddings to business marketing, we turn the things you hold onto into
            experiences you can relive.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((service) => (
            <ServiceCard key={service.slug} service={service} />
          ))}
        </div>
      </Section>

      {/* ── Demo teaser ──────────────────────────────────────────────────────── */}
      <Section id="demo" tone="deep">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <Eyebrow>See it in action</Eyebrow>
            <h2 className="mt-3 font-display text-3xl text-cream sm:text-4xl">
              A photo frame that plays a video
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-cream/70">
              Hang it on the wall. Scan the hidden QR with your phone. Watch a birthday message,
              a wedding dance, or a baby&apos;s first steps play in augmented reality — right over
              the photo.
            </p>
            <a
              href="/landing/demo"
              className="mt-7 inline-block rounded-full bg-gold-brand px-7 py-3.5 text-sm font-semibold text-green-deep transition hover:bg-cream"
            >
              Watch the Demo →
            </a>
          </div>
          <VideoFrame src={landingHeroVideo} fallbackLabel="Demo video coming soon" />
        </div>
      </Section>

      {/* ── Pricing teaser ───────────────────────────────────────────────────── */}
      <Section id="pricing" tone="mid">
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow>Pricing</Eyebrow>
          <h2 className="mt-3 font-display text-3xl text-cream sm:text-4xl">
            Simple, premium pricing
          </h2>
        </div>
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {pricingTiers.map((tier) => (
            <PricingCard key={tier.name} tier={tier} />
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-cream/60">
          <a href="/landing/pricing" className="font-semibold text-gold-brand hover:underline">
            See full pricing details →
          </a>
        </p>
      </Section>

      {/* ── Testimonials ─────────────────────────────────────────────────────── */}
      <Section id="testimonials" tone="deep">
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow>Loved by our customers</Eyebrow>
          <h2 className="mt-3 font-display text-3xl text-cream sm:text-4xl">
            Moments worth reliving
          </h2>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t) => (
            <TestimonialCard key={t.author} testimonial={t} />
          ))}
        </div>
      </Section>

      {/* ── Contact / CTA ────────────────────────────────────────────────────── */}
      <Section id="contact-cta" tone="cream">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl text-green-deep sm:text-4xl">
            Let&apos;s bring your moments to life
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-green-deep/75">
            Whether it&apos;s a wedding or event photo frame, a milestone gift, a real estate
            listing, or marketing for your small business — we&apos;ll help you turn it into a
            living AR experience. Order online, or talk to us and book a demo.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href={brand.orderUrl}
              className="rounded-full bg-green-deep px-7 py-3.5 text-sm font-semibold text-cream transition hover:bg-green-mid"
            >
              Create Your AR Experience →
            </a>
            <WhatsAppButton message="Hi! I'd love to know more about The Golden Frame AR frames." />
          </div>
          <p className="mt-6 text-sm text-green-deep/70">
            Or call{' '}
            <a href={`tel:${brand.phoneIntl}`} className="font-semibold underline">
              {brand.phone}
            </a>{' '}
            ·{' '}
            <a href={`mailto:${brand.email}`} className="font-semibold underline">
              {brand.email}
            </a>
          </p>
        </div>
      </Section>
    </>
  )
}
