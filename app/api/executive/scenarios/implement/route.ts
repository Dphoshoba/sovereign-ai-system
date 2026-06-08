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
import type { SimulationStrategy } from "@/lib/executive/simulation-strategy"
import type { StrategicSimulationResult } from "@/lib/executive/strategic-simulation"

type StoredScenarioPayload = {
  simulation: StrategicSimulationResult
  strategy: SimulationStrategy
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const scenarioId =
      typeof body?.scenarioId === "string" ? body.scenarioId.trim() : ""

    if (!scenarioId) {
      return NextResponse.json(
        {
          ok: false,
          error: "scenarioId is required",
        },
        { status: 400 }
      )
    }

    const record = await prisma.strategicScenario.findUnique({
      where: { id: scenarioId },
    })

    if (!record) {
      return NextResponse.json(
        {
          ok: false,
          error: "Strategic scenario not found",
        },
        { status: 404 }
      )
    }

    if (record.status === "rejected") {
      return NextResponse.json(
        {
          ok: false,
          error: "Rejected scenarios cannot be implemented",
        },
        { status: 400 }
      )
    }

    if (record.status === "implemented") {
      return NextResponse.json(
        {
          ok: false,
          error: "Scenario has already been implemented",
        },
        { status: 400 }
      )
    }

    const payload = record.simulationJson as StoredScenarioPayload | null
    const strategy = payload?.strategy

    if (!strategy) {
      return NextResponse.json(
        {
          ok: false,
          error: "Scenario strategy payload is missing",
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

    for (const goal of strategy.goals) {
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

    for (let index = 0; index < strategy.initiatives.length; index += 1) {
      const initiative = strategy.initiatives[index]
      const normalizedTitle = normalizeInitiativeTitle(initiative.title)

      if (existingInitiativeTitles.has(normalizedTitle)) {
        continue
      }

      const goalCategory =
        strategy.goals[Math.min(index, strategy.goals.length - 1)]?.category ??
        null
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
          source: "simulation-scenario",
          ownerSystem: "executive",
          targetOutcome: record.summary,
          executionPath: initiative.actions,
          progress: 0,
          goalId: linkedGoalId,
        },
      })

      existingInitiativeTitles.add(normalizedTitle)
      initiativesCreated += 1
    }

    await prisma.strategicScenario.update({
      where: { id: scenarioId },
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
            : "Failed to implement strategic scenario",
      },
      { status: 500 }
    )
  }
}
