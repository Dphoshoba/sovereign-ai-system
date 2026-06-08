import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  inferPriorityFromInitiative,
  normalizeInitiativeTitle,
} from "@/lib/executive/execution-impact"
import {
  getCurrentQuarter,
  normalizeGoalTitle,
} from "@/lib/executive/quarterly-goals"
import type { StrategyAdjustmentProposal } from "@/lib/executive/strategy-adjustments"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const adjustmentId =
      typeof body?.adjustmentId === "string" ? body.adjustmentId.trim() : ""

    if (!adjustmentId) {
      return NextResponse.json(
        {
          ok: false,
          error: "adjustmentId is required",
        },
        { status: 400 }
      )
    }

    const record = await prisma.strategyAdjustment.findUnique({
      where: { id: adjustmentId },
    })

    if (!record) {
      return NextResponse.json(
        {
          ok: false,
          error: "Strategy adjustment not found",
        },
        { status: 404 }
      )
    }

    if (record.status !== "approved") {
      return NextResponse.json(
        {
          ok: false,
          error: "Only approved adjustments can be applied",
        },
        { status: 400 }
      )
    }

    const payload = record.adjustmentJson as StrategyAdjustmentProposal | null

    if (!payload) {
      return NextResponse.json(
        {
          ok: false,
          error: "Adjustment payload is missing",
        },
        { status: 400 }
      )
    }

    const { quarter, year } = getCurrentQuarter()

    const [existingInitiatives, existingGoals] = await Promise.all([
      prisma.strategicInitiative.findMany({
        select: { title: true },
      }),
      prisma.quarterlyGoal.findMany({
        where: { quarter, year },
        select: { id: true, title: true, category: true },
      }),
    ])

    const existingInitiativeTitles = new Set(
      existingInitiatives.map((item) => normalizeInitiativeTitle(item.title))
    )

    const existingGoalKeys = new Set(
      existingGoals.map(
        (goal) =>
          `${year}:${quarter}:${normalizeGoalTitle(goal.title)}`
      )
    )

    const goalIdsByCategory = new Map<string, string>()

    for (const goal of existingGoals) {
      if (goal.category) {
        goalIdsByCategory.set(goal.category, goal.id)
      }
    }

    let initiativesCreated = 0
    let goalsCreated = 0

    for (const goal of payload.goals ?? []) {
      const key = `${year}:${quarter}:${normalizeGoalTitle(goal.title)}`

      if (existingGoalKeys.has(key)) {
        continue
      }

      const createdGoal = await prisma.quarterlyGoal.create({
        data: {
          title: goal.title,
          description: goal.description,
          quarter,
          year,
          category: goal.category,
          status: "planned",
          targetValue: goal.targetValue,
          currentValue: 0,
          progress: 0,
          owner: "executive",
        },
      })

      existingGoalKeys.add(key)
      goalsCreated += 1

      if (goal.category) {
        goalIdsByCategory.set(goal.category, createdGoal.id)
      }
    }

    for (let index = 0; index < (payload.initiatives ?? []).length; index += 1) {
      const initiative = payload.initiatives[index]
      const normalizedTitle = normalizeInitiativeTitle(initiative.title)

      if (existingInitiativeTitles.has(normalizedTitle)) {
        continue
      }

      const goalCategory =
        (payload.goals?.length ?? 0) > 0
          ? payload.goals![Math.min(index, payload.goals!.length - 1)]
              ?.category ?? record.category
          : record.category
      const linkedGoalId = goalCategory
        ? goalIdsByCategory.get(goalCategory) ?? null
        : null

      await prisma.strategicInitiative.create({
        data: {
          title: initiative.title,
          description: initiative.description,
          priority:
            initiative.priority || inferPriorityFromInitiative(initiative.title),
          status: "planned",
          source: "strategy-adjustment",
          ownerSystem: "executive",
          targetOutcome: record.recommendation,
          executionPath: initiative.actions,
          progress: 0,
          goalId: linkedGoalId,
        },
      })

      existingInitiativeTitles.add(normalizedTitle)
      initiativesCreated += 1
    }

    await prisma.strategyAdjustment.update({
      where: { id: adjustmentId },
      data: { status: "implemented" },
    })

    return NextResponse.json({
      ok: true,
      initiativesCreated,
      goalsCreated,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to apply strategy adjustment",
      },
      { status: 500 }
    )
  }
}
