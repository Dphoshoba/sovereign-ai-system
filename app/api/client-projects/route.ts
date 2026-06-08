import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const PROJECT_STATUSES = ["active", "completed", "archived"] as const

async function attachClient(project: {
  clientId: string
  [key: string]: unknown
}) {
  const client = await prisma.clientProfile.findUnique({
    where: { id: project.clientId },
  })

  return {
    ...project,
    client,
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const includeArchived = searchParams.get("includeArchived") === "true"

    const projects = await prisma.clientProject.findMany({
      where: includeArchived
        ? undefined
        : {
            status: {
              not: "archived",
            },
          },
      orderBy: {
        createdAt: "desc",
      },
    })

    const clientIds = [...new Set(projects.map((project) => project.clientId))]

    const clients =
      clientIds.length > 0
        ? await prisma.clientProfile.findMany({
            where: {
              id: { in: clientIds },
            },
          })
        : []

    const clientMap = Object.fromEntries(
      clients.map((client) => [client.id, client])
    )

    const projectsWithClients = projects.map((project) => ({
      ...project,
      client: clientMap[project.clientId] || null,
    }))

    return NextResponse.json({
      ok: true,
      projects: projectsWithClients,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch client projects",
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const clientId = body.clientId?.trim()
    const title = body.title?.trim()
    const description = body.description?.trim() || null
    const valueAud =
      body.valueAud === "" || body.valueAud === null || body.valueAud === undefined
        ? null
        : Number(body.valueAud)
    const dueDate = body.dueDate ? new Date(body.dueDate) : null

    if (!clientId || !title) {
      return NextResponse.json(
        { ok: false, error: "clientId and title are required" },
        { status: 400 }
      )
    }

    const client = await prisma.clientProfile.findUnique({
      where: { id: clientId },
    })

    if (!client) {
      return NextResponse.json(
        { ok: false, error: "Client not found" },
        { status: 404 }
      )
    }

    const existingProject = await prisma.clientProject.findFirst({
      where: {
        clientId,
        title,
        status: {
          not: "archived",
        },
      },
    })

    if (existingProject) {
      return NextResponse.json({
        ok: true,
        alreadyExists: true,
        project: {
          ...existingProject,
          client,
        },
      })
    }

    const project = await prisma.clientProject.create({
      data: {
        clientId,
        title,
        description,
        valueAud,
        dueDate,
        status: "active",
      },
    })

    return NextResponse.json({
      ok: true,
      project: {
        ...project,
        client,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create client project",
      },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const id = body.id?.trim()
    const status = body.status?.trim()

    if (!id || !status) {
      return NextResponse.json(
        { ok: false, error: "id and status are required" },
        { status: 400 }
      )
    }

    if (!PROJECT_STATUSES.includes(status as (typeof PROJECT_STATUSES)[number])) {
      return NextResponse.json(
        {
          ok: false,
          error: "status must be active, completed, or archived",
        },
        { status: 400 }
      )
    }

    const existing = await prisma.clientProject.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "Project not found" },
        { status: 404 }
      )
    }

    const project = await prisma.clientProject.update({
      where: { id },
      data: { status },
    })

    return NextResponse.json({
      ok: true,
      project: await attachClient(project),
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update client project",
      },
      { status: 500 }
    )
  }
}
