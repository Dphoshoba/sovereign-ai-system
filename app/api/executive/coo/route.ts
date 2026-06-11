import { NextResponse } from "next/server"
import { buildCooIntelligence } from "@/lib/executive/coo-intelligence"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  try {
    const coo = await buildCooIntelligence()

    return NextResponse.json({
      ok: true,
      coo,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to build COO intelligence",
      },
      { status: 500 }
    )
  }
}
