import { NextResponse } from "next/server";
import { buildExecutiveHealth } from "@/lib/executive/executive-health";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const health = await buildExecutiveHealth();

    return NextResponse.json({
      ok: true,
      health,
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