import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow newsdata.io image domains
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.newsdata.io" },
    ],
  },
  // Empty turbopack config silences the warning
  turbopack: {},
};

export default nextConfig;
