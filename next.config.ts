import type { NextConfig } from 'next'

// Content-Security-Policy. Allowlist tuned for what the app actually loads:
// the Mux player (stream + Mux Data/litix), Iconify icons, Google Fonts,
// Supabase, and Stripe redirects. 'unsafe-inline'/'unsafe-eval' are kept for
// Next.js hydration and the video player; the real protection here is the
// per-directive domain allowlist (blocks loading/exfiltration to other origins).
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https://image.mux.com https://api.iconify.design https://*.supabase.co",
  "media-src 'self' blob: https://*.mux.com",
  "connect-src 'self' https://*.supabase.co https://*.mux.com https://*.litix.io https://api.iconify.design https://api.stripe.com",
  "frame-src https://js.stripe.com https://hooks.stripe.com https://checkout.stripe.com",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  'upgrade-insecure-requests',
].join('; ')

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Frame-Options', value: 'DENY' },
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
