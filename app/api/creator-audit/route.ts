import { NextResponse } from "next/server"
import OpenAI from "openai"
import { prisma } from "@/lib/prisma"
import { DAVID_WRITING_DNA } from "@/lib/ai/writing-dna"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function GET() {
  try {
    const audits = await prisma.creatorAuditRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    })

    return NextResponse.json({ ok: true, audits })
  } catch (error) {
    console.error("Creator audits fetch failed:", error)

    return NextResponse.json(
      { ok: false, error: "Failed to fetch creator audits" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const name = body.name?.trim()
    const email = body.email?.trim().toLowerCase()

    if (!name || !email) {
      return NextResponse.json(
        { ok: false, error: "Name and email are required" },
        { status: 400 }
      )
    }

    const response = await openai.responses.create({
      model: "gpt-5.2",
      instructions:
        "You are the Creator Automation Audit Strategist for Echoes & Visions. " +
        DAVID_WRITING_DNA +
        " Diagnose creator bottlenecks and recommend practical AI automation systems. Return only valid JSON.",
      input:
        "Analyze this creator audit request:\n\n" +
        JSON.stringify(body) +
        "\n\nReturn JSON only in this exact format:\n" +
        `{
          "opportunityScore": 75,
          "auditSummary": "...",
          "recommendedSystems": "...",
          "nextActions": "...",
          "proposalDraft": "..."
        }`,
    })

    const parsed = JSON.parse(response.output_text)

    const audit = await prisma.creatorAuditRequest.create({
      data: {
        name,
        email,
        creatorType: body.creatorType || null,
        niche: body.niche || null,
        audienceSize: body.audienceSize || null,
        publishingFrequency: body.publishingFrequency || null,
        monetizationMethod: body.monetizationMethod || null,
        currentTools: body.currentTools || null,
        biggestBottleneck: body.biggestBottleneck || null,
        automationGoals: body.automationGoals || null,
        status: "audit-requested",
        opportunityScore:
          typeof parsed.opportunityScore === "number"
            ? parsed.opportunityScore
            : 50,
        auditSummary: parsed.auditSummary || null,
        recommendedSystems: parsed.recommendedSystems || null,
        nextActions: parsed.nextActions || null,
        proposalDraft: parsed.proposalDraft || null,
      },
    })

    return NextResponse.json({ ok: true, audit })
  } catch (error) {
    console.error("Creator audit failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create creator audit",
      },
      { status: 500 }
    )
  }
}