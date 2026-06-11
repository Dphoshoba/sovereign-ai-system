import { NextResponse } from "next/server"
import { generateExecutiveAutomationActions } from "@/lib/executive/automation-engine"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  try {
    const automation = await generateExecutiveAutomationActions()

    return NextResponse.json({
      ok: true,
      automation,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate automation actions",
      },
      { status: 500 }
    )
  }
}
