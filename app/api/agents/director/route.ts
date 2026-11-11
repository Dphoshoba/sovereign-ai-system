import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { directorAgent } from "../../../../lib/agents/director-agent"
import { startPersistentScheduler } from "../../../../lib/agents/persistent-scheduler-agent"
import { requireEditorAuth } from "../../../../lib/publishing/require-editor-auth"

export async function POST(req: NextRequest) {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  startPersistentScheduler()

  try {
    const body = await req.json()

    const memories = await prisma.videoPerformanceMemory.findMany({
      orderBy: {
        createdAt: "desc",
      },
    })

    const result = directorAgent({
      memories,
      audienceRegion: body.audienceRegion || "global",
      audienceType: body.audienceType || "faith-tech creators",
      contentType: body.contentType || "longform",
      predictionScores: body.predictionScores,
    })

    return NextResponse.json({
      ok: true,
      result,
    })
  } catch (error) {
    console.error("Director agent failed:", error)

    return NextResponse.json(
      { ok: false, error: "Director agent failed" },
      { status: 500 }
    )
  }
}