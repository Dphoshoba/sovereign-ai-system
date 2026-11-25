import { NextRequest, NextResponse } from "next/server"
import { llmGateway } from "../../../../lib/agents/llm-gateway"
import { requireEditorAuth } from "../../../../lib/publishing/require-editor-auth"

export async function POST(req: NextRequest) {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

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