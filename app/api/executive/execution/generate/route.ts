import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  inferPriorityFromInitiative,
  normalizeInitiativeTitle,
} from "@/lib/executive/execution-impact"
import { loadExecutiveStrategicPlan } from "@/lib/executive/load-strategic-plan"

export async function POST() {
  try {
    const plan = await loadExecutiveStrategicPlan()

    const existing = await prisma.strategicInitiative.findMany({
      select: {
        title: true,
      },
    })

    const existingTitles = new Set(
      existing.map((item) => normalizeInitiativeTitle(item.title))
    )

    let createdCount = 0
    let skippedCount = 0
    const created: string[] = []

    for (const initiative of plan.initiatives) {
      const normalizedTitle = normalizeInitiativeTitle(initiative.title)

      if (existingTitles.has(normalizedTitle)) {
        skippedCount += 1
        continue
      }

      await prisma.strategicInitiative.create({
        data: {
          title: initiative.title,
          description: initiative.reason,
          priority: inferPriorityFromInitiative(initiative.title),
          status: "planned",
          source: "strategic-plan",
          ownerSystem: "executive",
          targetOutcome: initiative.reason,
          executionPath: initiative.actions,
          progress: 0,
        },
      })

      existingTitles.add(normalizedTitle)
      createdCount += 1
      created.push(initiative.title)
    }

    return NextResponse.json({
      ok: true,
      createdCount,
      skippedCount,
      created,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate execution initiatives",
      },
      { status: 500 }
    )
  }
}
