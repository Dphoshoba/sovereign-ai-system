import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))

    const result = {
      ok: true,
      message: "Workflow automation trigger executed successfully.",
      email: {
        subject: "Your Creator Automation Audit",
        body:
          "Hello,\n\nYour Creator Automation Audit is ready.\n\nRegards,\nEchoes & Visions",
      },
      input: body,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Workflow automation trigger failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Workflow automation trigger failed.",
      },
      { status: 500 }
    )
  }
}