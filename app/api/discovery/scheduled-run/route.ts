import { NextResponse } from "next/server"

export async function POST() {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/discovery/run-autonomous`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          saveLimit: 10,
          generateLimit: 3,
        }),
      }
    )

    const result = await response.json()

    return NextResponse.json({
      ok: true,
      scheduled: true,
      result,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Scheduled discovery failed",
      },
      { status: 500 }
    )
  }
}