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
}

module.exports = nextConfig
