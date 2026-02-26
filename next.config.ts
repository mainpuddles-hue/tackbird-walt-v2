import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },

  // CIS Benchmark-compliant security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // CIS 4.1 — Prevent MIME type sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // CIS 4.2 — Prevent clickjacking
          { key: 'X-Frame-Options', value: 'DENY' },
          // CIS 4.3 — Enable XSS filter (legacy browsers)
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          // CIS 4.4 — Enforce HTTPS (1 year, include subdomains, preload)
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          // CIS 4.5 — Control referrer information leakage
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // CIS 4.6 — Restrict browser features
          {
            key: 'Permissions-Policy',
            value:
              'camera=(), microphone=(), geolocation=(self), payment=(self), usb=()',
          },
          // CIS 4.7 — Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com",
              "img-src 'self' data: blob: https://*.supabase.co https://tile.openstreetmap.org https://*.tile.openstreetmap.org",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com",
              "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests",
            ].join('; '),
          },
          // Prevent search engines from indexing non-production
          ...(process.env.NODE_ENV !== 'production'
            ? [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }]
            : []),
        ],
      },
    ]
  },
}

export default nextConfig
