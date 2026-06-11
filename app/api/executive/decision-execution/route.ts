import { NextResponse } from "next/server"
import {
  generateExecutionTracker,
  summarizeExecutionTracker,
} from "@/lib/executive/decision-execution"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const decisions = await generateExecutionTracker()

    return NextResponse.json({
      ok: true,
      decisions,
      summary: summarizeExecutionTracker(decisions),
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate decision execution tracker",
      },
      { status: 500 }
    )
  }
}
