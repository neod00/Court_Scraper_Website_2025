import type { NextConfig } from "next";

const cspDirectives = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com https://pagead2.googlesyndication.com https://*.googlesyndication.com https://adservice.google.com https://*.googleadservices.com https://*.adtrafficquality.google https://*.google.com https://*.doubleclick.net https://*.gstatic.com https://*.googletagservices.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: https:",
  "media-src https:",
  "font-src 'self' https://fonts.gstatic.com",
  "connect-src 'self' https://*.supabase.co https://pagead2.googlesyndication.com https://*.googlesyndication.com https://*.google.com https://*.doubleclick.net https://*.adtrafficquality.google https://*.gstatic.com",
  "frame-src 'self' https://www.google.com https://googleads.g.doubleclick.net https://*.googlesyndication.com https://*.safeframe.googlesyndication.com https://tpc.googlesyndication.com https://*.doubleclick.net https://*.adtrafficquality.google https://*.google.com",
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          {
            key: 'Content-Security-Policy',
            value: cspDirectives.join('; '),
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ],
      },
    ];
  },
  async redirects() {
    return [
      // Legacy category slugs
      { source: '/category/real_estate', destination: '/category/real-estate', permanent: true },
      { source: '/category/bond', destination: '/category/bonds', permanent: true },
      { source: '/category/patent', destination: '/category/ip', permanent: true },
      // Legacy entry points
      { source: '/index', destination: '/', permanent: true },
      // Retired guide section (content merged into the blog)
      { source: '/guide/rehabilitation-asset-guide', destination: '/blog/court-auction-vs-rehabilitation-sale', permanent: true },
      { source: '/guide/bankruptcy-vs-auction', destination: '/blog/court-auction-vs-rehabilitation-sale', permanent: true },
      { source: '/guide/law-changes-2025', destination: '/blog', permanent: true },
      { source: '/guide', destination: '/blog', permanent: true },
    ];
  },
};

export default nextConfig;
