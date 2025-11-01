import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/providers/auth-provider';
import { Toaster } from '@/components/ui/toaster';
import { CookieConsentBanner } from '@/components/cookie-consent-banner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ClaimBuddy - Vyřídíme vaši pojistnou událost',
  description: 'Profesionální asistence při pojistných událostech. Vyjednáme maximální plnění za fixní cenu. 500+ spokojených klientů.',
  keywords: ['pojistná událost', 'pojišťovna', 'reklamace', 'asistence'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="cs">
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <Toaster />
          <CookieConsentBanner />
        </AuthProvider>
      </body>
    </html>
  );
}
