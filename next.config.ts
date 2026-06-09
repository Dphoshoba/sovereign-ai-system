import type { NextConfig } from "next"

/** Keep ffmpeg and local-only render scripts out of Vercel serverless traces. */
const vercelDisabledVideoRouteExcludes = [
  "./node_modules/ffmpeg-static/**",
  "./node_modules/ffprobe-static/**",
  "./node_modules/fluent-ffmpeg/**",
  "./local/video/**",
  "./src/lib/video/**",
  "./public/**/*.mp4",
  "./public/**/*.mp3",
  "./public/broll/**",
  "./public/backgrounds/**",
  "./public/captioned-renders/**",
  "./public/renders/**",
  "./public/rendered-videos/**",
  "./public/shorts/**",
]

const nextConfig: NextConfig = {
  env: {
    BUILD_TIME: new Date().toISOString(),
  },
  serverExternalPackages: [
    "@prisma/client",
    "prisma",
    "@prisma/adapter-pg",
    "pg",
    "openai",
    "ioredis",
    "ffmpeg-static",
    "ffprobe-static",
    "fluent-ffmpeg",
  ],
  outputFileTracingExcludes: {
    "/api/agents/render-video": vercelDisabledVideoRouteExcludes,
    "/api/agents/render-with-subtitles": vercelDisabledVideoRouteExcludes,
  },
  productionBrowserSourceMaps: false,
}

export default nextConfig
