import { NextResponse } from "next/server"
import { buildExecutiveCommandCenter } from "@/lib/executive/command-center"

export async function GET() {
  try {
    const center = await buildExecutiveCommandCenter()

    return NextResponse.json({
      ok: true,
      center,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to build executive command center",
      },
      { status: 500 }
    )
  }
}
