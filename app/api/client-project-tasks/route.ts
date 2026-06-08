import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId")

    const tasks = await prisma.clientProjectTask.findMany({
      where: projectId ? { projectId } : undefined,
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json({
      ok: true,
      tasks,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch client project tasks",
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const projectId = body.projectId?.trim()
    const title = body.title?.trim()
    const description = body.description?.trim() || null
    const priority = body.priority?.trim() || "normal"
    const dueDate = body.dueDate ? new Date(body.dueDate) : null

    if (!projectId || !title) {
      return NextResponse.json(
        { ok: false, error: "projectId and title are required" },
        { status: 400 }
      )
    }

    const project = await prisma.clientProject.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      return NextResponse.json(
        { ok: false, error: "Project not found" },
        { status: 404 }
      )
    }

    const task = await prisma.clientProjectTask.create({
      data: {
        projectId,
        title,
        description,
        priority,
        dueDate,
        status: "todo",
      },
    })

    return NextResponse.json({
      ok: true,
      task,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create client project task",
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

    const existing = await prisma.clientProjectTask.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "Task not found" },
        { status: 404 }
      )
    }

    const task = await prisma.clientProjectTask.update({
      where: { id },
      data: {
        status: body.status ?? existing.status,
        title: body.title?.trim() ?? existing.title,
        description:
          body.description !== undefined
            ? body.description?.trim() || null
            : existing.description,
        priority: body.priority?.trim() ?? existing.priority,
        dueDate:
          body.dueDate !== undefined
            ? body.dueDate
              ? new Date(body.dueDate)
              : null
            : existing.dueDate,
      },
    })

    return NextResponse.json({
      ok: true,
      task,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update client project task",
      },
      { status: 500 }
    )
  }
}
