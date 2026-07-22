import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.4.90'],
  async redirects() {
    return [
      { source: '/', destination: '/landing', permanent: true },
    ];
  },
  async headers() {
    return [
      {
        // The AR viewer HTML iterates often. Force revalidation so a new build
        // reaches phones immediately instead of a stale copy sticking in the
        // browser/CDN cache. The heavy engine below stays hard-cached.
        source: '/ar-viewer.html',
        headers: [
          { key: 'Cache-Control', value: 'no-cache' },
        ],
      },
      {
        // Self-hosted AR engine (three@0.132.2, mind-ar@1.2.2). These are
        // version-pinned and only change when we deliberately swap versions
        // (and bump the service-worker cache), so they're safe to cache hard.
        // Helps browsers without service-worker support skip revalidation.
        source: '/vendor/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
};

export default nextConfig;
