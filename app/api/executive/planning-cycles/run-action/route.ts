import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { buildGoalSyncUpdates } from "@/lib/executive/initiative-performance"

export const PLANNING_CYCLE_ACTION_TYPES = [
  "sync-goals",
  "review-overdue-tasks",
  "review-invoices",
  "review-leads",
  "review-content",
  "review-initiatives",
  "review-goals",
  "review-planning",
] as const

export type PlanningCycleActionType =
  (typeof PLANNING_CYCLE_ACTION_TYPES)[number]

const REDIRECT_ACTIONS: Record<
  Exclude<PlanningCycleActionType, "sync-goals">,
  { redirectTo: string; message: string }
> = {
  "review-overdue-tasks": {
    redirectTo: "/admin/delivery",
    message: "Opening delivery dashboard to review overdue tasks.",
  },
  "review-invoices": {
    redirectTo: "/admin/invoices",
    message: "Opening invoices to review outstanding payments.",
  },
  "review-leads": {
    redirectTo: "/admin/creator-leads",
    message: "Opening creator leads for follow-up review.",
  },
  "review-content": {
    redirectTo: "/admin/articles",
    message: "Opening articles to review editorial backlog.",
  },
  "review-initiatives": {
    redirectTo: "/admin/execution",
    message: "Opening execution engine to review initiatives.",
  },
  "review-goals": {
    redirectTo: "/admin/goals",
    message: "Opening quarterly goals for review.",
  },
  "review-planning": {
    redirectTo: "/admin/planning-cycles",
    message: "Opening planning cycles for review.",
  },
}

export function isPlanningCycleActionType(
  value: string
): value is PlanningCycleActionType {
  return PLANNING_CYCLE_ACTION_TYPES.includes(
    value as PlanningCycleActionType
  )
}

async function runSyncGoals() {
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

  return {
    updatedGoals,
    updatedInitiatives: initiatives.length,
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const actionType =
      typeof body?.actionType === "string" ? body.actionType.trim() : ""

    if (!actionType || !isPlanningCycleActionType(actionType)) {
      return NextResponse.json(
        {
          ok: false,
          error: `actionType must be one of: ${PLANNING_CYCLE_ACTION_TYPES.join(", ")}`,
        },
        { status: 400 }
      )
    }

    if (actionType === "sync-goals") {
      const result = await runSyncGoals()

      return NextResponse.json({
        ok: true,
        actionType,
        message: `Synced ${result.updatedGoals} goal${result.updatedGoals === 1 ? "" : "s"} from ${result.updatedInitiatives} linked initiative${result.updatedInitiatives === 1 ? "" : "s"}.`,
        result,
      })
    }

    const redirectAction = REDIRECT_ACTIONS[actionType]

    return NextResponse.json({
      ok: true,
      actionType,
      message: redirectAction.message,
      redirectTo: redirectAction.redirectTo,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Planning cycle action failed",
      },
      { status: 500 }
    )
  }
}
