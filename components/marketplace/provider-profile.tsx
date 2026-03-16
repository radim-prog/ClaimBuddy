'use client'

import Link from 'next/link'
import Script from 'next/script'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Star,
  CheckCircle,
  ArrowLeft,
  CreditCard,
  Shield,
} from 'lucide-react'

type Provider = {
  id: string
  name: string
  ico: string
  dic: string | null
  email: string
  phone: string | null
  website: string | null
  street: string | null
  city: string
  zip: string | null
  region: string | null
  description: string | null
  specializations: string[]
  capacity_status: 'accepting' | 'limited' | 'full'
  min_price: number | null
  max_price: number | null
  services: string[]
  logo_url: string | null
  featured: boolean
  created_at: string
}

const CAPACITY_CONFIG = {
  accepting: { label: 'Přijímá klienty', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  limited: { label: 'Omezená kapacita', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  full: { label: 'Plná kapacita', color: 'bg-red-100 text-red-800 border-red-200' },
} as const

function formatPrice(min: number | null, max: number | null): string {
  if (min && max) return `${min.toLocaleString('cs-CZ')} – ${max.toLocaleString('cs-CZ')} Kč / měsíc`
  if (min) return `od ${min.toLocaleString('cs-CZ')} Kč / měsíc`
  if (max) return `do ${max.toLocaleString('cs-CZ')} Kč / měsíc`
  return 'Cena na dotaz'
}

function buildAddress(provider: Provider): string | null {
  const parts = [provider.street, provider.city, provider.zip].filter(Boolean)
  return parts.length > 0 ? parts.join(', ') : null
}

/** Sanitize a string for safe embedding in JSON-LD (prevent script injection) */
function sanitizeForJsonLd(value: string | null | undefined): string | undefined {
  if (!value) return undefined
  return value
    .replace(/<\/?script[^>]*>/gi, '')
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
}

export function ProviderProfile({ provider }: { provider: Provider }) {
  const capacity = CAPACITY_CONFIG[provider.capacity_status] || CAPACITY_CONFIG.accepting
  const address = buildAddress(provider)

  // JSON-LD structured data for SEO (values sanitized)
  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'AccountingService',
    name: sanitizeForJsonLd(provider.name),
    description: sanitizeForJsonLd(provider.description),
    telephone: sanitizeForJsonLd(provider.phone),
    email: sanitizeForJsonLd(provider.email),
    url: sanitizeForJsonLd(provider.website),
    ...(address && {
      address: {
        '@type': 'PostalAddress',
        streetAddress: sanitizeForJsonLd(provider.street),
        addressLocality: sanitizeForJsonLd(provider.city),
        postalCode: sanitizeForJsonLd(provider.zip),
        addressRegion: sanitizeForJsonLd(provider.region),
        addressCountry: 'CZ',
      },
    }),
    priceRange: formatPrice(provider.min_price, provider.max_price),
  })

  return (
    <>
      {/* JSON-LD for search engines — uses next/script for safe embedding */}
      <Script
        id="provider-jsonld"
        type="application/ld+json"
        strategy="afterInteractive"
      >
        {jsonLd}
      </Script>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back link */}
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Zpět na katalog
        </Link>

        {/* Hero card */}
        <Card className="mb-6">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row gap-6">
              {/* Logo */}
              <div className="flex-shrink-0">
                {provider.logo_url ? (
                  <img
                    src={provider.logo_url}
                    alt={`Logo ${provider.name}`}
                    className="h-20 w-20 rounded-xl object-cover border border-border"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-xl bg-purple-100 flex items-center justify-center border border-purple-200">
                    <Building2 className="h-10 w-10 text-purple-600" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-start gap-2 mb-2">
                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                    {provider.name}
                  </h1>
                  {provider.featured && (
                    <Badge className="bg-purple-100 text-purple-800 border-purple-200 gap-1">
                      <Star className="h-3 w-3 fill-current" />
                      Doporučená
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mb-3">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {provider.city}
                    {provider.region && `, ${provider.region}`}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Shield className="h-4 w-4" />
                    IČO: {provider.ico}
                  </span>
                  {provider.dic && (
                    <span className="text-xs">DIČ: {provider.dic}</span>
                  )}
                </div>

                <Badge variant="outline" className={capacity.color}>
                  {capacity.label}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main content — left 2 cols */}
          <div className="lg:col-span-2 space-y-6">
            {/* About */}
            {provider.description && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">O firmě</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                    {provider.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Services */}
            {provider.services && provider.services.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Nabízené služby</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="grid sm:grid-cols-2 gap-2">
                    {provider.services.map((service) => (
                      <li
                        key={service}
                        className="flex items-center gap-2 text-sm text-muted-foreground"
                      >
                        <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                        {service}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Specializations */}
            {provider.specializations && provider.specializations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Specializace</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {provider.specializations.map((spec) => (
                      <Badge
                        key={spec}
                        variant="secondary"
                        className="bg-purple-50 text-purple-700 border-purple-200"
                      >
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar — right col */}
          <div className="space-y-6">
            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-purple-600" />
                  Ceník
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-semibold text-foreground mb-2">
                  {formatPrice(provider.min_price, provider.max_price)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Cena je orientační a závisí na rozsahu služeb.
                </p>
              </CardContent>
            </Card>

            {/* Contact */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Kontakt</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <a
                  href={`mailto:${provider.email}`}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Mail className="h-4 w-4 text-purple-600 flex-shrink-0" />
                  {provider.email}
                </a>

                {provider.phone && (
                  <a
                    href={`tel:${provider.phone}`}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Phone className="h-4 w-4 text-purple-600 flex-shrink-0" />
                    {provider.phone}
                  </a>
                )}

                {provider.website && (
                  <a
                    href={provider.website.startsWith('http') ? provider.website : `https://${provider.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Globe className="h-4 w-4 text-purple-600 flex-shrink-0" />
                    {provider.website.replace(/^https?:\/\//, '')}
                  </a>
                )}

                {address && (
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                    <span>{address}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* CTA */}
            <Card className="border-purple-200 bg-purple-50/50">
              <CardContent className="p-6 text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Zaujala vás tato firma? Zaregistrujte se a navažte spolupráci.
                </p>
                <Button asChild className="w-full bg-purple-600 hover:bg-purple-700">
                  <Link href="/auth/register">
                    Mám zájem o spolupráci
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}
