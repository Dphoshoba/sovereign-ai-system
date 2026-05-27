import { NextRequest, NextResponse } from "next/server"
import { llmGateway } from "../../../../lib/agents/llm-gateway"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const result = await llmGateway({
      provider: body.provider || "openai",
      prompt: body.prompt || "Generate AI content.",
      systemPrompt: body.systemPrompt || "",
    })

    return NextResponse.json({
      ok: true,
      result,
    })
  } catch (error) {
    console.error(
      "LLM gateway failed:",
      error
    )

    return NextResponse.json(
      {
        ok: false,
        error: "LLM gateway failed",
      },
      {
        status: 500,
      }
    )
  }
}