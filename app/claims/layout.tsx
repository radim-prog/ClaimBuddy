import type { Metadata } from 'next'

export const metadata: Metadata = {
  icons: { icon: '/favicon-claims.svg' },
}

// Only handles public pages: /claims (landing) + /claims/new (intake form)
// All admin pages redirected to /accountant/claims/*
export default function ClaimsPublicLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
