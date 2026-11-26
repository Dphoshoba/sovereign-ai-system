import { NextResponse } from "next/server"

import { requireEditorAuth } from "../../../../../lib/publishing/require-editor-auth"
import { prioritizeResearchTopics } from "../../../../../lib/research/research-prioritization"
import { discoverResearchTopics } from "../../../../../lib/research/topic-discovery"

export async function GET() {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  const discovery = discoverResearchTopics(undefined, {
    recentCategories: ["ai-tools"],
    duplicateTopics: ["AI automation for creator workflows"],
  })
  const prioritization = prioritizeResearchTopics(discovery.candidates)

  return NextResponse.json({
    ok: true,
    dryRun: true,
    liveTrendCollection: false,
    writesToPrisma: false,
    graphWrites: false,
    automaticApprovals: false,
    automaticPublishing: false,
    discovery,
    prioritization,
  })
}

export async function POST(request: Request) {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  try {
    const body = await request.json()

    if (body.liveTrendCollection === true) {
      return NextResponse.json(
        {
          ok: false,
          dryRun: true,
          liveTrendCollection: false,
          error: "Live trend collection is a placeholder only in this phase.",
        },
        { status: 400 }
      )
    }

    const discovery = discoverResearchTopics(body.candidates, {
      recentCategories: body.recentCategories,
      duplicateTopics: body.duplicateTopics,
    })

    return NextResponse.json({
      ok: true,
      dryRun: true,
      liveTrendCollection: false,
      writesToPrisma: false,
      graphWrites: false,
      automaticApprovals: false,
      automaticPublishing: false,
      discovery,
      prioritization: prioritizeResearchTopics(discovery.candidates),
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        dryRun: true,
        liveTrendCollection: false,
        error:
          error instanceof Error
            ? error.message
            : "Topic discovery dry-run failed.",
      },
      { status: 500 }
    )
  }
}
