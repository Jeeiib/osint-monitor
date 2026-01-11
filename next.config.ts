import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Externalize ws and its native dependencies for API routes
  serverExternalPackages: ["ws", "bufferutil", "utf-8-validate"],
};

export default nextConfig;
