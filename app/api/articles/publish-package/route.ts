import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { transitionArticleLifecycle } from "../../../../lib/publishing/article-lifecycle";
import { requireEditorAuth } from "../../../../lib/publishing/require-editor-auth";
import { autoGenerateSocialPosts } from "../../../../lib/social/auto-generate-social";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireEditorAuth();
    if (!auth.ok) return auth.response;

    const { articleId } = await req.json();

    if (!articleId) {
      return NextResponse.json(
        { ok: false, error: "Missing articleId" },
        { status: 400 },
      );
    }

    const existingPostIds = (
      await prisma.socialPost.findMany({
        where: { articleId },
        select: { id: true },
      })
    ).map((p) => p.id);

    const result = await transitionArticleLifecycle(
      {
        articleId,
        transition: "publish",
        actor: auth.actor,
      },
      { prisma },
    );
    if (!result.ok) {
      return NextResponse.json(result, {
        status: result.code === "not_found" ? 404 : 409,
      });
    }

    let socialResult = null;
    try {
      socialResult = await autoGenerateSocialPosts(articleId);
    } catch {
      socialResult = {
        ok: false,
        reason: "Social draft generation failed",
        posts: [],
      };
    }

    await prisma.newsletter.updateMany({
      where: {
        articleId,
        status: "review-required",
      },
      data: {
        status: "approved",
        approvedAt: new Date(),
        approvedBy: auth.actor || result.article.approvedBy || "system",
      },
    });

    if (existingPostIds.length > 0) {
      await prisma.socialPost.updateMany({
        where: {
          id: { in: existingPostIds },
          status: "review-required",
        },
        data: {
          status: "approved",
        },
      });
    }

    return NextResponse.json({
      ok: true,
      article: result.article,
      message:
        "Article published, newsletter approved, and social posts processed.",
      socialDrafts: socialResult
        ? {
            generated: socialResult.ok,
            reason: socialResult.reason,
            count: socialResult.posts.length,
          }
        : undefined,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Package publish failed",
      },
      { status: 500 },
    );
  }
}
