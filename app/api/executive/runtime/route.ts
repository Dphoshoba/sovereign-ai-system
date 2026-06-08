import { NextResponse } from "next/server"
import { runSovereignRuntime } from "@/lib/executive/runtime"

export async function GET() {
  try {
    const runtime = await runSovereignRuntime()

    return NextResponse.json({
      ok: true,
      runtime,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to run sovereign runtime",
      },
      { status: 500 }
    )
  }
}
