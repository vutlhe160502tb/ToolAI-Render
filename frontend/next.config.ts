import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.vietqr.io',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'qr.sepay.vn',
        pathname: '/**',
      },
    ],
  },
  // Suppress middleware deprecation warning
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
};

export default nextConfig;
