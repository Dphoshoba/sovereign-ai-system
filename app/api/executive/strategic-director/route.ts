import { NextResponse } from "next/server";
import { buildStrategicDirector } from "@/lib/executive/strategic-director";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const director = await buildStrategicDirector();

    return NextResponse.json({
      ok: true,
      director,
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