import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@assistant-ui/react"],
  output: process.env.STATIC_EXPORT === 'true' ? 'export' : undefined,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
