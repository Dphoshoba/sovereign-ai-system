import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { generateAndPersistFeaturedImage } from "../../../../lib/ai/persist-featured-image"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Authentication required." },
        { status: 401 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { ok: false, error: "Missing OPENAI_API_KEY" },
        { status: 500 }
      )
    }

    const body = await request.json()
    const articleId = body.articleId

    if (!articleId || typeof articleId !== "string") {
      return NextResponse.json(
        { ok: false, error: "Missing articleId" },
        { status: 400 }
      )
    }

    const result = await generateAndPersistFeaturedImage({ articleId })

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: result.error,
          articleUnchanged: true,
        },
        { status: result.code === "not_found" ? 404 : 500 }
      )
    }

    if (result.warning) {
      return NextResponse.json({
        ok: true,
        warning: result.warning,
        article: result.article,
        articleUnchanged: true,
      })
    }

    return NextResponse.json({
      ok: true,
      article: result.article,
      imageUrl: result.imageUrl,
      editorialQuality: result.editorialQuality,
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
      { status: 500 }
    )
  }
}
