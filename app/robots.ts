import type { MetadataRoute } from 'next'
import { brand } from '@/lib/site-content'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Keep internal/admin + order flow out of the index.
      disallow: ['/dashboard', '/api/', '/order/', '/account'],
    },
    sitemap: `${brand.siteUrl}/sitemap.xml`,
  }
}
