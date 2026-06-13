import { NextResponse } from "next/server";
import { buildExecutiveScorecard } from "@/lib/executive/executive-scorecard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const scorecard = await buildExecutiveScorecard();

    return NextResponse.json({
      ok: true,
      scorecard,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      { status: 500 }
    );
  }
}