import { NextResponse } from "next/server"
import { buildClientIntelligence } from "@/lib/executive/client-intelligence"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  try {
    const intelligence = await buildClientIntelligence()

    return NextResponse.json({
      ok: true,
      intelligence,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to build client intelligence",
      },
      { status: 500 }
    )
  }
}
