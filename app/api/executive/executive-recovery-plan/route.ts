import { NextResponse } from "next/server";
import { buildExecutiveRecoveryPlan } from "@/lib/executive/executive-recovery-plan";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const recoveryPlan = await buildExecutiveRecoveryPlan();

    return NextResponse.json({
      ok: true,
      recoveryPlan,
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