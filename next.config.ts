import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  basePath: "/binhub",
  allowedDevOrigins: ["http://localhost:3000"],
  experimental: {
    serverActions: {
      bodySizeLimit: "2000mb",
    },
    proxyClientMaxBodySize: "2000mb",
  },
};

export default nextConfig;
