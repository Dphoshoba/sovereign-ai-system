import { NextResponse } from "next/server";
import { buildExecutiveAlerts } from "@/lib/executive/executive-alerts";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const alerts = await buildExecutiveAlerts();

    return NextResponse.json({
      ok: true,
      alerts,
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