import { NextResponse } from "next/server";
import { buildExecutiveSimulationV2 } from "@/lib/executive/executive-simulation-v2";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const simulation =
      await buildExecutiveSimulationV2();

    return NextResponse.json({
      ok: true,
      simulation,
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