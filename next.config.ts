import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: [
    "http://localhost:3000",
    "d327-96-9-84-91.ngrok-free.app",
  ],
  experimental: {
    serverActions: {
      bodySizeLimit: "2000mb",
    },
    proxyClientMaxBodySize: "2000mb",
  },
};

export default nextConfig;
