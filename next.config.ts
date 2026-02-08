import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Externalize ws and its native dependencies for API routes
  serverExternalPackages: ["ws", "bufferutil", "utf-8-validate"],
};

export default withNextIntl(nextConfig);
