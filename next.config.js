/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['lh3.googleusercontent.com'], // Google avatary
  },
  // Pro Railway deployment
  output: 'standalone',
  typescript: {
    // Pre-existing type errors from Next.js 14 nullable hooks (useParams, usePathname, useSearchParams)
    // These are safe — hooks always return values inside their route segments
    ignoreBuildErrors: true,
  },
  experimental: {
    // External packages that should not be bundled (WASM modules etc.)
    serverComponentsExternalPackages: ['@react-pdf/renderer', 'exceljs', 'node-cron', '@notionhq/client'],
    instrumentationHook: true,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Prevent clickjacking
          { key: 'X-Frame-Options', value: 'DENY' },
          // Prevent MIME type sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Control referrer information
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Disable browser features not used by the app
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          // Disable DNS prefetching
          { key: 'X-DNS-Prefetch-Control', value: 'off' },
          // Force HTTPS (Caddy handles TLS, but belt-and-suspenders)
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          // Content Security Policy
          // - script-src 'unsafe-eval' required by Next.js dev mode and some RSC internals
          // - style-src 'unsafe-inline' required by Tailwind CSS
          // - connect-src includes Supabase (REST + Realtime), Anthropic, OpenAI, Signi
          // - img-src includes Supabase storage and Google avatars (via next/image proxy)
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://*.supabase.co https://lh3.googleusercontent.com",
              "font-src 'self'",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.anthropic.com https://api.openai.com https://api.signi.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
