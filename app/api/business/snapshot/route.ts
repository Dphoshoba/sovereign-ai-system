import { NextResponse } from "next/server"
import { getBusinessSnapshot } from "@/lib/business/business-data-layer"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  try {
    const snapshot = await getBusinessSnapshot()

    return NextResponse.json({
      ok: true,
      snapshot,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to build business snapshot",
      },
      { status: 500 }
    )
  }
}
