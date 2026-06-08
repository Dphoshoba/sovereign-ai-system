import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getOpenAI } from "@/lib/ai/openai"

export async function POST(request: Request) {
  try {
    const { leadId } = await request.json()

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

    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.25,
      messages: [
        {
          role: "system",
          content:
            "You create practical service proposals for Echoes & Visions. Be clear, honest, and business-focused. Return valid JSON only.",
        },
        {
          role: "user",
          content: `
Create a proposal for this lead.

Lead:
Name: ${lead.name}
Email: ${lead.email}
Creator Type: ${lead.creatorType}
Niche: ${lead.niche}
Readiness: ${lead.readiness}
Lead Score: ${lead.leadScore}
Notes: ${lead.notes || "No notes provided"}
Bottlenecks: ${lead.bottlenecks || "No bottlenecks provided"}

Return exactly:

{
  "proposalTitle": "",
  "summary": "",
  "recommendedOffer": "",
  "scope": ["..."],
  "deliverables": ["..."],
  "timeline": "",
  "investmentAud": 0,
  "nextStep": "",
  "risks": ["..."],
  "successOutcomes": ["..."]
}
`,
        },
      ],
    })

    const raw = completion.choices[0]?.message?.content || "{}"
    const cleaned = raw.replace(/```json|```/g, "").trim()
    const proposal = JSON.parse(cleaned)

    await prisma.creatorLead.update({
      where: { id: lead.id },
      data: {
        status: "proposal-ready",
        projectedValue:
          typeof proposal.investmentAud === "number"
            ? proposal.investmentAud
            : lead.projectedValue,
      },
    })

    await prisma.creatorProposal.create({
      data: {
        leadId: lead.id,
        title: proposal.proposalTitle,
        description: proposal.summary,
        packageType: proposal.recommendedOffer,
        status: "draft",
        estimatedValue:
          typeof proposal.investmentAud === "number"
            ? proposal.investmentAud
            : 0,
        implementationWeeks: 4,
        proposalContent: JSON.stringify(proposal, null, 2),
        aiSummary: proposal.summary,
        pricingBreakdown: {
          investmentAud: proposal.investmentAud,
          timeline: proposal.timeline,
          nextStep: proposal.nextStep,
        },
      },
    })

    return NextResponse.json({
      ok: true,
      lead: {
        id: lead.id,
        name: lead.name,
        email: lead.email,
      },
      proposal,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Proposal generation failed",
      },
      { status: 500 }
    )
  }
}