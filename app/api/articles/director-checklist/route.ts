import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireEditorAuth } from "../../../../lib/publishing/require-editor-auth"
import { buildDirectorChecklist } from "../../../../lib/publishing/director-checklist"

export async function GET(request: Request) {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  const url = new URL(request.url)
  const articleId = url.searchParams.get("articleId")?.trim()

  if (!articleId) {
    return NextResponse.json(
      {
        ok: false,
        code: "ARTICLE_ID_REQUIRED",
        error: "articleId query parameter is required.",
      },
      { status: 400 },
    )
  }

  const article = await prisma.article.findUnique({
    where: { id: articleId },
    include: {
      researchAudits: { orderBy: { createdAt: "desc" } },
      researchSources: true,
      reviewNotes: true,
      socialPosts: {
        select: {
          id: true,
          platform: true,
          status: true,
          publishedAt: true,
        },
      },
    },
  })

  if (!article) {
    return NextResponse.json(
      {
        ok: false,
        code: "ARTICLE_NOT_FOUND",
        error: "Article not found.",
      },
      { status: 404 },
    )
  }

  const checklist = buildDirectorChecklist(article)

  return NextResponse.json({
    ok: true,
    actor: auth.actor,
    checklist,
  })
}
