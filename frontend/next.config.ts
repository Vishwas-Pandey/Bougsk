import type { NextConfig } from "next";

// A full Content-Security-Policy is deliberately not set here yet — this
// page embeds Razorpay's Checkout iframe/script and redirects through
// Google/Supabase for sign-in, and a CSP tight enough to matter is easy
// to get subtly wrong (breaking payment or login) without live testing
// against those flows. The headers below are the safe, non-breaking
// subset that doesn't risk that.
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
