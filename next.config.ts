import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Workaround: Turbopack on Windows has a path separator bug in TS checking.
  // Type safety is enforced by `tsc --noEmit` / IDE instead.
  typescript: {
    ignoreBuildErrors: true,
  },
  // Include template files in serverless function bundles (Vercel)
  outputFileTracingIncludes: {
    "/api/webhooks/paystack": ["./public/templates/**/*"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "*.b-cdn.net",
      },
    ],
  },
};

export default nextConfig;
