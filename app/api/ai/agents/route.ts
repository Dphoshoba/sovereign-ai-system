import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const agents = await prisma.aiAgent.findMany({
      include: {
        department: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    const departments = await prisma.aiDepartment.findMany({
      orderBy: {
        name: "asc",
      },
    })

    return NextResponse.json({
      ok: true,
      agents,
      departments,
    })
  } catch (error) {
    console.error("Agent fetch failed:", error)

    return NextResponse.json(
      { ok: false, error: "Failed to fetch agents" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    let departmentId = body.departmentId || null

    if (!departmentId && body.departmentName) {
      const department = await prisma.aiDepartment.upsert({
        where: {
          name: body.departmentName,
        },
        update: {},
        create: {
          name: body.departmentName,
          description: body.departmentDescription || null,
        },
      })

      departmentId = department.id
    }

    const agent = await prisma.aiAgent.create({
      data: {
        name: body.name,
        departmentId,
        role: body.role,
        instructions: body.instructions,
        tools: body.tools || null,
        tags: body.tags || null,
        status: body.status || "active",
      },
      include: {
        department: true,
      },
    })

    return NextResponse.json({
      ok: true,
      agent,
    })
  } catch (error) {
    console.error("Agent save failed:", error)

    return NextResponse.json(
      { ok: false, error: "Failed to save agent" },
      { status: 500 }
    )
  }
}