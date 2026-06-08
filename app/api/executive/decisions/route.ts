import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  buildDecisionMemory,
  clampEffectiveness,
  isDecisionStatus,
  serializeDecision,
} from "@/lib/executive/decision-memory"

export async function GET() {
  try {
    const decisions = await prisma.executiveDecision.findMany({
      orderBy: [{ createdAt: "desc" }],
    })

    const serialized = decisions.map(serializeDecision)
    const memory = buildDecisionMemory(serialized)

    return NextResponse.json({
      ok: true,
      decisions: serialized,
      memory,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch decisions",
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const title = typeof body?.title === "string" ? body.title.trim() : ""
    const description =
      typeof body?.description === "string" ? body.description.trim() : null
    const category =
      typeof body?.category === "string" ? body.category.trim() : null
    const boardroomId =
      typeof body?.boardroomId === "string" ? body.boardroomId.trim() : null

    if (!title) {
      return NextResponse.json(
        { ok: false, error: "title is required" },
        { status: 400 }
      )
    }

    const decision = await prisma.executiveDecision.create({
      data: {
        title,
        description: description || null,
        category: category || null,
        boardroomId: boardroomId || null,
        status: "proposed",
      },
    })

    return NextResponse.json({
      ok: true,
      decision: serializeDecision(decision),
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Failed to create decision",
      },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const id = typeof body?.id === "string" ? body.id.trim() : ""

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "id is required" },
        { status: 400 }
      )
    }

    const existing = await prisma.executiveDecision.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "Decision not found" },
        { status: 404 }
      )
    }

    const data: {
      status?: string
      outcome?: string | null
      effectiveness?: number | null
      actionTaken?: string | null
      lessonLearned?: string | null
      reviewDate?: Date | null
      impactArea?: string | null
      followUpRequired?: boolean
    } = {}

    if (body.status !== undefined) {
      const status = String(body.status).trim()

      if (!isDecisionStatus(status)) {
        return NextResponse.json(
          {
            ok: false,
            error: "status must be proposed, approved, rejected, or completed",
          },
          { status: 400 }
        )
      }

      data.status = status
    }

    if (body.outcome !== undefined) {
      data.outcome =
        body.outcome === null || body.outcome === ""
          ? null
          : String(body.outcome).trim()
    }

    if (body.effectiveness !== undefined) {
      if (body.effectiveness === null || body.effectiveness === "") {
        data.effectiveness = null
      } else {
        const effectiveness = Number(body.effectiveness)

        if (Number.isNaN(effectiveness)) {
          return NextResponse.json(
            { ok: false, error: "effectiveness must be a number between 0 and 100" },
            { status: 400 }
          )
        }

        data.effectiveness = clampEffectiveness(effectiveness)
      }
    }

    if (body.actionTaken !== undefined) {
      data.actionTaken =
        body.actionTaken === null || body.actionTaken === ""
          ? null
          : String(body.actionTaken).trim()
    }

    if (body.lessonLearned !== undefined) {
      data.lessonLearned =
        body.lessonLearned === null || body.lessonLearned === ""
          ? null
          : String(body.lessonLearned).trim()
    }

    if (body.reviewDate !== undefined) {
      if (body.reviewDate === null || body.reviewDate === "") {
        data.reviewDate = null
      } else {
        const reviewDate = new Date(String(body.reviewDate))

        if (Number.isNaN(reviewDate.getTime())) {
          return NextResponse.json(
            { ok: false, error: "reviewDate must be a valid date" },
            { status: 400 }
          )
        }

        data.reviewDate = reviewDate
      }
    }

    if (body.impactArea !== undefined) {
      data.impactArea =
        body.impactArea === null || body.impactArea === ""
          ? null
          : String(body.impactArea).trim()
    }

    if (body.followUpRequired !== undefined) {
      data.followUpRequired = Boolean(body.followUpRequired)
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Provide status, outcome, effectiveness, actionTaken, lessonLearned, reviewDate, impactArea, or followUpRequired to update",
        },
        { status: 400 }
      )
    }

    const decision = await prisma.executiveDecision.update({
      where: { id },
      data,
    })

    return NextResponse.json({
      ok: true,
      decision: serializeDecision(decision),
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Failed to update decision",
      },
      { status: 500 }
    )
  }
}
