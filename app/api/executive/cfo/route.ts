import { NextResponse } from "next/server"
import { buildCfoIntelligence } from "@/lib/executive/cfo-intelligence"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  try {
    const cfo = await buildCfoIntelligence()

    return NextResponse.json({
      ok: true,
      cfo,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to build CFO intelligence",
      },
      { status: 500 }
    )
  }
}
