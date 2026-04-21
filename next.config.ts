import type { NextConfig } from "next";

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
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
