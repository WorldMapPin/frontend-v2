import type { NextConfig } from "next";

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://maps.googleapis.com https://maps.gstatic.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https://images.ecency.com https://files.peakd.com https://cdn.steemitimages.com https://img.leopedia.io https://img.travelfeed.io https://ui-avatars.com https://ipfs.io",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://api.hive.blog https://worldmappin.com https://beta-api.distriator.com wss:",
      "frame-ancestors 'none'",
    ].join('; ')
  }
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ui-avatars.com",
        port: "",
        pathname: "/api/**",
      },
      {
        protocol: "https",
        hostname: "images.ecency.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.ecency.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "files.peakd.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn.steemitimages.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ipfs.io",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "ipfs.io",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "img.leopedia.io",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "img.travelfeed.io",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
