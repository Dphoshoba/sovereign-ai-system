import { NextResponse } from "next/server";
import { buildExecutiveMemory } from "@/lib/executive/executive-memory";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const memory = await buildExecutiveMemory();

    return NextResponse.json({
      ok: true,
      memory,
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