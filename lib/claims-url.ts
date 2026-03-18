/**
 * Claims URL helpers for clean URLs on claims.zajcon.cz.
 *
 * On claims.zajcon.cz, staff pages live at /claims/* instead of /accountant/claims/*.
 * The middleware rewrites /claims/dashboard → /accountant/claims/dashboard (server-side).
 * This module provides client-side helpers for Link hrefs and router.push().
 *
 * Edge Runtime compatible (used by middleware).
 */

// Paths under /claims/ that are PUBLIC pages (have real page.tsx, NOT redirects).
// These should NOT be rewritten to /accountant/claims/*.
const CLAIMS_PUBLIC_PREFIXES = [
  '/claims/new',
  '/claims/pricing',
  '/claims/review',
  '/claims/choose-service',
  '/claims/payment-success',
  '/claims/legal',
  '/claims/clients',
]

/** Check if running on claims.zajcon.cz (client-side only) */
export function isClaimsHost(): boolean {
  if (typeof window === 'undefined') return false
  return window.location.hostname === 'claims.zajcon.cz'
}

/**
 * Transform internal paths for clean claims.zajcon.cz URLs.
 *
 * On claims.zajcon.cz:
 *   /accountant/claims/dashboard → /claims/dashboard
 *   /accountant/claims/cases/123 → /claims/cases/123
 *
 * On app.zajcon.cz: returns path unchanged.
 *
 * Usage:
 *   <Link href={claimsHref('/accountant/claims/dashboard')}>
 *   router.push(claimsHref('/accountant/claims/cases'))
 */
export function claimsHref(path: string): string {
  if (!isClaimsHost()) return path
  if (path.startsWith('/accountant/claims')) {
    return path.replace('/accountant', '')
  }
  return path
}

/**
 * Check if a /claims/* path on claims.zajcon.cz should be rewritten
 * to /accountant/claims/* by middleware.
 *
 * Returns true for staff pages (dashboard, cases, settings, stats, insurers).
 * Returns false for public pages (new, pricing, review, clients, legal).
 *
 * Used by middleware (Edge Runtime).
 */
export function shouldRewriteClaimsPath(pathname: string): boolean {
  // /claims landing page — don't rewrite
  if (pathname === '/claims' || pathname === '/claims/') return false
  // Must start with /claims/
  if (!pathname.startsWith('/claims/')) return false
  // Public paths — don't rewrite (they have real page.tsx content)
  if (CLAIMS_PUBLIC_PREFIXES.some(p => pathname.startsWith(p))) return false
  // Everything else under /claims/* → rewrite to /accountant/claims/*
  return true
}

/**
 * Convert a clean claims URL to its internal path.
 * /claims/dashboard → /accountant/claims/dashboard
 *
 * Returns null if the path should not be rewritten.
 * Used by middleware (Edge Runtime).
 */
export function claimsToInternal(pathname: string): string | null {
  if (!shouldRewriteClaimsPath(pathname)) return null
  return '/accountant' + pathname
}
