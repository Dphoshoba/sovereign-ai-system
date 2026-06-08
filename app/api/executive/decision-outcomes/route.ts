import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { buildDecisionOutcomeSummary } from "@/lib/executive/decision-outcomes"
import { serializeDecision } from "@/lib/executive/decision-memory"
import { EXECUTIVE_LIST_LIMITS } from "@/lib/executive/list-limits"

export async function GET() {
  try {
    const decisions = await prisma.executiveDecision.findMany({
      orderBy: [{ createdAt: "desc" }],
      take: EXECUTIVE_LIST_LIMITS.decisions,
    })

    const serialized = decisions.map(serializeDecision)
    const summary = buildDecisionOutcomeSummary(serialized)

    return NextResponse.json({
      ok: true,
      summary,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to build decision outcome summary",
      },
      { status: 500 }
    )
  }
}
