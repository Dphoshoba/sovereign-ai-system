import { NextResponse } from "next/server"
import OpenAI from "openai"
import { prisma } from "@/lib/prisma"
import { DAVID_WRITING_DNA } from "@/lib/ai/writing-dna"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function GET() {
  try {
    const [proposals, invoices, revenueEvents] = await Promise.all([
      prisma.creatorProposal.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.creatorInvoice.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.creatorRevenueEvent.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
    ])

    return NextResponse.json({
      ok: true,
      proposals,
      invoices,
      revenueEvents,
    })
  } catch (error) {
    console.error("Revenue fetch failed:", error)

    return NextResponse.json(
      { ok: false, error: "Failed to fetch revenue data" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const audit = await prisma.creatorAuditRequest.findUnique({
      where: { id: body.auditId },
    })

    if (!audit) {
      return NextResponse.json(
        { ok: false, error: "Audit not found" },
        { status: 404 }
      )
    }

    const response = await openai.responses.create({
      model: "gpt-5.2",
      instructions:
        "You are the AI Revenue Operations Strategist for Echoes & Visions. " +
        DAVID_WRITING_DNA +
        " Generate creator automation implementation proposals, pricing and package structures. Return only valid JSON.",
      input:
        "Generate a creator automation proposal from this audit:\n\n" +
        JSON.stringify(audit) +
        "\n\nReturn JSON only in this exact format:\n" +
        `{
          "title": "...",
          "description": "...",
          "packageType": "...",
          "estimatedValue": 3500,
          "implementationWeeks": 4,
          "proposalContent": "...",
          "pricingBreakdown": {
            "audit": 500,
            "automation": 2000,
            "implementation": 1000
          },
          "aiSummary": "..."
        }`,
    })

    const parsed = JSON.parse(response.output_text)

    const proposal = await prisma.creatorProposal.create({
      data: {
        auditId: audit.id,
        title: parsed.title || "Creator Automation Proposal",
        description: parsed.description || null,
        packageType: parsed.packageType || null,
        estimatedValue:
          typeof parsed.estimatedValue === "number"
            ? parsed.estimatedValue
            : null,
        implementationWeeks:
          typeof parsed.implementationWeeks === "number"
            ? parsed.implementationWeeks
            : null,
        proposalContent: parsed.proposalContent || null,
        pricingBreakdown: parsed.pricingBreakdown || {},
        aiSummary: parsed.aiSummary || null,
        status: "draft",
      },
    })

    await prisma.creatorRevenueEvent.create({
      data: {
        type: "proposal-generated",
        title: proposal.title,
        amount: proposal.estimatedValue || null,
        proposalId: proposal.id,
        status: "generated",
        metadata: {
          auditId: audit.id,
        },
      },
    })

    return NextResponse.json({
      ok: true,
      proposal,
    })
  } catch (error) {
    console.error("Proposal generation failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate proposal",
      },
      { status: 500 }
    )
  }
}