import type { NextConfig } from "next";

// See frontend/next.config.ts for why a full CSP isn't set yet. The admin
// panel has no third-party embeds, so X-Frame-Options: DENY here is
// unambiguously safe and specifically guards the login page from
// clickjacking.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
