import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireEditorAuth } from "../../../../lib/publishing/require-editor-auth"
import {
  approveFeaturedImagePrompt,
  loadFeaturedImagePromptState,
} from "../../../../lib/ai/approve-featured-image-prompt"

export const runtime = "nodejs"

const ERROR_STATUS: Record<string, number> = {
  not_found: 404,
  invalid_prompt: 422,
  invalid_status: 409,
  missing_audit: 409,
  featured_image_already_set: 409,
  replacement_required: 409,
  missing_approved_featured_image_prompt: 422,
  stale_approved_featured_image_prompt: 422,
  malformed_featured_image_prompt: 422,
  ambiguous_featured_image_prompt: 409,
  cross_article_featured_image_prompt: 409,
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireEditorAuth()
    if (!auth.ok) return auth.response

    const articleId = request.nextUrl.searchParams.get("articleId")
    if (!articleId) {
      return NextResponse.json(
        {
          ok: false,
          code: "invalid_request",
          error: "Missing articleId",
          articleUnchanged: true,
        },
        { status: 400 },
      )
    }

    const result = await loadFeaturedImagePromptState(articleId, { prisma })
    if (!result.ok) {
      return NextResponse.json(result, { status: 404 })
    }

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to load featured-image prompt",
        articleUnchanged: true,
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireEditorAuth()
    if (!auth.ok) return auth.response

    const body = await request.json()
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        {
          ok: false,
          code: "invalid_request",
          error: "Invalid request body.",
          articleUnchanged: true,
        },
        { status: 400 },
      )
    }

    const allowed = new Set(["articleId", "prompt", "replace"])
    const keys = Object.keys(body as Record<string, unknown>)
    if (keys.some((key) => !allowed.has(key))) {
      return NextResponse.json(
        {
          ok: false,
          code: "invalid_request",
          error: "Unknown request fields are not allowed.",
          articleUnchanged: true,
        },
        { status: 400 },
      )
    }

    const articleId = (body as { articleId?: unknown }).articleId
    if (!articleId || typeof articleId !== "string") {
      return NextResponse.json(
        {
          ok: false,
          code: "invalid_request",
          error: "Missing articleId",
          articleUnchanged: true,
        },
        { status: 400 },
      )
    }

    const result = await approveFeaturedImagePrompt(
      {
        articleId,
        prompt: (body as { prompt?: unknown }).prompt,
        replace: (body as { replace?: unknown }).replace,
        actor: auth.actor,
      },
      { prisma },
    )

    if (!result.ok) {
      return NextResponse.json(result, {
        status: ERROR_STATUS[result.code] ?? 400,
      })
    }

    return NextResponse.json({
      ok: true,
      alreadyApplied: result.alreadyApplied,
      articleUnchanged: result.articleUnchanged,
      prompt: result.prompt,
      contentFingerprint: result.contentFingerprint,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Featured-image prompt approval failed",
        articleUnchanged: true,
      },
      { status: 500 },
    )
  }
}
