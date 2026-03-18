/** @type {import('next').NextConfig} */

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
<<<<<<< HEAD
=======
  // Disable SW in development — avoids stale-cache confusion during dev
>>>>>>> 48fc2b9 (Updated full project with new content)
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts',
        expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
        cacheableResponse: { statuses: [0, 200] }
      }
    },
    {
      urlPattern: /\.(?:js|css|png|jpg|jpeg|svg|gif|ico|woff2?)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-assets',
        expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 365 }
      }
    },
    {
      urlPattern: /\/api\/.*$/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        networkTimeoutSeconds: 10,
        expiration: { maxEntries: 50, maxAgeSeconds: 60 * 5 },
        cacheableResponse: { statuses: [0, 200] }
      }
    }
  ]
})

const nextConfig = {
  reactStrictMode: true,
<<<<<<< HEAD
  // Ensure client components work properly
  experimental: {
    // appDir is stable in Next 14
=======

  // Correct cache headers for the service worker and workbox bundle.
  // Without these, browsers may cache an old SW indefinitely.
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' }
        ]
      },
      {
        source: '/workbox-:hash.js',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }
        ]
      }
    ]
>>>>>>> 48fc2b9 (Updated full project with new content)
  }
}

module.exports = withPWA(nextConfig)
