import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { correctAndWithdrawPublishedArticle } from "../../../../lib/publishing/article-lifecycle";
import { parseCorrectAndWithdrawRequest } from "../../../../lib/publishing/correct-and-withdraw";
import { requireEditorAuth } from "../../../../lib/publishing/require-editor-auth";

const ERROR_STATUS: Record<string, number> = {
  invalid_request: 422,
  article_not_found: 404,
  invalid_article_status: 409,
  no_effective_change: 422,
  correction_conflict: 409,
  correction_failed: 500,
};

export async function POST(req: NextRequest) {
  try {
    const auth = await requireEditorAuth();
    if (!auth.ok) return auth.response;

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        {
          ok: false,
          code: "invalid_request",
          error: "Request body must be valid JSON.",
          articleUnchanged: true,
        },
        { status: 400 },
      );
    }

    const parsed = parseCorrectAndWithdrawRequest(body);
    if (!parsed.ok) {
      const status =
        parsed.error === "articleId is required." ||
        parsed.error === "Request body must be a JSON object."
          ? 400
          : 422;
      return NextResponse.json(parsed, { status });
    }

    const result = await correctAndWithdrawPublishedArticle(
      {
        articleId: parsed.value.articleId,
        reason: parsed.value.reason,
        changes: parsed.value.changes,
        actor: auth.actor,
      },
      { prisma },
    );

    if (!result.ok) {
      return NextResponse.json(result, {
        status: ERROR_STATUS[result.code] ?? 400,
      });
    }

    return NextResponse.json({
      ok: true,
      article: result.article,
      changedFields: result.changedFields,
      previousFingerprint: result.previousFingerprint,
      newFingerprint: result.newFingerprint,
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        code: "correction_failed",
        error: "Article correction failed.",
        articleUnchanged: true,
      },
      { status: 500 },
    );
  }
}
