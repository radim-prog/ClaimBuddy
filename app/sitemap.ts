import type { MetadataRoute } from 'next'

const BASE_URL = 'https://app.zajcon.cz'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString()

  return [
    // Main pages
    { url: BASE_URL, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${BASE_URL}/pricing`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE_URL}/o-nas`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },

    // Audience pages
    { url: `${BASE_URL}/pro-ucetni`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE_URL}/pro-podnikatele`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },

    // Feature pages
    { url: `${BASE_URL}/funkce/vytezovani`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/funkce/uzaverky`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/funkce/cestovni-denik`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/funkce/marketplace`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/funkce/krizove-rizeni`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/funkce/podpisovani`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },

    // Marketplace (public)
    { url: `${BASE_URL}/marketplace`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },

    // Claims (public landing)
    { url: `${BASE_URL}/claims`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },

    // Legal
    { url: `${BASE_URL}/legal/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/legal/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/legal/cookies`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },

    // Auth (for SEO — registration page)
    { url: `${BASE_URL}/auth/register`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/auth/login`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
  ]
}
