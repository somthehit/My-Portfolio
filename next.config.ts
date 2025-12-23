import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.microlink.io",
      },
      {
        protocol: "https",
        hostname: "i.microlink.io",
      },
      {
        protocol: "https",
        hostname: "cdn.microlink.io",
      },
      {
        protocol: "https",
        hostname: "iad.microlink.io",
      },
      {
        protocol: "https",
        hostname: "ryzylyyrniekxsxvowcc.supabase.co",
      },
    ],
  },
};

export default nextConfig;
