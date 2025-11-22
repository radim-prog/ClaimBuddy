/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['lh3.googleusercontent.com'], // Google avatary
  },
  experimental: {
    serverActions: true,
  },
  // Pro Railway deployment
  output: 'standalone',
}

module.exports = nextConfig
