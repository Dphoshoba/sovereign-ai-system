import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { transitionArticleLifecycle } from "../../../../lib/publishing/article-lifecycle";

export async function POST(req: Request) {
  try {
    const { queueId, status } = await req.json();

    if (!queueId || !status) {
      return NextResponse.json(
        { ok: false, error: "Missing queueId or status" },
        { status: 400 },
      );
    }

    const queueItem = await prisma.publishingQueue.findUnique({
      where: { id: queueId },
    });

    if (!queueItem) {
      return NextResponse.json(
        { ok: false, error: "Queue item not found" },
        { status: 404 },
      );
    }

    if (status === "published") {
      const result = await transitionArticleLifecycle(
        {
          articleId: queueItem.articleId,
          transition: "publish",
          queueId,
        },
        { prisma },
      );
      if (!result.ok) {
        return NextResponse.json(result, {
          status: result.code === "not_found" ? 404 : 409,
        });
      }

      return NextResponse.json({
        ok: true,
        item: {
          ...queueItem,
          status: "published",
          publishedAt: result.article.publishedAt,
        },
      });
    }

    const updated = await prisma.publishingQueue.update({
      where: { id: queueId },
      data: {
        status,
        publishedAt: null,
      },
    });

    return NextResponse.json({
      ok: true,
      item: updated,
    });
  } catch (error) {
    console.error("Queue update failed:", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Failed to update queue",
      },
      { status: 500 },
    );
  }
}
