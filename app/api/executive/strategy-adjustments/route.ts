import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  buildStrategyAdjustments,
  generateStrategicAdjustments,
  summarizeStrategicAdjustments,
  type StrategyAdjustmentProposal,
} from "@/lib/executive/strategy-adjustments"
import {
  EXECUTIVE_LIST_LIMITS,
  summarizeStatusCounts,
} from "@/lib/executive/list-limits"

const ADJUSTMENT_STATUSES = [
  "proposed",
  "approved",
  "rejected",
  "implemented",
] as const

type StoredAdjustmentPayload = StrategyAdjustmentProposal & {
  healthScore?: number
  quarter?: string | null
  year?: number | null
}

function serializeAdjustment(record: {
  id: string
  title: string
  description: string | null
  category: string | null
  priority: string
  recommendation: string | null
  status: string
  sourceReviewId: string | null
  adjustmentJson: unknown
  createdAt: Date
  updatedAt: Date
}) {
  const payload = (record.adjustmentJson ?? {}) as Partial<StoredAdjustmentPayload>

  return {
    id: record.id,
    title: record.title,
    description: record.description,
    category: record.category,
    priority: record.priority,
    recommendation: record.recommendation,
    status: record.status,
    sourceReviewId: record.sourceReviewId,
    sourceReasoning: payload.sourceReasoning ?? null,
    goals: payload.goals ?? [],
    initiatives: payload.initiatives ?? [],
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  }
}

export async function GET() {
  try {
    const [records, statusGroups, generated] = await Promise.all([
      prisma.strategyAdjustment.findMany({
        orderBy: { createdAt: "desc" },
        take: EXECUTIVE_LIST_LIMITS.strategyAdjustments,
      }),
      prisma.strategyAdjustment.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      generateStrategicAdjustments(),
    ])

    const stored = records.map(serializeAdjustment)
    const storedSummary = summarizeStatusCounts(statusGroups, ADJUSTMENT_STATUSES)

    return NextResponse.json({
      ok: true,
      // Phase 23 engine output — deterministic, rule-based proposals.
      adjustments: generated,
      summary: summarizeStrategicAdjustments(generated),
      // Persisted adjustment workflow (generate/approve/apply) — unchanged.
      stored: {
        adjustments: stored,
        summary: storedSummary,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to list strategy adjustments",
      },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    const result = await buildStrategyAdjustments()

    const existingProposed = await prisma.strategyAdjustment.findMany({
      where: { status: "proposed" },
      select: { title: true },
    })
    const existingTitles = new Set(
      existingProposed.map((item) => item.title.trim().toLowerCase())
    )

    const created = []

    for (const adjustment of result.adjustments) {
      const key = adjustment.title.trim().toLowerCase()
      if (existingTitles.has(key)) {
        continue
      }

      const record = await prisma.strategyAdjustment.create({
        data: {
          title: adjustment.title,
          description: adjustment.description,
          category: adjustment.category,
          priority: adjustment.priority,
          recommendation: adjustment.recommendation,
          status: "proposed",
          sourceReviewId: result.sourceReviewId,
          adjustmentJson: {
            ...adjustment,
            healthScore: result.healthScore,
            quarter: result.quarter,
            year: result.year,
          },
        },
      })

      existingTitles.add(key)
      created.push(serializeAdjustment(record))
    }

    return NextResponse.json({
      ok: true,
      healthScore: result.healthScore,
      createdCount: created.length,
      skippedCount: result.adjustments.length - created.length,
      adjustments: created,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate strategy adjustments",
      },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const id = typeof body?.id === "string" ? body.id.trim() : ""
    const status =
      typeof body?.status === "string" ? body.status.trim() : ""

    if (!id || !status) {
      return NextResponse.json(
        {
          ok: false,
          error: "id and status are required",
        },
        { status: 400 }
      )
    }

    if (
      !ADJUSTMENT_STATUSES.includes(status as (typeof ADJUSTMENT_STATUSES)[number])
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: `Invalid status. Expected one of: ${ADJUSTMENT_STATUSES.join(", ")}`,
        },
        { status: 400 }
      )
    }

    const record = await prisma.strategyAdjustment.update({
      where: { id },
      data: { status },
    })

    return NextResponse.json({
      ok: true,
      adjustment: serializeAdjustment(record),
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update strategy adjustment",
      },
      { status: 500 }
    )
  }
}
