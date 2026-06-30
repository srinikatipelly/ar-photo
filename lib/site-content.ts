// ─────────────────────────────────────────────────────────────────────────────
// Central content source for the premium marketing site (app/landing/*).
// Edit copy here — the pages render from this data, so no JSX changes needed.
// Seeded from brand/business-info.md and brand/content_db.md.
// ─────────────────────────────────────────────────────────────────────────────

export const brand = {
  name: 'The Golden Frame',
  siteUrl: 'https://www.thegoldenframe.com.au', // new marketing-site domain
  tagline: 'Where Memories Come Alive', // frames only — not for real estate / business
  phone: '0427 649 892',
  phoneIntl: '+61427649892',
  whatsapp: 'https://wa.me/61427649892',
  email: 'hello@thegoldenframe.com.au',
  instagram: 'https://www.instagram.com/thegoldenframe.creations',
  instagramHandle: 'thegoldenframe.creations',
  facebook: 'https://www.facebook.com/thegoldenframecreations',
  facebookHandle: 'thegoldenframecreations',
  orderUrl: '/landing/order', // premium branded order page (MVP /upload stays on .co)
} as const

// ── Top nav ───────────────────────────────────────────────────────────────────
export type NavItem = { label: string; href: string }

export const navItems: NavItem[] = [
  { label: 'Home', href: '/landing' },
  { label: 'Services', href: '/landing/services' },
  { label: 'Demo', href: '/landing/demo' },
  { label: 'Pricing', href: '/landing/pricing' },
  { label: 'Testimonials', href: '/landing#testimonials' },
  { label: 'Contact', href: '/landing#contact' },
]

// ── How it works ────────────────────────────────────────────────────────────--
export type Step = { step: string; title: string; body: string }

export const howItWorks: Step[] = [
  {
    step: 'Scan',
    title: 'Scan the frame',
    body: 'Point your phone camera at the photo — no app to download. WebAR opens right in your browser.',
  },
  {
    step: 'Watch',
    title: 'Watch it come alive',
    body: 'Your chosen video plays seamlessly over the photo in augmented reality, with sound.',
  },
  {
    step: 'Relive',
    title: 'Relive the moment',
    body: 'Hear their voice, see them move, feel the moment again — any time, as often as you like.',
  },
]

// ── Services ────────────────────────────────────────────────────────────────--
export type Service = {
  slug: string
  name: string
  /** Short tagline for cards */
  summary: string
  /** Whether to show the brand "Where Memories Come Alive" tagline (frames only) */
  showTagline: boolean
  /** Hero headline on the service detail page */
  headline: string
  /** Lead paragraph */
  lead: string
  /** Feature bullets */
  features: string[]
  /** Call-to-action label */
  cta: string
  /** Where the primary CTA points — order flow for frames, contact/demo for B2B */
  ctaHref: string
  /** Path to the 16:9 hero video for this category (placeholder until supplied) */
  heroVideo: string
  /** Optional poster image for the hero video */
  heroPoster?: string
}

export const services: Service[] = [
  {
    slug: 'weddings',
    name: 'Weddings',
    summary: 'AR photo frames that turn your wedding portrait into a living memory.',
    showTagline: true,
    headline: 'Your wedding, alive forever',
    lead: 'Imagine your favourite wedding portrait on the wall — then scan it and watch your first dance, your vows, the laughter of the day play out in augmented reality. A keepsake that never stops giving.',
    features: [
      'Premium AR photo frame with your portrait',
      'Plays your first dance, speeches or highlight reel',
      'Hidden QR — scan with any phone, no app needed',
      'A timeless anniversary gift for years to come',
    ],
    cta: 'Create your wedding frame',
    ctaHref: '/upload',
    heroVideo: '/videos/weddings.mp4',
  },
  {
    slug: 'birthdays',
    name: 'Birthdays, Kids & Events',
    summary: 'Milestone birthdays, baby firsts and celebrations that move and speak.',
    showTagline: true,
    headline: 'Every milestone, beautifully relived',
    lead: 'From a child’s first steps to a milestone birthday or a once-in-a-lifetime celebration, we turn the photo into a portal — scan it and the moment plays again, with all its warmth and sound.',
    features: [
      'Perfect for kids’ milestones and big birthdays',
      'Bring baby’s first steps or a birthday surprise to life',
      'An unforgettable, deeply personal gift',
      'Works on any phone — just point and watch',
    ],
    cta: 'Create your celebration frame',
    ctaHref: '/upload',
    heroVideo: '/videos/birthdays.mp4',
  },
  {
    slug: 'real-estate',
    name: 'Real Estate',
    summary: 'Add a scannable AR video to your listing photos — we provide the experience and QR code.',
    showTagline: false,
    headline: 'Listings that come to life',
    lead: 'Give your listing imagery a digital dimension. We create the AR experience and a QR code that links a property photo to a walkthrough, drone reel or agent introduction — so when it’s scanned, the listing comes alive. You print and place it your way.',
    features: [
      'We supply the AR experience + QR code linking your photo to a video',
      'Plays walkthroughs, drone footage or agent intros on scan',
      'No app required — opens straight in the phone camera (WebAR)',
      'We don’t print — use your own printer, or we’ll connect you with a printing partner',
    ],
    cta: 'Talk to us & book a demo',
    ctaHref: '/landing#contact',
    heroVideo: '/videos/real-estate.mp4',
  },
  {
    slug: 'business',
    name: 'Business',
    summary: 'Turn your marketing into scannable video experiences — we provide the AR and QR code.',
    showTagline: false,
    headline: 'Make your brand unforgettable',
    lead: 'Turn any printed item into a premium “live” experience. We create the AR experience and a QR code so your brochures, cards, packaging or marketing play a video message when scanned — adding emotional value and setting you apart. You handle printing; we’ll guide you or connect a partner.',
    features: [
      'We supply the AR experience + QR code that plays your video on scan',
      'Great for cards, brochures, packaging and marketing collateral',
      'Increase perceived product value instantly',
      'We don’t print — use your own printer, or we’ll connect you with a partner',
    ],
    cta: 'Talk to us & book a demo',
    ctaHref: '/landing#contact',
    heroVideo: '/videos/business.mp4',
  },
]

/** 16:9 hero/showcase video on the landing page (placeholder until supplied). */
export const landingHeroVideo = '/videos/hero.mp4'

export function getService(slug: string): Service | undefined {
  return services.find((s) => s.slug === slug)
}

// ── Pricing ─────────────────────────────────────────────────────────────────--
export type PricingTier = {
  name: string
  price: string
  was?: string
  unit: string
  description: string
  features: string[]
  cta: string
  href: string
  featured?: boolean
}

export const pricingTiers: PricingTier[] = [
  {
    name: 'AR Photo Frame',
    price: '$29',
    was: '$79',
    unit: '8×10 frame',
    description: 'Our signature living memory — a premium framed photo that plays your video in AR.',
    features: [
      'Premium 8×10 AR photo frame',
      'Up to 1 minute of video, with sound',
      'Hidden QR code — no app needed',
      'Dispatched in 2–3 business days',
    ],
    cta: 'Order your frame',
    href: '/landing/order',
    featured: true,
  },
  {
    name: 'Digital AR Only',
    price: 'From $19',
    unit: 'QR delivered by email',
    description: 'Just the AR experience and QR code — print or place it on anything yourself.',
    features: [
      'Photo + video brought to life in AR',
      'QR code delivered by email',
      'Use on cards, gifts or packaging',
      'No physical frame',
    ],
    cta: 'Get started',
    href: '/landing/order',
  },
  {
    name: 'Business & Real Estate',
    price: 'Custom',
    unit: 'volume & branding',
    description: 'AR-enabled brochures, flyers, boards and packaging at volume, tailored to your brand.',
    features: [
      'Bulk processing & branded delivery',
      'Flyers, brochures, boards, packaging',
      'Volume pricing',
      'Dedicated support',
    ],
    cta: 'Talk to us',
    href: '/landing#contact',
  },
]

// ── Testimonials ──────────────────────────────────────────────────────────────
export type Testimonial = { quote: string; author: string; detail: string }

export const testimonials: Testimonial[] = [
  {
    quote: 'I gave my parents a frame of their wedding photo that plays their old video. My mum cried — it felt like going back in time.',
    author: 'Priya S.',
    detail: 'Anniversary gift',
  },
  {
    quote: 'Scanned my daughter’s birthday frame and watched her first steps play right over the photo. Absolute magic.',
    author: 'James M.',
    detail: 'Milestone birthday',
  },
  {
    quote: 'Our real estate flyers now play a full walkthrough when scanned. Clients are genuinely impressed — it sets us apart.',
    author: 'Daniel R.',
    detail: 'Real estate agency',
  },
]
