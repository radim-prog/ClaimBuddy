import { ReactNode } from 'react';
import Link from 'next/link';

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <span className="text-xl font-bold">CB</span>
            </div>
            <span className="text-xl font-bold">ClaimBuddy</span>
          </Link>
          <nav className="flex gap-6 text-sm">
            <Link href="/legal/terms" className="hover:text-primary">
              Obchodní podmínky
            </Link>
            <Link href="/legal/privacy" className="hover:text-primary">
              Ochrana osobních údajů
            </Link>
            <Link href="/legal/cookies" className="hover:text-primary">
              Cookies
            </Link>
          </nav>
        </div>
      </header>
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-white rounded-lg shadow-sm p-8 prose prose-gray max-w-none">
          {children}
        </div>
      </main>
    </div>
  );
}
