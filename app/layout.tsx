import type { Metadata, Viewport } from 'next'
import { DM_Sans, Plus_Jakarta_Sans } from 'next/font/google'
import { Toaster } from 'sonner'
import { ThemeProvider } from '@/components/theme-provider'
import { CookieConsentBanner } from '@/components/cookie-consent-banner'
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

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: 'Účetní OS - Portál pro klienty a účetní',
  description: 'Komplexní webová aplikace pro účetní firmu - samoobslužný portál pro klienty a master dashboard pro účetní',
  icons: {
    icon: '/favicon.svg',
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
        <meta name="theme-color" content="#7c3aed" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className={`${dmSans.variable} ${plusJakarta.variable} font-sans`}>
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
          }
        ` }} />
        <ThemeProvider>
          {children}
          <Toaster position="top-center" richColors />
          <CookieConsentBanner />
        </ThemeProvider>
      </body>
    </html>
  )
}
