import { NextRequest, NextResponse } from "next/server"
import path from "path"
import { renderEngineAgent } from "../../../../lib/agents/render-engine-agent"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (!body.audioFile) {
      return NextResponse.json(
        {
          ok: false,
          error: "audioFile required",
        },
        {
          status: 400,
        }
      )
    }

    const audioPath = path.join(
      process.cwd(),
      "public",
      body.audioFile
    )

    const result = await renderEngineAgent({
      audioPath,
    })

    return NextResponse.json({
      ok: true,
      result,
    })
  } catch (error) {
    console.error("Render engine failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error: "Render engine failed",
      },
      {
        status: 500,
      }
    )
  }
}