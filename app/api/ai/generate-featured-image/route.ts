import { NextRequest, NextResponse } from "next/server"
import { requireEditorAuth } from "../../../../lib/publishing/require-editor-auth"
import { generateAndPersistFeaturedImage } from "../../../../lib/ai/persist-featured-image"

export const runtime = "nodejs"
export const maxDuration = 60

const ERROR_STATUS: Record<string, number> = {
  not_found: 404,
  invalid_status: 409,
  missing_audit: 409,
  missing_approved_featured_image_prompt: 422,
  stale_approved_featured_image_prompt: 422,
  malformed_featured_image_prompt: 422,
  ambiguous_featured_image_prompt: 422,
  cross_article_featured_image_prompt: 422,
  featured_image_generation_failed: 500,
  featured_image_upload_failed: 500,
  featured_image_invalid_payload: 422,
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireEditorAuth()
    if (!auth.ok) return auth.response

    const body = await request.json()
    const articleId = body?.articleId

    if (!articleId || typeof articleId !== "string") {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing articleId",
          articleUnchanged: true,
        },
        { status: 400 },
      )
    }

    const result = await generateAndPersistFeaturedImage({ articleId })

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: result.error,
          code: result.code,
          articleUnchanged: true,
        },
        { status: ERROR_STATUS[result.code ?? ""] ?? 500 },
      )
    }

    return NextResponse.json({
      ok: true,
      article: result.article,
      imageUrl: result.imageUrl,
      editorialQuality: result.editorialQuality,
      articleUnchanged: false,
    })
  } catch (error) {
    console.error("Featured image generation failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate featured image",
        articleUnchanged: true,
      },
      { status: 500 },
    )
  }
}
