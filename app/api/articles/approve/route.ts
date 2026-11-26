import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { transitionArticleLifecycle } from "../../../../lib/publishing/article-lifecycle";
import { requireEditorAuth } from "../../../../lib/publishing/require-editor-auth";
import { runPostApprovalPublishPrep } from "../../../../lib/publishing/post-approval-publish-prep";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireEditorAuth();
    if (!auth.ok) return auth.response;

    const body = await req.json();
    const articleId = body.articleId;
    const reviewNote = body.reviewNote;
    const assignCalendarSlot = body.assignCalendarSlot !== false;

    if (!articleId) {
      return NextResponse.json(
        { ok: false, error: "Missing articleId" },
        { status: 400 },
      );
    }

    const result = await transitionArticleLifecycle(
      {
        articleId,
        transition: "approve",
        actor: auth.actor,
        reviewNote,
      },
      { prisma },
    );

    if (!result.ok) {
      return NextResponse.json(result, {
        status: result.code === "not_found" ? 404 : 409,
      });
    }

    // EV-EDITORIAL-07-P2/P4: after human approval, prepare image and optional slot.
    // Failures are reported; they never roll back approval or auto-publish.
    let postApproval: Awaited<ReturnType<typeof runPostApprovalPublishPrep>> | null =
      null;
    try {
      postApproval = await runPostApprovalPublishPrep(
        {
          articleId,
          actor: auth.actor,
          assignCalendarSlot,
        },
        { prisma: prisma as never },
      );
    } catch (error) {
      postApproval = {
        image: {
          ok: false,
          outcome: "failed",
          code: "generate_failed",
          error:
            error instanceof Error
              ? error.message
              : "Post-approval preparation failed",
          articleId,
          articleUnchanged: true,
          sideEffects: {
            approved: false,
            scheduled: false,
            published: false,
            socialDistributed: false,
            featuredImageGenerated: false,
          },
        },
        schedule: {
          ok: false,
          outcome: "failed",
          error:
            error instanceof Error
              ? error.message
              : "Post-approval scheduling failed",
          articleUnchanged: true,
        },
      };
    }

    const refreshed = await prisma.article.findUnique({
      where: { id: articleId },
    });

    return NextResponse.json({
      ok: true,
      article: refreshed ?? result.article,
      postApproval,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Approval failed",
      },
      { status: 500 },
    );
  }
}
