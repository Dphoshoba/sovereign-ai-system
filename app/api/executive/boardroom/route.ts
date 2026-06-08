import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  loadBoardroomContext,
  runBoardroomSession,
  type BoardroomAgentReport,
  type BoardroomLearningSummary,
  type BoardroomSession,
} from "@/lib/executive/boardroom"
import { saveBoardroomKeyDecisions } from "@/lib/executive/decision-memory"
import { EXECUTIVE_LIST_LIMITS } from "@/lib/executive/list-limits"

type StoredBoardroomDecisions = {
  agents: BoardroomAgentReport[]
  keyDecisions: string[]
  topPriorities: string[]
  majorRisks: string[]
  majorOpportunities: string[]
  learningSummary: BoardroomLearningSummary
}

const EMPTY_LEARNING_SUMMARY: BoardroomLearningSummary = {
  lessonsUsed: [],
  strongPatternsApplied: [],
  weakPatternsFlagged: [],
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
    learningSummary:
      decisions.learningSummary &&
      typeof decisions.learningSummary === "object" &&
      !Array.isArray(decisions.learningSummary)
        ? {
            lessonsUsed: Array.isArray(decisions.learningSummary.lessonsUsed)
              ? decisions.learningSummary.lessonsUsed
              : [],
            strongPatternsApplied: Array.isArray(
              decisions.learningSummary.strongPatternsApplied
            )
              ? decisions.learningSummary.strongPatternsApplied
              : [],
            weakPatternsFlagged: Array.isArray(
              decisions.learningSummary.weakPatternsFlagged
            )
              ? decisions.learningSummary.weakPatternsFlagged
              : [],
          }
        : EMPTY_LEARNING_SUMMARY,
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
    learningSummary: session.learningSummary,
  }
}

export async function GET() {
  try {
    const sessions = await prisma.executiveBoardroomSession.findMany({
      orderBy: { createdAt: "desc" },
      take: EXECUTIVE_LIST_LIMITS.boardroomSessions,
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
