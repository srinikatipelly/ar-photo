import type { Metadata } from 'next'
import { getUsableCollection, type CollectionRejection } from '@/lib/collections'
import { brand } from '@/lib/site-content'
import CollectForm from './CollectForm'

// Public upload page behind a collection link (Phase 4 · W4).
//
// No login by design — the token in the URL is the credential, so the recipient
// can open it straight from a QR or a WhatsApp message.

export const metadata: Metadata = {
  title: 'Upload your photos & videos',
  // The URL is a secret handed to one person; keep it out of search results.
  robots: { index: false, follow: false },
}

const REJECTION_COPY: Record<CollectionRejection, { title: string; body: string }> = {
  // Deliberately vague — a bad token shouldn't reveal whether it ever existed.
  'not-found': {
    title: 'This link isn’t valid',
    body: 'Please double-check the link, or get in touch and we’ll send you a new one.',
  },
  submitted: {
    title: 'Already received — thank you!',
    body: 'This link has already been used. We have your files and will be in touch shortly. If you need to send more, just ask us for a new link.',
  },
  cancelled: {
    title: 'This link has been closed',
    body: 'Get in touch and we’ll send you a fresh one.',
  },
  expired: {
    title: 'This link has expired',
    body: 'Links are only valid for a limited time. Message us and we’ll send a new one straight away.',
  },
}

export default async function CollectPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const result = await getUsableCollection(token)

  if ('rejection' in result) {
    const { title, body } = REJECTION_COPY[result.rejection]
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-6 py-16 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-mark.png" alt={brand.name} className="mb-8 h-14 w-auto" />
        <h1 className="font-display text-3xl text-cream">{title}</h1>
        <p className="mt-4 text-sm leading-relaxed text-cream/70">{body}</p>
        <a
          href={`mailto:${brand.email}`}
          className="mt-8 rounded-full border border-cream/25 px-6 py-3 text-sm font-semibold text-cream transition hover:border-gold-brand hover:text-gold-brand"
        >
          Contact us
        </a>
      </main>
    )
  }

  const { collection } = result

  return (
    <CollectForm
      token={collection.token}
      kind={collection.kind}
      maxItems={collection.maxItems}
    />
  )
}
