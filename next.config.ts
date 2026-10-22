import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  cacheLife: {
    live: { stale: 30, revalidate: 30, expire: 60 },
    scrape: { stale: 60, revalidate: 1800, expire: 86_400 },
  },
};

export default nextConfig;
