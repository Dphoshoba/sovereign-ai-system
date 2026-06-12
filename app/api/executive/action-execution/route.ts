import { NextResponse } from "next/server"
import { buildActionExecutionQueue } from "@/lib/executive/action-execution"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  try {
    const execution = await buildActionExecutionQueue()

    return NextResponse.json({
      ok: true,
      execution,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      { status: 500 }
    )
  }
}