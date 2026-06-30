import type { MetadataRoute } from 'next'
import { brand, services } from '@/lib/site-content'

// Sitemap for the premium marketing site (thegoldenframe.com.au).
export default function sitemap(): MetadataRoute.Sitemap {
  const base = brand.siteUrl
  const now = new Date()

  const staticRoutes = ['/landing', '/landing/services', '/landing/demo', '/landing/pricing'].map(
    (path) => ({
      url: `${base}${path}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: path === '/landing' ? 1 : 0.8,
    }),
  )

  const serviceRoutes = services.map((s) => ({
    url: `${base}/landing/services/${s.slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  return [...staticRoutes, ...serviceRoutes]
}
