import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { updateArticleUnderGovernanceLock } from "../../../../lib/publishing/article-lifecycle";

const GOVERNED_LIFECYCLE_STATUSES = new Set([
  "approved",
  "scheduled",
  "published",
  "rejected",
  "archived",
]);
const DIRECTLY_EDITABLE_STATUSES = new Set([
  "draft",
  "review",
  "review-required",
]);
const GOVERNED_LIFECYCLE_FIELDS = [
  "approvedAt",
  "approvedBy",
  "scheduledFor",
  "publishedAt",
] as const;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        {
          ok: false,
          code: "AUTHENTICATION_REQUIRED",
          error: "Authentication required.",
          articleUnchanged: true,
        },
        { status: 401 },
      );
    }

    const { id } = await params;
    const body = await request.json();

    if (GOVERNED_LIFECYCLE_FIELDS.some((field) => field in body)) {
      return NextResponse.json(
        {
          ok: false,
          code: "GOVERNED_LIFECYCLE_FIELD_NOT_ALLOWED",
          error:
            "Use the dedicated governed lifecycle route to change lifecycle metadata.",
          articleUnchanged: true,
        },
        { status: 409 },
      );
    }

    if (GOVERNED_LIFECYCLE_STATUSES.has(body.status)) {
      return NextResponse.json(
        {
          ok: false,
          code: "GOVERNED_LIFECYCLE_ROUTE_REQUIRED",
          error:
            "Use the dedicated governed lifecycle route for this status transition.",
          articleUnchanged: true,
        },
        { status: 409 },
      );
    }

    if (
      body.status !== undefined &&
      !DIRECTLY_EDITABLE_STATUSES.has(body.status)
    ) {
      return NextResponse.json(
        {
          ok: false,
          code: "UNSUPPORTED_ARTICLE_STATUS",
          error: "Unsupported article status transition.",
          articleUnchanged: true,
        },
        { status: 422 },
      );
    }

    const changes: Record<string, unknown> = {};
    for (const field of ["title", "slug", "category", "status"] as const) {
      if (body[field] !== undefined) changes[field] = body[field];
    }
    for (const field of [
      "excerpt",
      "content",
      "featuredImage",
      "seoTitle",
      "seoDescription",
      "seoKeywords",
    ] as const) {
      if (body[field] !== undefined) changes[field] = body[field] || null;
    }

    const result = await updateArticleUnderGovernanceLock(
      { articleId: id, changes },
      { prisma },
    );
    if (!result.ok) {
      return NextResponse.json(result, {
        status:
          result.code === "not_found"
            ? 404
            : result.code === "published_immutable"
              ? 409
              : 422,
      });
    }

    return NextResponse.json({
      ok: true,
      article: result.article,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: "Failed to update article" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    await prisma.article.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: "Failed to delete article" },
      { status: 500 },
    );
  }
}
