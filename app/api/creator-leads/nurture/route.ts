import { NextResponse } from "next/server"
import OpenAI from "openai"
import { prisma } from "@/lib/prisma"
import { DAVID_WRITING_DNA } from "@/lib/ai/writing-dna"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function GET() {
  try {
    const events = await prisma.creatorNurtureEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    })

    const insights = await prisma.creatorLeadInsight.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    })

    return NextResponse.json({
      ok: true,
      events,
      insights,
    })
  } catch (error) {
    console.error("Nurture fetch failed:", error)

    return NextResponse.json(
      { ok: false, error: "Failed to fetch nurturing data" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const leadId = body.leadId as string

    if (!leadId) {
      return NextResponse.json(
        { ok: false, error: "leadId is required" },
        { status: 400 }
      )
    }

    const lead = await prisma.creatorLead.findUnique({
      where: { id: leadId },
    })

    if (!lead) {
      return NextResponse.json(
        { ok: false, error: "Lead not found" },
        { status: 404 }
      )
    }

    const response = await openai.responses.create({
      model: "gpt-5.2",
      instructions:
        "You are the Creator Nurturing Strategist for Echoes & Visions. " +
        DAVID_WRITING_DNA +
        " Create a practical email nurture sequence and lead intelligence assessment. Return only valid JSON.",
      input:
        "Create a 5-email nurturing sequence for this creator lead and assess their readiness.\n\n" +
        JSON.stringify({
          name: lead.name,
          email: lead.email,
          creatorType: lead.creatorType,
          status: lead.status,
          readiness: lead.readiness,
          niche: lead.niche,
          bottlenecks: lead.bottlenecks,
          notes: lead.notes,
          leadScore: lead.leadScore,
        }) +
        "\n\nReturn JSON only in this exact format:\n" +
        `{
          "leadScore": 75,
          "readiness": "curious|warm|ready|urgent",
          "insights": [
            {
              "title": "...",
              "insight": "...",
              "priority": "low|medium|high",
              "recommendedAction": "..."
            }
          ],
          "emails": [
            {
              "type": "starter-pack-delivery",
              "subject": "...",
              "body": "..."
            }
          ]
        }`,
    })

    const parsed = JSON.parse(response.output_text)

    const updatedLead = await prisma.creatorLead.update({
      where: { id: lead.id },
      data: {
        leadScore:
          typeof parsed.leadScore === "number"
            ? parsed.leadScore
            : lead.leadScore,
        readiness: parsed.readiness || lead.readiness,
      },
    })

    const createdEvents = []

    for (const email of parsed.emails || []) {
      const event = await prisma.creatorNurtureEvent.create({
        data: {
          leadId: lead.id,
          type: email.type || "nurture-email",
          subject: email.subject,
          body: email.body,
          status: "draft",
          metadata: email,
        },
      })

      createdEvents.push(event)
    }

    const createdInsights = []

    for (const item of parsed.insights || []) {
      const insight = await prisma.creatorLeadInsight.create({
        data: {
          leadId: lead.id,
          title: item.title,
          insight: item.insight,
          priority: item.priority || "medium",
          recommendedAction: item.recommendedAction || null,
          metadata: item,
        },
      })

      createdInsights.push(insight)
    }

    return NextResponse.json({
      ok: true,
      lead: updatedLead,
      events: createdEvents,
      insights: createdInsights,
    })
  } catch (error) {
    console.error("Nurture generation failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate nurture sequence",
      },
      { status: 500 }
    )
  }
}