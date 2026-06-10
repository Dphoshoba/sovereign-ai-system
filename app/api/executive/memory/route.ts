import { NextResponse } from "next/server"
import { buildExecutiveMemory } from "@/lib/executive/memory"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const memory = await buildExecutiveMemory()

    return NextResponse.json({
      ok: true,
      memory,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to build executive memory",
      },
      { status: 500 }
    )
  }
}
