import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  buildExecutionImpact,
  clampProgress,
  isExecutionPriority,
  isExecutionStatus,
} from "@/lib/executive/execution-impact"

function serializeInitiative(initiative: {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  ownerSystem: string | null
  source: string | null
  progress: number
  executionPath: unknown
  createdAt: Date
  updatedAt: Date
}) {
  return {
    id: initiative.id,
    title: initiative.title,
    description: initiative.description,
    status: initiative.status,
    priority: initiative.priority,
    owner: initiative.ownerSystem,
    source: initiative.source,
    progress: initiative.progress,
    actions: Array.isArray(initiative.executionPath)
      ? initiative.executionPath
      : [],
    createdAt: initiative.createdAt.toISOString(),
    updatedAt: initiative.updatedAt.toISOString(),
  }
}

export async function GET() {
  try {
    const [initiatives, projects, tasks] = await Promise.all([
      prisma.strategicInitiative.findMany({
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.clientProject.findMany({
        where: {
          status: {
            not: "archived",
          },
        },
        select: {
          id: true,
          title: true,
          status: true,
        },
      }),
      prisma.clientProjectTask.findMany({
        select: {
          id: true,
          title: true,
          status: true,
          projectId: true,
        },
      }),
    ])

    const executionImpact = buildExecutionImpact(initiatives, projects, tasks)

    return NextResponse.json({
      ok: true,
      initiatives: initiatives.map(serializeInitiative),
      executionImpact,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch execution initiatives",
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
    const priority = body.priority?.trim() || "medium"
    const owner = body.owner?.trim() || null
    const source = body.source?.trim() || "manual"
    const actions = Array.isArray(body.actions)
      ? body.actions.filter((item: unknown) => typeof item === "string")
      : []

    if (!title) {
      return NextResponse.json(
        { ok: false, error: "title is required" },
        { status: 400 }
      )
    }

    if (!isExecutionPriority(priority)) {
      return NextResponse.json(
        { ok: false, error: "priority must be low, medium, high, or urgent" },
        { status: 400 }
      )
    }

    const initiative = await prisma.strategicInitiative.create({
      data: {
        title,
        description,
        priority,
        ownerSystem: owner,
        source,
        status: "planned",
        progress: 0,
        executionPath: actions,
      },
    })

    return NextResponse.json({
      ok: true,
      initiative: serializeInitiative(initiative),
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create execution initiative",
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

    const existing = await prisma.strategicInitiative.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "Initiative not found" },
        { status: 404 }
      )
    }

    const data: {
      status?: string
      priority?: string
      progress?: number
    } = {}

    if (body.status !== undefined) {
      const status = String(body.status).trim()

      if (!isExecutionStatus(status)) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "status must be planned, active, blocked, completed, or proposed",
          },
          { status: 400 }
        )
      }

      data.status = status
    }

    if (body.priority !== undefined) {
      const priority = String(body.priority).trim()

      if (!isExecutionPriority(priority)) {
        return NextResponse.json(
          {
            ok: false,
            error: "priority must be low, medium, high, or urgent",
          },
          { status: 400 }
        )
      }

      data.priority = priority
    }

    if (body.progress !== undefined) {
      const progress = Number(body.progress)

      if (Number.isNaN(progress)) {
        return NextResponse.json(
          { ok: false, error: "progress must be a number between 0 and 100" },
          { status: 400 }
        )
      }

      data.progress = clampProgress(progress)
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { ok: false, error: "Provide status, priority, or progress to update" },
        { status: 400 }
      )
    }

    const initiative = await prisma.strategicInitiative.update({
      where: { id },
      data,
    })

    return NextResponse.json({
      ok: true,
      initiative: serializeInitiative(initiative),
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update execution initiative",
      },
      { status: 500 }
    )
  }
}
