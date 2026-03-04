import { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="mb-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <span className="text-xl font-bold">CB</span>
              </div>
              <span className="text-xl font-bold">Pojistná Pomoc</span>
            </Link>
          </div>
          {children}
        </div>
      </div>

      {/* Right side - Illustration */}
      <div className="hidden lg:block relative flex-1 bg-gradient-to-br from-primary/10 via-primary/5 to-background">
        <div className="absolute inset-0 flex flex-col items-center justify-center p-12">
          <div className="max-w-md space-y-6 text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              Pojistné události vyřešené s jistotou
            </h2>
            <p className="text-lg text-muted-foreground">
              Moderní platforma pro efektivní správu pojistných událostí s AI asistentem, který vám
              pomůže každým krokem.
            </p>
            <div className="flex flex-col gap-4 pt-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <svg
                    className="h-6 w-6 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="font-semibold">Rychlé vyřízení</p>
                  <p className="text-sm text-muted-foreground">Průměrně 30% rychlejší proces</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <svg
                    className="h-6 w-6 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="font-semibold">AI asistent</p>
                  <p className="text-sm text-muted-foreground">
                    Dostupný 24/7 pro vaše dotazy
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <svg
                    className="h-6 w-6 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="font-semibold">Bezpečné</p>
                  <p className="text-sm text-muted-foreground">Šifrované uložení všech dat</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
