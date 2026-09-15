import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { transitionArticleLifecycle } from "../../../../lib/publishing/article-lifecycle";

export async function POST(req: NextRequest) {
  try {
    const { articleId } = await req.json();

    if (!articleId) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing articleId",
        },
        { status: 400 },
      );
    }

    const latestScheduled = await prisma.article.findFirst({
      where: {
        scheduledFor: {
          not: null,
        },
      },
      orderBy: {
        scheduledFor: "desc",
      },
    });

    const scheduleDate = latestScheduled?.scheduledFor
      ? new Date(latestScheduled.scheduledFor)
      : new Date();

    scheduleDate.setDate(scheduleDate.getDate() + 7);

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
      where: {
        articleId,
      },
      data: {
        status: "approved",
        scheduledFor: scheduleDate,
      },
    });

    await prisma.socialPost.updateMany({
      where: {
        articleId,
      },
      data: {
        status: "approved",
        scheduledFor: scheduleDate,
      },
    });

    return NextResponse.json({
      ok: true,
      scheduledFor: scheduleDate,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Auto schedule failed",
      },
      { status: 500 },
    );
  }
}
