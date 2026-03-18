import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Workaround: Turbopack on Windows has a path separator bug in TS checking.
  // Type safety is enforced by `tsc --noEmit` / IDE instead.
  typescript: {
    ignoreBuildErrors: true,
  },
  outputFileTracingIncludes: {
    "/api/webhooks/paystack": ["./node_modules/exceljs/**/*"],
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
