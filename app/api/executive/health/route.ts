import { NextResponse } from "next/server"
import { buildExecutiveSystemHealth } from "@/lib/executive/system-health"

export async function GET() {
  try {
    const health = await buildExecutiveSystemHealth()
    const ok = Object.values(health).every((module) => module.ok)

    return NextResponse.json(
      {
        ok,
        ...health,
      },
      { status: ok ? 200 : 503 }
    )
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Executive system health check failed",
      },
      { status: 500 }
    )
  }
}
