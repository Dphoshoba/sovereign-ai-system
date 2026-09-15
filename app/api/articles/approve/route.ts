import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { transitionArticleLifecycle } from "../../../../lib/publishing/article-lifecycle";
import { requireEditorAuth } from "../../../../lib/publishing/require-editor-auth";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireEditorAuth();
    if (!auth.ok) return auth.response;

    const { articleId, reviewNote } = await req.json();

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

    return NextResponse.json({
      ok: true,
      article: result.article,
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
