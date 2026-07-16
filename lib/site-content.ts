// ─────────────────────────────────────────────────────────────────────────────
// Central content source for the premium marketing site (app/landing/*).
// Edit copy here - the pages render from this data, so no JSX changes needed.
// Seeded from brand/business-info.md and brand/content_db.md.
// ─────────────────────────────────────────────────────────────────────────────

export const brand = {
  name: 'The Golden Frame',
  siteUrl: 'https://www.thegoldenframe.com.au', // new marketing-site domain
  tagline: 'Where Memories Come Alive', // frames only - not for real estate / business
  phone: '0427 649 892',
  phoneIntl: '+61427649892',
  whatsapp: 'https://wa.me/61427649892',
  email: 'hello@thegoldenframe.com.au',
  instagram: 'https://www.instagram.com/thegoldenframe.ar',
  instagramHandle: 'thegoldenframe.ar',
  facebook: 'https://www.facebook.com/profile.php?id=61590971710781',
  facebookHandle: 'The Golden Frame',
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
  { label: 'Contact', href: '/landing/contact' },
]

// ── How it works ────────────────────────────────────────────────────────────--
export type Step = { step: string; title: string; body: string }

export const howItWorks: Step[] = [
  {
    step: 'Scan',
    title: 'Scan the frame',
    body: 'Point your phone camera at the photo - no app to download. WebAR opens right in your browser.',
  },
  {
    step: 'Watch',
    title: 'Watch it come alive',
    body: 'Your chosen video plays seamlessly over the photo in augmented reality, with sound.',
  },
  {
    step: 'Relive',
    title: 'Relive the moment',
    body: 'Hear their voice, see them move, feel the moment again - any time, as often as you like.',
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
  /** Where the primary CTA points - order flow for frames, contact/demo for B2B */
  ctaHref: string
  /** Path to the 16:9 hero video for this category. Omit to hide the hero video entirely. */
  heroVideo?: string
  /** Optional poster image for the hero video */
  heroPoster?: string
  /** Optional intro shown above an "occasions we cover" list */
  occasionsIntro?: string
  /** Optional list of occasions rendered as a chip grid (Special Events) */
  occasions?: string[]
  /** Optional 9:16 vertical demo video (e.g. Mother's Day mobile promo) */
  verticalVideo?: string
  /** Caption for the vertical demo video */
  verticalVideoLabel?: string
  /** Optional heading + note that emphasises contacting us (B2B / bespoke) */
  contactNote?: string
  /** Hide the hero heading/lead block on the detail page */
  hideHero?: boolean
  /** Hide the "Why you'll love it / What's included" features section */
  hideFeatures?: boolean
}

export const services: Service[] = [
  {
    slug: 'weddings',
    name: 'Weddings',
    summary: 'AR photo frames that turn your wedding portrait into a living memory.',
    showTagline: true,
    headline: 'Your wedding, alive forever',
    lead: 'Imagine your favourite wedding portrait on the wall - then scan it and watch your first dance, your vows, the laughter of the day play out in augmented reality. A keepsake that never stops giving.',
    features: [
      'Premium AR photo frame with your portrait',
      'Plays your first dance, speeches or highlight reel',
      'Hidden QR - scan with any phone, no app needed',
      'A timeless anniversary gift for years to come',
    ],
    cta: 'Create your wedding frame',
    ctaHref: '/landing/pricing',
    heroVideo: '/videos/hero.mp4',
    heroPoster: '/videos/hero-poster.jpg',
  },
  {
    slug: 'special-events',
    name: 'Special Events',
    summary: 'Any occasion, beautifully relived - one frame for every moment worth keeping.',
    showTagline: true,
    headline: 'A frame for every special moment',
    lead: 'Whatever the occasion, we can bring it to life. Choose any photo from any celebration and we’ll turn it into a living AR keepsake - scan it, and the moment plays again with all its warmth and sound. Be it a milestone, a holiday or a once-in-a-lifetime day, there’s no event we can’t create a frame for.',
    features: [
      'Any occasion - order any frame for any moment',
      'Bring the day back to life with video and sound',
      'An unforgettable, deeply personal gift',
      'Works on any phone - just point and watch',
    ],
    occasionsIntro:
      'From the biggest milestones to the quiet moments in between, we can create a frame for any of these - and anything else you have in mind:',
    occasions: [
      'Christmas',
      "Mother's Day",
      "Father's Day",
      'Weddings',
      'Milestone birthdays (18th, 21st, 30th, 40th, 50th, 60th)',
      "Kids' birthdays",
      'Anniversaries',
      'New baby / christening / naming day',
      "Valentine's Day",
      'Graduations',
      'Memorial / in-memoriam keepsakes',
      'Grandparents Day',
      'Retirement',
      'ANZAC Day',
      'Easter',
      'Australia Day',
      'New Year',
      'Engagements / proposals',
      'Baby showers / gender reveals',
      'Housewarming / new home',
    ],
    verticalVideo: '/videos/Mothers%20Day%20Mobile%20Video.mp4',
    verticalVideoLabel: "Mother's Day - a living memory in motion",
    cta: 'Create your event frame',
    ctaHref: '/landing/pricing',
    // No 16:9 hero video - the vertical "See it in motion" demo below is the real showcase.
    hideHero: true,
    hideFeatures: true,
  },
  {
    slug: 'real-estate-corporates',
    name: 'Real Estate & Corporates',
    summary: 'Scannable AR for listings, flyers, brochures and business cards - we supply the QR, you print your way.',
    showTagline: false,
    headline: 'Marketing that comes to life',
    lead: 'Give your real estate listings and corporate marketing a digital dimension. We create the AR experience and a QR code that links any printed piece - a listing photo, flyer, brochure or business card - to a walkthrough, drone reel, agent intro or brand video. We supply the digital QR code; you print it however suits your marketing.',
    features: [
      'One AR experience + QR code for real estate and corporate marketing',
      'Ideas: flyers, brochures, business cards, listing boards, packaging',
      'Plays walkthroughs, drone footage, agent or brand videos on scan',
      'No app required - opens straight in the phone camera (WebAR)',
      'We supply the digital QR code - print it whichever way suits you',
    ],
    contactNote:
      'Every business is different. Contact us and talk to us about your marketing goals - we’ll tailor the AR experience and QR code, then hand you the digital copy ready to print on flyers, brochures, business cards or anything else.',
    cta: 'Contact us & talk to us',
    ctaHref: '/landing/contact',
    heroVideo: '/videos/RealEstate_websiteAssets.mp4',
  },
  {
    slug: 'custom',
    name: 'Custom',
    summary: 'Something bespoke in mind? Be it any event, we can create a frame for your special moments.',
    showTagline: true,
    headline: 'Your moment, made bespoke',
    lead: 'Have something unique in mind? Whatever the occasion - any event, any idea - we can create a frame for your special moments. If it doesn’t fit a standard category, this is exactly where it belongs. Tell us what you’re imagining and we’ll design a custom AR frame around it. Contact us and talk to us - we’ll help bring it to life.',
    features: [
      'Any event, any idea - we create a frame for your special moments',
      'Fully bespoke to your photo, video and occasion',
      'A one-of-a-kind, deeply personal keepsake',
      'Works on any phone - just point and watch',
    ],
    cta: 'Contact us & talk to us',
    ctaHref: '/landing/contact',
    // Single merged contact section - the hero itself is contact-led, so no separate
    // contactNote block. No demo video - Custom is a bespoke, contact-led category.
    hideFeatures: true,
  },
]

/** 16:9 hero/showcase video on the landing page (placeholder until supplied). */
export const landingHeroVideo = '/videos/hero.mp4'
/** Still frame shown before the hero video loads / when motion is reduced. */
export const landingHeroPoster = '/videos/hero-poster.jpg'

/** 16:9 demo still shown on the demo page (phone scanning a framed photo). */
export const demoImage = '/demo.jpg'
/** Standalone wedding frame (with printed QR) that acts as the live AR target. */
export const demoFrame = '/weddingFrame1.png'
/** Branded QR that opens a live WebAR sample when scanned. */
export const demoQr = '/qr-demo.png'

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
    price: '$39',
    was: '$79',
    unit: '8×10 frame',
    description: 'Our signature living memory - a premium framed photo that plays your video in AR.',
    features: [
      'Premium 8×10 AR photo frame',
      'Up to 1 minute of video, with sound',
      'Hidden QR code - no app needed',
      'Dispatched in 2-3 business days',
    ],
    cta: 'Order your frame',
    href: '/landing/order',
    featured: true,
  },
  {
    name: 'Digital AR Only',
    price: 'From $19',
    unit: 'QR delivered by email',
    description: 'Just the AR experience and QR code - print or place it on anything yourself.',
    features: [
      'Photo + video brought to life in AR',
      'QR code delivered by email',
      'Use on cards, gifts or packaging',
      'No physical frame',
    ],
    cta: 'Get started',
    href: '/landing/order?kind=digital',
  },
  {
    name: 'Real Estate & Corporates',
    price: 'Custom',
    unit: 'volume & branding',
    description: 'AR-enabled flyers, brochures, business cards and boards, tailored to your brand.',
    features: [
      'Bulk processing & branded delivery',
      'Flyers, brochures, business cards, boards',
      'Volume pricing',
      'Dedicated support',
    ],
    cta: 'Talk to us',
    href: '/landing/contact',
  },
]

// ── Testimonials ──────────────────────────────────────────────────────────────
export type Testimonial = { quote: string; author: string; detail: string }

export const testimonials: Testimonial[] = [
  {
    quote: 'I gave my parents a frame of their wedding photo that plays their old video. My mum cried - it felt like going back in time.',
    author: 'Priya S.',
    detail: 'Anniversary gift',
  },
  {
    quote: 'Scanned my daughter’s birthday frame and watched her first steps play right over the photo. Absolute magic.',
    author: 'James M.',
    detail: 'Milestone birthday',
  },
  {
    quote: 'Our real estate flyers now play a full walkthrough when scanned. Clients are genuinely impressed - it sets us apart.',
    author: 'Daniel R.',
    detail: 'Real estate agency',
  },
]
