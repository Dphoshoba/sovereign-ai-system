import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireEditorAuth } from "../../../../lib/publishing/require-editor-auth"
import {
  runEditorialStages,
  type EditorialStageRunnerStore,
} from "../../../../lib/publishing/editorial-stage-runner"

export const runtime = "nodejs"
export const maxDuration = 60

const ERROR_STATUS: Record<string, number> = {
  not_found: 404,
  invalid_status: 409,
  missing_content: 400,
  prepare_failed: 422,
  immutable_lifecycle: 409,
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireEditorAuth()
    if (!auth.ok) return auth.response

    const body = await req.json().catch(() => ({}))
    const articleId =
      typeof body.articleId === "string" ? body.articleId.trim() : undefined
    const title = typeof body.title === "string" ? body.title : undefined
    const category =
      typeof body.category === "string" ? body.category : undefined
    const excerpt = typeof body.excerpt === "string" ? body.excerpt : undefined
    const content = typeof body.content === "string" ? body.content : undefined

    if (!articleId && !title) {
      return NextResponse.json(
        {
          ok: false,
          error: "Provide articleId or title.",
          articleUnchanged: true,
        },
        { status: 400 },
      )
    }

    const result = await runEditorialStages(
      {
        actor: auth.actor,
        articleId,
        title,
        category,
        excerpt,
        content,
      },
      { prisma: prisma as unknown as EditorialStageRunnerStore },
    )

    if (!result.ok) {
      return NextResponse.json(result, {
        status: ERROR_STATUS[result.code] ?? 400,
      })
    }

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Editorial stage runner failed",
        articleUnchanged: true,
        sideEffects: {
          approved: false,
          scheduled: false,
          published: false,
          socialDistributed: false,
          featuredImageGenerated: false,
        },
      },
      { status: 500 },
    )
  }
}
