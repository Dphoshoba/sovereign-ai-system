import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseSchedulingTimestamp } from "../../../../lib/publishing/adelaide-time";
import { transitionArticleLifecycle } from "../../../../lib/publishing/article-lifecycle";
import { requireEditorAuth } from "../../../../lib/publishing/require-editor-auth";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireEditorAuth();
    if (!auth.ok) return auth.response;

    const { articleId, scheduledFor } = await req.json();

    if (!articleId || !scheduledFor) {
      return NextResponse.json(
        { ok: false, error: "Missing articleId or scheduledFor" },
        { status: 400 },
      );
    }

    const parsed = parseSchedulingTimestamp(scheduledFor);
    if (!parsed.ok) {
      return NextResponse.json(
        { ok: false, error: parsed.error },
        { status: 400 },
      );
    }

    const scheduleDate = parsed.date;

    const result = await transitionArticleLifecycle(
      {
        articleId,
        transition: "schedule",
        scheduledFor: scheduleDate,
      },
      { prisma },
    );
    if (!result.ok) {
      return NextResponse.json(result, {
        status: result.code === "not_found" ? 404 : 409,
      });
    }

    await prisma.newsletter.updateMany({
      where: { articleId },
      data: {
        status: "approved",
        scheduledFor: scheduleDate,
      },
    });

    await prisma.socialPost.updateMany({
      where: { articleId },
      data: {
        status: "approved",
        scheduledFor: scheduleDate,
      },
    });

    return NextResponse.json({
      ok: true,
      article: result.article,
      message: "Package scheduled successfully.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Schedule failed",
      },
      { status: 500 },
    );
  }
}
