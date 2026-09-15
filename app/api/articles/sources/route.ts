import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireEditorAuth } from "../../../../lib/publishing/require-editor-auth";
import { mutateArticleSources } from "../../../../lib/research/article-source-mutation";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireEditorAuth();
    if (!auth.ok) return auth.response;

    const body = await req.json();
    const articleId = body.articleId;
    if (!articleId || typeof articleId !== "string") {
      return NextResponse.json(
        { ok: false, error: "Missing articleId", articleUnchanged: true },
        { status: 400 },
      );
    }

    const operation = body.operation;
    let input;
    if (operation === "replace") {
      input = {
        articleId,
        operation: "replace" as const,
        sources: Array.isArray(body.sources) ? body.sources : [],
      };
    } else if (operation === "create") {
      input = {
        articleId,
        operation: "create" as const,
        source: body.source ?? {},
      };
    } else if (operation === "update") {
      input = {
        articleId,
        operation: "update" as const,
        sourceId: body.sourceId,
        changes: body.changes ?? {},
      };
    } else if (operation === "delete") {
      input = {
        articleId,
        operation: "delete" as const,
        sourceId: body.sourceId,
      };
    } else {
      return NextResponse.json(
        {
          ok: false,
          error: "Unsupported source mutation operation.",
          articleUnchanged: true,
        },
        { status: 422 },
      );
    }

    const result = await mutateArticleSources(input, { prisma });
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
      sources: result.sources,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Source mutation failed",
      },
      { status: 500 },
    );
  }
}
