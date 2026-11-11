import { NextResponse } from "next/server";
import { buildExecutiveRecoveryPlan } from "@/lib/executive/executive-recovery-plan";
import { requireEditorAuth } from "../../../../lib/publishing/require-editor-auth"

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

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