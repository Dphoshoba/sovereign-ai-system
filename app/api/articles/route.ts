import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createSupabaseServerClient } from "@/lib/supabase/server"

const GOVERNED_INITIAL_STATUSES = new Set([
  "approved",
  "scheduled",
  "published",
  "rejected",
  "archived",
])
const ALLOWED_INITIAL_STATUSES = new Set([
  "draft",
  "review",
  "review-required",
])
const LIFECYCLE_METADATA_FIELDS = [
  "approvedAt",
  "approvedBy",
  "scheduledFor",
  "publishedAt",
] as const

export async function GET() {
  try {
    const articles = await prisma.article.findMany({
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({
      ok: true,
      count: articles.length,
      articles,
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      { ok: false, error: "Failed to fetch articles" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        {
          ok: false,
          code: "AUTHENTICATION_REQUIRED",
          error: "Authentication required.",
          articleUnchanged: true,
        },
        { status: 401 }
      )
    }

    const body = await request.json()

    const status = body.status || "draft"
    if (GOVERNED_INITIAL_STATUSES.has(status)) {
      return NextResponse.json(
        {
          ok: false,
          code: "GOVERNED_INITIAL_STATUS_NOT_ALLOWED",
          error: "Use the governed lifecycle routes after article creation.",
          articleUnchanged: true,
        },
        { status: 409 }
      )
    }
    if (!ALLOWED_INITIAL_STATUSES.has(status)) {
      return NextResponse.json(
        {
          ok: false,
          code: "UNSUPPORTED_ARTICLE_STATUS",
          error: "Unsupported initial article status.",
          articleUnchanged: true,
        },
        { status: 422 }
      )
    }
    if (
      LIFECYCLE_METADATA_FIELDS.some((field) =>
        Object.prototype.hasOwnProperty.call(body, field)
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          code: "LIFECYCLE_METADATA_NOT_ALLOWED",
          error: "Lifecycle timestamps and approval metadata are server-managed.",
          articleUnchanged: true,
        },
        { status: 422 }
      )
    }

    const article = await prisma.article.create({
      data: {
        title: body.title,
        slug: body.slug,
        category: body.category,
        status,

        excerpt: body.excerpt || null,
        content: body.content || null,
        featuredImage: body.featuredImage || null,

        seoTitle: body.seoTitle || null,
        seoDescription: body.seoDescription || null,
        seoKeywords: body.seoKeywords || null,

        approvedAt: null,
        approvedBy: null,
        scheduledFor: null,
        publishedAt: null,
      },
    })

    return NextResponse.json({
      ok: true,
      article,
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      { ok: false, error: "Failed to create article" },
      { status: 500 }
    )
  }
}