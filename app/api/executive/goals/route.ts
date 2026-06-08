import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  buildPerformanceScorecard,
  clampGoalProgress,
  isGoalStatus,
} from "@/lib/executive/quarterly-goals"

function serializeGoal(goal: {
  id: string
  title: string
  description: string | null
  quarter: string
  year: number
  category: string | null
  status: string
  targetValue: number | null
  currentValue: number | null
  progress: number
  owner: string | null
  createdAt: Date
  updatedAt: Date
}) {
  return {
    id: goal.id,
    title: goal.title,
    description: goal.description,
    quarter: goal.quarter,
    year: goal.year,
    category: goal.category,
    status: goal.status,
    targetValue: goal.targetValue,
    currentValue: goal.currentValue,
    progress: goal.progress,
    owner: goal.owner,
    createdAt: goal.createdAt.toISOString(),
    updatedAt: goal.updatedAt.toISOString(),
  }
}

export async function GET() {
  try {
    const goals = await prisma.quarterlyGoal.findMany({
      orderBy: [{ year: "desc" }, { quarter: "desc" }, { createdAt: "desc" }],
    })

    const serialized = goals.map(serializeGoal)
    const scorecard = buildPerformanceScorecard(serialized)

    return NextResponse.json({
      ok: true,
      goals: serialized,
      scorecard,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch goals",
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const title = body.title?.trim()
    const description = body.description?.trim() || null
    const quarter = body.quarter?.trim()
    const year = Number(body.year)
    const category = body.category?.trim() || null
    const owner = body.owner?.trim() || null
    const targetValue =
      body.targetValue === undefined || body.targetValue === null
        ? null
        : Number(body.targetValue)
    const currentValue =
      body.currentValue === undefined || body.currentValue === null
        ? 0
        : Number(body.currentValue)

    if (!title || !quarter || Number.isNaN(year)) {
      return NextResponse.json(
        { ok: false, error: "title, quarter, and year are required" },
        { status: 400 }
      )
    }

    if (targetValue !== null && Number.isNaN(targetValue)) {
      return NextResponse.json(
        { ok: false, error: "targetValue must be a number" },
        { status: 400 }
      )
    }

    if (Number.isNaN(currentValue)) {
      return NextResponse.json(
        { ok: false, error: "currentValue must be a number" },
        { status: 400 }
      )
    }

    const goal = await prisma.quarterlyGoal.create({
      data: {
        title,
        description,
        quarter,
        year,
        category,
        owner,
        targetValue,
        currentValue,
        progress: 0,
        status: "planned",
      },
    })

    return NextResponse.json({
      ok: true,
      goal: serializeGoal(goal),
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Failed to create goal",
      },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const id = body.id?.trim()

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "id is required" },
        { status: 400 }
      )
    }

    const existing = await prisma.quarterlyGoal.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "Goal not found" },
        { status: 404 }
      )
    }

    const data: {
      status?: string
      progress?: number
      currentValue?: number
    } = {}

    if (body.status !== undefined) {
      const status = String(body.status).trim()

      if (!isGoalStatus(status)) {
        return NextResponse.json(
          {
            ok: false,
            error: "status must be planned, active, at-risk, or completed",
          },
          { status: 400 }
        )
      }

      data.status = status
    }

    if (body.progress !== undefined) {
      const progress = Number(body.progress)

      if (Number.isNaN(progress)) {
        return NextResponse.json(
          { ok: false, error: "progress must be a number between 0 and 100" },
          { status: 400 }
        )
      }

      data.progress = clampGoalProgress(progress)
    }

    if (body.currentValue !== undefined) {
      const currentValue = Number(body.currentValue)

      if (Number.isNaN(currentValue)) {
        return NextResponse.json(
          { ok: false, error: "currentValue must be a number" },
          { status: 400 }
        )
      }

      data.currentValue = currentValue
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "Provide status, progress, or currentValue to update",
        },
        { status: 400 }
      )
    }

    const goal = await prisma.quarterlyGoal.update({
      where: { id },
      data,
    })

    return NextResponse.json({
      ok: true,
      goal: serializeGoal(goal),
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Failed to update goal",
      },
      { status: 500 }
    )
  }
}
