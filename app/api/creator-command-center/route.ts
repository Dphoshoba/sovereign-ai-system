import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getOpenAI } from "@/lib/ai/openai"
import { DAVID_WRITING_DNA } from "@/lib/ai/writing-dna"

export async function GET() {
  try {
    const [leads, audits, nurtureEvents, automationActions, proposals, invoices] =
      await Promise.all([
        prisma.creatorLead.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
        prisma.creatorAuditRequest.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
        prisma.creatorNurtureEvent.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
        prisma.creatorAutomationAction.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
        prisma.creatorProposal.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
        prisma.creatorInvoice.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
      ])

    const hotLeads = leads.filter(
      (lead) => lead.leadScore >= 75 || ["ready", "urgent"].includes(lead.readiness)
    )

    const projectedRevenue = proposals.reduce(
      (sum, proposal) => sum + (proposal.estimatedValue || 0),
      0
    )

    const invoicedRevenue = invoices.reduce(
      (sum, invoice) => sum + invoice.amount,
      0
    )

    const paidRevenue = invoices
      .filter((invoice) => invoice.status === "paid")
      .reduce((sum, invoice) => sum + invoice.amount, 0)

    const pendingAutomations = automationActions.filter(
      (action) => action.status === "pending"
    )

    const openAudits = audits.filter((audit) => audit.status !== "closed")

    return NextResponse.json({
      ok: true,
      metrics: {
        totalLeads: leads.length,
        hotLeads: hotLeads.length,
        totalAudits: audits.length,
        openAudits: openAudits.length,
        nurtureDrafts: nurtureEvents.filter((event) => event.status === "draft").length,
        pendingAutomations: pendingAutomations.length,
        proposals: proposals.length,
        invoices: invoices.length,
        projectedRevenue,
        invoicedRevenue,
        paidRevenue,
      },
      leads,
      audits,
      nurtureEvents,
      automationActions,
      proposals,
      invoices,
    })
  } catch (error) {
    console.error("Creator command center fetch failed:", error)

    return NextResponse.json(
      { ok: false, error: "Failed to fetch command center data" },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    const [leads, audits, nurtureEvents, automationActions, proposals, invoices] =
      await Promise.all([
        prisma.creatorLead.findMany({ orderBy: { createdAt: "desc" }, take: 80 }),
        prisma.creatorAuditRequest.findMany({ orderBy: { createdAt: "desc" }, take: 80 }),
        prisma.creatorNurtureEvent.findMany({ orderBy: { createdAt: "desc" }, take: 80 }),
        prisma.creatorAutomationAction.findMany({ orderBy: { createdAt: "desc" }, take: 80 }),
        prisma.creatorProposal.findMany({ orderBy: { createdAt: "desc" }, take: 80 }),
        prisma.creatorInvoice.findMany({ orderBy: { createdAt: "desc" }, take: 80 }),
      ])

    const response = await getOpenAI().responses.create({
      model: "gpt-5.2",
      instructions:
        "You are the Executive AI Command Center for Echoes & Visions. " +
        DAVID_WRITING_DNA +
        " Analyze creator operations and return sharp executive recommendations. Return valid JSON only.",
      input:
        "Analyze this creator business operating system and produce executive intelligence.\n\n" +
        "Return JSON only in this exact format:\n" +
        `{
          "executiveSummary":"...",
          "urgentPriorities":["..."],
          "growthOpportunities":["..."],
          "operationalWarnings":["..."],
          "revenueRecommendations":["..."],
          "nextBestActions":["..."]
        }` +
        "\n\nLeads:\n" +
        JSON.stringify(leads) +
        "\n\nAudits:\n" +
        JSON.stringify(audits) +
        "\n\nNurture Events:\n" +
        JSON.stringify(nurtureEvents) +
        "\n\nAutomation Actions:\n" +
        JSON.stringify(automationActions) +
        "\n\nProposals:\n" +
        JSON.stringify(proposals) +
        "\n\nInvoices:\n" +
        JSON.stringify(invoices),
    })

    const intelligence = JSON.parse(response.output_text)

    await prisma.aiActivityEvent.create({
      data: {
        type: "creator-command-center",
        title: "Executive creator intelligence generated",
        message: intelligence.executiveSummary || "Creator intelligence generated.",
        status: "success",
        metadata: intelligence,
      },
    })

    return NextResponse.json({
      ok: true,
      intelligence,
    })
  } catch (error) {
    console.error("Creator command center intelligence failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate executive intelligence",
      },
      { status: 500 }
    )
  }
}