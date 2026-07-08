// Content Security Policy. Scoped to what the app actually loads:
// - MapLibre base map + glyphs/sprites from CARTO (and openmaptiles fonts)
// - Supabase (data) and PostHog (analytics, when a key is set) over XHR
// - Cloudinary + Wikimedia images (location photos)
// 'unsafe-inline' scripts/styles are required by Next's hydration + MapLibre's
// inline styles; user content is React-escaped and JSON-LD is sanitized.
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "img-src 'self' data: blob: https://*.cartocdn.com https://res.cloudinary.com https://upload.wikimedia.org https://commons.wikimedia.org",
  "script-src 'self' 'unsafe-inline' https://us-assets.i.posthog.com",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data: https://fonts.openmaptiles.org https://*.cartocdn.com",
  "worker-src 'self' blob:",
  "connect-src 'self' https://*.cartocdn.com https://basemaps.cartocdn.com https://*.supabase.co https://us.i.posthog.com https://us-assets.i.posthog.com https://fonts.openmaptiles.org",
  "manifest-src 'self'",
  'upgrade-insecure-requests',
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), payment=(), usb=(), geolocation=(self)',
  },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
    ],
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
  // Canonicalize www -> apex so there is a single indexable origin.
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.pinnedatlas.com' }],
        destination: 'https://pinnedatlas.com/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
