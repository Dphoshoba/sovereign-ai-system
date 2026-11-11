import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { validateEnv } from "@/lib/startup/validate-env"

export async function GET() {
  const envValidation = validateEnv()

  let database: "connected" | "disconnected" = "disconnected"

  try {
    await prisma.$queryRaw`SELECT 1`
    database = "connected"
  } catch (error) {
    console.error("Health check database probe failed:", error)
  }

  const ok = database === "connected" && envValidation.ok

  return NextResponse.json({ ok }, { status: ok ? 200 : 503 })
}
