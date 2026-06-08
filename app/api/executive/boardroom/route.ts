import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  loadBoardroomContext,
  runBoardroomSession,
  type BoardroomAgentReport,
  type BoardroomSession,
} from "@/lib/executive/boardroom"
import { saveBoardroomKeyDecisions } from "@/lib/executive/decision-memory"

type StoredBoardroomDecisions = {
  agents: BoardroomAgentReport[]
  keyDecisions: string[]
  topPriorities: string[]
  majorRisks: string[]
  majorOpportunities: string[]
}

function serializeSession(session: {
  id: string
  sessionType: string
  healthScore: number | null
  summary: string | null
  decisions: unknown
  createdAt: Date
}) {
  const decisions = (session.decisions ?? {}) as Partial<StoredBoardroomDecisions>

  return {
    id: session.id,
    sessionType: session.sessionType,
    healthScore: session.healthScore,
    summary: session.summary,
    executiveSummary: session.summary,
    agents: Array.isArray(decisions.agents) ? decisions.agents : [],
    keyDecisions: Array.isArray(decisions.keyDecisions)
      ? decisions.keyDecisions
      : [],
    topPriorities: Array.isArray(decisions.topPriorities)
      ? decisions.topPriorities
      : [],
    majorRisks: Array.isArray(decisions.majorRisks) ? decisions.majorRisks : [],
    majorOpportunities: Array.isArray(decisions.majorOpportunities)
      ? decisions.majorOpportunities
      : [],
    createdAt: session.createdAt.toISOString(),
  }
}

function toStoredDecisions(session: BoardroomSession): StoredBoardroomDecisions {
  return {
    agents: session.agents,
    keyDecisions: session.keyDecisions,
    topPriorities: session.topPriorities,
    majorRisks: session.majorRisks,
    majorOpportunities: session.majorOpportunities,
  }
}

export async function GET() {
  try {
    const sessions = await prisma.executiveBoardroomSession.findMany({
      orderBy: { createdAt: "desc" },
      take: 25,
    })

    return NextResponse.json({
      ok: true,
      sessions: sessions.map(serializeSession),
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch boardroom sessions",
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    let sessionType = "weekly"

    try {
      const body = await request.json()
      if (body?.sessionType && typeof body.sessionType === "string") {
        sessionType = body.sessionType.trim() || "weekly"
      }
    } catch {
      // Empty body is fine — default to weekly.
    }

    const context = await loadBoardroomContext(sessionType)
    const result = runBoardroomSession(context)

    const record = await prisma.executiveBoardroomSession.create({
      data: {
        sessionType: result.sessionType,
        healthScore: result.healthScore,
        summary: result.executiveSummary,
        decisions: toStoredDecisions(result),
      },
    })

    const decisionsCreated = await saveBoardroomKeyDecisions(
      record.id,
      result.keyDecisions
    )

    return NextResponse.json({
      ok: true,
      session: serializeSession(record),
      decisionsCreated,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to run boardroom session",
      },
      { status: 500 }
    )
  }
}
