import type { Metadata, Viewport } from 'next'
import { DM_Sans, Plus_Jakarta_Sans } from 'next/font/google'
import { Toaster } from 'sonner'
import { ThemeProvider } from '@/components/theme-provider'
import { CookieConsentBanner } from '@/components/cookie-consent-banner'
import { ChunkErrorBoundary } from '@/components/chunk-error-boundary'
import { VersionChecker } from '@/components/version-checker'
import {
  IS_CLAIMS_ONLY_PRODUCT,
  PRODUCT_BRAND,
  PRODUCT_DESCRIPTION,
  PRODUCT_PROJECT_NAME,
} from '@/lib/product-config'
import './globals.css'

const dmSans = DM_Sans({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-dm-sans',
})

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin', 'latin-ext'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-plus-jakarta',
})

const metadataBase = (() => {
  const fallbackUrl = IS_CLAIMS_ONLY_PRODUCT
    ? 'http://127.0.0.1:3020'
    : 'http://127.0.0.1:3003'

  try {
    return new URL(process.env.NEXT_PUBLIC_APP_URL || fallbackUrl)
  } catch {
    return new URL(fallbackUrl)
  }
})()

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  metadataBase,
  title: IS_CLAIMS_ONLY_PRODUCT
    ? `${PRODUCT_PROJECT_NAME} — ${PRODUCT_BRAND}`
    : 'Pojistná Pomoc - Portál pro klienty a účetní',
  description: IS_CLAIMS_ONLY_PRODUCT
    ? PRODUCT_DESCRIPTION
    : 'Komplexní webová aplikace pro účetní firmu - samoobslužný portál pro klienty a master dashboard pro účetní',
  icons: {
    icon: IS_CLAIMS_ONLY_PRODUCT ? '/favicon-claims.svg' : '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="cs" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content={IS_CLAIMS_ONLY_PRODUCT ? '#2563eb' : '#7c3aed'} />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className={`${dmSans.variable} ${plusJakarta.variable} font-sans`}>
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(function(registrations) {
              registrations.forEach(function(r) { r.unregister() })
            })
          }
        ` }} />
        <ThemeProvider>
          <ChunkErrorBoundary>
            {children}
          </ChunkErrorBoundary>
          <VersionChecker />
          <Toaster position="top-center" richColors />
          <CookieConsentBanner />
        </ThemeProvider>
      </body>
    </html>
  )
}
