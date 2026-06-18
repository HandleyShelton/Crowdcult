import type { NextConfig } from 'next'

// Baseline security headers. (A strict Content-Security-Policy is intentionally
// deferred — it needs careful allowlisting for the Mux player, Stripe, Iconify,
// fonts, and Supabase, and is best added with testing.)
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' }, // anti-clickjacking
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'image.mux.com' },
    ],
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
}

export default nextConfig
