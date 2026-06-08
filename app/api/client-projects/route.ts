import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const projects = await prisma.clientProject.findMany({
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
