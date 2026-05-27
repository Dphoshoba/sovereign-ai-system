import { NextRequest, NextResponse } from "next/server"
import { personaAgent, type AudiencePersona } from "../../../../lib/agents/persona-agent"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const persona = (body.persona || "creators") as AudiencePersona
    const strategy = personaAgent(persona)

    return NextResponse.json({
      ok: true,
      strategy,
    })
  } catch (error) {
    console.error("Persona agent failed:", error)

    return NextResponse.json(
      { ok: false, error: "Persona agent failed" },
      { status: 500 }
    )
  }
}