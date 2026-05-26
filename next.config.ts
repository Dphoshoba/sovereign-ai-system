import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Keep heavy server-only packages external to lower build memory use.
  serverExternalPackages: [
    "@prisma/client",
    "prisma",
    "@prisma/adapter-pg",
    "pg",
    "openai",
    "ioredis",
  ],
  productionBrowserSourceMaps: false,
}

export default nextConfig
