import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { validateEnv } from "@/lib/startup/validate-env"

function getEnvironment(): "development" | "production" {
  return process.env.NODE_ENV === "production" ? "production" : "development"
}

function getBuildTime() {
  return (
    process.env.BUILD_TIME ||
    process.env.NEXT_PUBLIC_BUILD_TIME ||
    "unknown"
  )
}

export async function GET() {
  const environment = getEnvironment()
  const envValidation = validateEnv()

  let database: "connected" | "disconnected" = "disconnected"

  try {
    await prisma.$queryRaw`SELECT 1`
    database = "connected"
  } catch (error) {
    console.error("Health check database probe failed:", error)
  }

  const ok = database === "connected" && envValidation.ok

  return NextResponse.json(
    {
      ok,
      version: "v1",
      database,
      buildTime: getBuildTime(),
      environment,
      env: {
        ok: envValidation.ok,
        missing: envValidation.missing,
        errors: envValidation.errors,
      },
    },
    { status: ok ? 200 : 503 }
  )
}
