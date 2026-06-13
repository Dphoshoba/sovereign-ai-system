import { NextResponse } from "next/server";
import { buildExecutiveAutopilot } from "@/lib/executive/executive-autopilot";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const autopilot = await buildExecutiveAutopilot();

    return NextResponse.json({
      ok: true,
      autopilot,
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