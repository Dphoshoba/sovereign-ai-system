import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { buildGoalSyncUpdates } from "@/lib/executive/initiative-performance"

export async function POST() {
  try {
    const [goals, initiatives] = await Promise.all([
      prisma.quarterlyGoal.findMany(),
      prisma.strategicInitiative.findMany({
        where: {
          goalId: {
            not: null,
          },
        },
        select: {
          id: true,
          goalId: true,
          status: true,
          progress: true,
        },
      }),
    ])

    const updates = buildGoalSyncUpdates(goals, initiatives)
    let updatedGoals = 0

    for (const update of updates) {
      const statusUpdate =
        update.progress >= 100
          ? "completed"
          : update.progress >= 60
            ? "active"
            : update.progress > 0
              ? "at-risk"
              : null

      await prisma.quarterlyGoal.update({
        where: { id: update.goalId },
        data: {
          progress: update.progress,
          currentValue: update.currentValue,
          ...(statusUpdate ? { status: statusUpdate } : {}),
        },
      })

      updatedGoals += 1
    }

    return NextResponse.json({
      ok: true,
      updatedGoals,
      updatedInitiatives: initiatives.length,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to sync goals from initiatives",
      },
      { status: 500 }
    )
  }
}
