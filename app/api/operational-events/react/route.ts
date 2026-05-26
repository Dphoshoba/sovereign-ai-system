import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getOpenAI } from "@/lib/ai/openai"
import { DAVID_WRITING_DNA } from "@/lib/ai/writing-dna"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const eventId = body.eventId as string

    if (!eventId) {
      return NextResponse.json(
        { ok: false, error: "eventId is required" },
        { status: 400 }
      )
    }

    const event = await prisma.operationalEvent.findUnique({
      where: { id: eventId },
    })

    if (!event) {
      return NextResponse.json(
        { ok: false, error: "Operational event not found" },
        { status: 404 }
      )
    }

    const [agents, memories, leads, audits, proposals, invoices] =
      await Promise.all([
        prisma.executiveAgent.findMany({ where: { status: "active" } }),
        prisma.creatorLearningMemory.findMany({
          where: { status: "active" },
          orderBy: { createdAt: "desc" },
          take: 50,
        }),
        prisma.creatorLead.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
        prisma.creatorAuditRequest.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
        prisma.creatorProposal.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
        prisma.creatorInvoice.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
      ])

    const response = await getOpenAI().responses.create({
      model: "gpt-5.2",
      instructions:
        "You are the Live AI Nervous System for Echoes & Visions. " +
        DAVID_WRITING_DNA +
        " React to operational events, choose the right agent response and recommend safe next actions. Return valid JSON only.",
      input:
        "React to this operational event:\n\n" +
        JSON.stringify(event) +
        "\n\nReturn JSON only in this exact format:\n" +
        `{
          "summary":"...",
          "severityAssessment":"low|medium|high|critical",
          "recommendedAgent":"...",
          "recommendedActions":["..."],
          "delegationNeeded":false,
          "delegationTask":"...",
          "memoryToStore":"..."
        }` +
        "\n\nAgents:\n" +
        JSON.stringify(agents) +
        "\n\nStrategic Memories:\n" +
        JSON.stringify(memories) +
        "\n\nLeads:\n" +
        JSON.stringify(leads) +
        "\n\nAudits:\n" +
        JSON.stringify(audits) +
        "\n\nProposals:\n" +
        JSON.stringify(proposals) +
        "\n\nInvoices:\n" +
        JSON.stringify(invoices),
    })

    const reaction = JSON.parse(response.output_text)

    const updatedEvent = await prisma.operationalEvent.update({
      where: { id: event.id },
      data: {
        status: "processed",
        severity: reaction.severityAssessment || event.severity,
        payload: {
          ...(event.payload as object || {}),
          reaction,
        },
      },
    })

    if (reaction.memoryToStore) {
      await prisma.creatorLearningMemory.create({
        data: {
          type: "operations",
          title: `Event Memory: ${event.title}`,
          insight: reaction.memoryToStore,
          confidence: 0.75,
          priority:
            reaction.severityAssessment === "critical" ||
            reaction.severityAssessment === "high"
              ? "high"
              : "medium",
          status: "active",
          evidence: {
            eventId: event.id,
            source: event.source,
            type: event.type,
          },
        },
      })
    }

    if (reaction.delegationNeeded && reaction.recommendedAgent) {
      const targetAgent = await prisma.executiveAgent.findFirst({
        where: { name: reaction.recommendedAgent },
      })

      const sourceAgent = await prisma.executiveAgent.findFirst({
        where: { name: "Operations Monitoring Agent" },
      })

      if (targetAgent && sourceAgent) {
        await prisma.agentDelegation.create({
          data: {
            fromAgentId: sourceAgent.id,
            fromAgentName: sourceAgent.name,
            toAgentId: targetAgent.id,
            toAgentName: targetAgent.name,
            task:
              reaction.delegationTask ||
              `Respond to operational event: ${event.title}`,
            context: reaction.summary || event.message || null,
            priority:
              reaction.severityAssessment === "critical" ||
              reaction.severityAssessment === "high"
                ? "high"
                : "medium",
            status: "pending",
          },
        })
      }
    }

    await prisma.aiActivityEvent.create({
      data: {
        type: "operational-event-reaction",
        title: `Nervous system processed: ${event.title}`,
        message: reaction.summary || event.message || null,
        status: "success",
        metadata: {
          eventId: event.id,
          reaction,
        },
      },
    })

    return NextResponse.json({
      ok: true,
      event: updatedEvent,
      reaction,
    })
  } catch (error) {
    console.error("Operational event reaction failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Operational event reaction failed",
      },
      { status: 500 }
    )
  }
}