import type { NextConfig } from "next"

/** Keep ffmpeg, googleapis, and local-only scripts out of Vercel serverless traces. */
const vercelDisabledHeavyRouteExcludes = [
  "./node_modules/ffmpeg-static/**",
  "./node_modules/ffprobe-static/**",
  "./node_modules/fluent-ffmpeg/**",
  "./node_modules/googleapis/**",
  "./local/video/**",
  "./src/lib/video/**",
  "./src/lib/youtube/**",
  "./public/**/*.mp4",
  "./public/**/*.mp3",
  "./public/broll/**",
  "./public/backgrounds/**",
  "./public/captioned-renders/**",
  "./public/renders/**",
  "./public/rendered-videos/**",
  "./public/shorts/**",
  "./public/thumbnail-frames/**",
  "./public/youtube-thumbnails/**",
]

const vercelDisabledHeavyRoutes = [
  "/api/agents/render-video",
  "/api/agents/render-with-subtitles",
  "/api/agents/youtube-publish",
  "/api/youtube/render-video",
  "/api/youtube/render-shorts",
  "/api/youtube/generate-shorts",
  "/api/youtube/generate-thumbnail",
] as const

const outputFileTracingExcludes = Object.fromEntries(
  vercelDisabledHeavyRoutes.map((route) => [
    route,
    vercelDisabledHeavyRouteExcludes,
  ])
)

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
    "googleapis",
    "sharp",
  ],
  outputFileTracingExcludes,
  productionBrowserSourceMaps: false,
}

export default nextConfig
