import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getOpenAI } from "@/lib/ai/openai"

export async function POST(request: Request) {
  try {
    const { leadId } = await request.json()

    const lead = await prisma.creatorLead.findUnique({
      where: {
        id: leadId,
      },
    })

    if (!lead) {
      return NextResponse.json(
        {
          ok: false,
          error: "Lead not found",
        },
        { status: 404 }
      )
    }

    const completion =
      await getOpenAI().chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content:
              "You write professional nurture emails for Echoes & Visions. Be warm, practical, and focused on helping the lead.",
          },
          {
            role: "user",
            content: `
Lead:

Name: ${lead.name}
Creator Type: ${lead.creatorType}
Readiness: ${lead.readiness}
Lead Score: ${lead.leadScore}
Niche: ${lead.niche}

Generate JSON only:

{
  "subject": "",
  "body": ""
}
`,
          },
        ],
      })

    const raw =
      completion.choices[0]?.message?.content || "{}"

    const cleaned = raw
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim()

    const email = JSON.parse(cleaned)

    return NextResponse.json({
      ok: true,
      lead: {
        id: lead.id,
        name: lead.name,
      },
      email,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Email generation failed",
      },
      { status: 500 }
    )
  }
}