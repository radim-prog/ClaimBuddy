import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { CookieConsentBanner } from '@/components/cookie-consent-banner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Pojistná Pomoc - Vyřídíme vaši pojistnou událost',
  description: 'První Notion-only verze pro příjem a zpracování klientských případů.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs">
      <body className={inter.className}>
        {children}
        <Toaster />
        <CookieConsentBanner />
      </body>
    </html>
  );
}
