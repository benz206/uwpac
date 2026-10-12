import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  cacheLife: {
    live: { stale: 30, revalidate: 60, expire: 300 },
    scrape: { stale: 60, revalidate: 1800, expire: 86_400 },
  },
};

export default nextConfig;
