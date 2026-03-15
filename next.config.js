/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['lh3.googleusercontent.com'], // Google avatary
  },
  // Pro Railway deployment
  output: 'standalone',
  experimental: {
    // External packages that should not be bundled (WASM modules etc.)
    serverComponentsExternalPackages: ['@react-pdf/renderer', 'exceljs', 'node-cron', '@notionhq/client'],
    instrumentationHook: true,
  },
}

module.exports = nextConfig
