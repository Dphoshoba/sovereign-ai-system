import { NextResponse } from "next/server"

export async function POST() {
  try {
    const schedulerResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/ai/scheduler/run`,
      { method: "POST" }
    )

    const schedulerResult = await schedulerResponse.json()

    const jobResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/ai/jobs/run`,
      { method: "POST" }
    )

    const jobResult = await jobResponse.json()

    return NextResponse.json({
      ok: true,
      schedulerResult,
      jobResult,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Scheduler run-and-execute failed",
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return POST()
}