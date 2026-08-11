import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  poweredByHeader: false,
  transpilePackages: ["@workspace/api-client-react"],
};

export default nextConfig;