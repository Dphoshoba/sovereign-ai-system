import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000"

    // Step 1
    const planner = await fetch(
      `${baseUrl}/api/workers/weekly-planner`
    )

    const plannerJson = await planner.json()

    if (!plannerJson.ok) {
      throw new Error("Weekly planner failed")
    }

    const draft = plannerJson.draft

    // Step 2
    const articleResponse = await fetch(
      `${baseUrl}/api/articles/generate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          articleId: draft.id,
        }),
      }
    )

    const articleJson =
      await articleResponse.json()

    if (!articleJson.ok) {
      throw new Error("Article generation failed")
    }

    // Step 3
    const packageResponse = await fetch(
      `${baseUrl}/api/articles/generate-package`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          articleId: draft.id,
        }),
      }
    )

    const packageJson =
      await packageResponse.json()

    if (!packageJson.ok) {
      throw new Error("Package generation failed")
    }

    const scheduleResponse =
      await fetch(
        `${baseUrl}/api/pipeline/auto-schedule`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            articleId: draft.id,
          }),
        }
      )

    const scheduleJson =
      await scheduleResponse.json()

    if (!scheduleJson.ok) {
      throw new Error(
        "Auto scheduling failed"
      )
    }

    return NextResponse.json({
      ok: true,
      articleId: draft.id,
      title: draft.title,
      category: draft.category,
      scheduledFor:
        scheduleJson.scheduledFor,
      message:
        "Pipeline completed and scheduled successfully",
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Pipeline failed",
      },
      { status: 500 }
    )
  }
}