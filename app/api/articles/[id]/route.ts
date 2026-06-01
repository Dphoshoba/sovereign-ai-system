import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { publicationGuard } from "../../../../lib/publishing/publication-guard"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existingArticle = await prisma.article.findUnique({
      where: { id },
    })

    if (!existingArticle) {
      return NextResponse.json(
        { ok: false, error: "Article not found" },
        { status: 404 }
      )
    }

    if (body.status === "published") {
      const guard = publicationGuard(existingArticle.status)

      if (!guard.allowed) {
        return NextResponse.json(
          {
            ok: false,
            error: guard.reason,
            guard,
          },
          { status: 403 }
        )
      }
    }

    const article = await prisma.article.update({
      where: { id },
      data: {
        title: body.title,
        slug: body.slug,
        category: body.category,
        status: body.status,
        excerpt: body.excerpt || null,
        content: body.content || null,
        featuredImage: body.featuredImage || null,
        seoTitle: body.seoTitle || null,
        seoDescription: body.seoDescription || null,
        seoKeywords: body.seoKeywords || null,
        publishedAt:
          body.status === "published"
            ? new Date()
            : existingArticle.publishedAt,
        scheduledFor: body.scheduledFor
          ? new Date(body.scheduledFor)
          : null,
      },
    })

    return NextResponse.json({ ok: true, article })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { ok: false, error: "Failed to update article" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await prisma.article.delete({
      where: { id },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { ok: false, error: "Failed to delete article" },
      { status: 500 }
    )
  }
}