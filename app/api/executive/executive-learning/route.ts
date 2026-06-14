import { NextResponse } from "next/server";
import { buildExecutiveLearning } from "@/lib/executive/executive-learning";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const learning = await buildExecutiveLearning();

    return NextResponse.json({
      ok: true,
      learning,
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