import { NextResponse } from "next/server";
import { buildExecutiveDecisionEngineV2 } from "@/lib/executive/executive-decision-engine-v2";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const decisions =
      await buildExecutiveDecisionEngineV2();

    return NextResponse.json({
      ok: true,
      decisions,
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