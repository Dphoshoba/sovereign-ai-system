import { NextResponse } from "next/server";
import { buildExecutiveForecastingV2 } from "@/lib/executive/executive-forecasting-v2";
import { requireEditorAuth } from "../../../../lib/publishing/require-editor-auth"

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  try {
    const forecast = await buildExecutiveForecastingV2();

    return NextResponse.json({
      ok: true,
      forecast,
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