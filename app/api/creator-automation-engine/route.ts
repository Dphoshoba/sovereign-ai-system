import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getOpenAI } from "@/lib/ai/openai"
import { DAVID_WRITING_DNA } from "@/lib/ai/writing-dna"

export async function GET() {
  try {
    const actions = await prisma.creatorAutomationAction.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    })

    return NextResponse.json({ ok: true, actions })
  } catch (error) {
    console.error("Automation actions fetch failed:", error)

    return NextResponse.json(
      { ok: false, error: "Failed to fetch automation actions" },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    const [leads, audits, nurtureEvents] = await Promise.all([
      prisma.creatorLead.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.creatorAuditRequest.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.creatorNurtureEvent.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
    ])

    const response = await getOpenAI().responses.create({
      model: "gpt-5.2",
      instructions:
        "You are the Autonomous Creator Workflow Automation Engine for Echoes & Visions. " +
        DAVID_WRITING_DNA +
        " Analyze creator leads, audits, and nurture events. Recommend safe automation actions only. Return valid JSON only.",
      input:
        "Analyze this creator operations data and recommend workflow automation actions.\n\n" +
        "Do not recommend destructive actions. Prioritize lead follow-up, audit progression, proposal readiness, nurturing, and hot-lead escalation.\n\n" +
        "Return JSON only in this exact format:\n" +
        `[
          {
            "source": "lead|audit|nurture|system",
            "title": "...",
            "description": "...",
            "actionType": "follow_up_lead|mark_hot_lead|schedule_audit_reminder|advance_audit_stage|generate_proposal_task|send_nurture_reminder|log_activity",
            "priority": "low|medium|high",
            "leadId": "...",
            "auditId": "...",
            "payload": {}
          }
        ]` +
        "\n\nLeads:\n" +
        JSON.stringify(
          leads.map((lead) => ({
            id: lead.id,
            name: lead.name,
            email: lead.email,
            creatorType: lead.creatorType,
            status: lead.status,
            leadScore: lead.leadScore,
            readiness: lead.readiness,
            niche: lead.niche,
            bottlenecks: lead.bottlenecks,
            notes: lead.notes,
            projectedValue: lead.projectedValue,
            createdAt: lead.createdAt,
          }))
        ) +
        "\n\nAudits:\n" +
        JSON.stringify(
          audits.map((audit) => ({
            id: audit.id,
            name: audit.name,
            email: audit.email,
            creatorType: audit.creatorType,
            niche: audit.niche,
            status: audit.status,
            opportunityScore: audit.opportunityScore,
            biggestBottleneck: audit.biggestBottleneck,
            automationGoals: audit.automationGoals,
            auditSummary: audit.auditSummary,
            recommendedSystems: audit.recommendedSystems,
            nextActions: audit.nextActions,
            proposalDraft: audit.proposalDraft,
            createdAt: audit.createdAt,
          }))
        ) +
        "\n\nNurture Events:\n" +
        JSON.stringify(
          nurtureEvents.map((event) => ({
            id: event.id,
            leadId: event.leadId,
            type: event.type,
            subject: event.subject,
            status: event.status,
            createdAt: event.createdAt,
          }))
        ),
    })

    const parsed = JSON.parse(response.output_text)

    const savedActions = []

    for (const item of parsed) {
      const action = await prisma.creatorAutomationAction.create({
        data: {
          source: item.source || "system",
          title: item.title,
          description: item.description || null,
          actionType: item.actionType,
          priority: item.priority || "medium",
          leadId: item.leadId || null,
          auditId: item.auditId || null,
          payload: item.payload || {},
          status: "pending",
        },
      })

      savedActions.push(action)
    }

    return NextResponse.json({
      ok: true,
      actions: savedActions,
    })
  } catch (error) {
    console.error("Automation scan failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Automation scan failed",
      },
      { status: 500 }
    )
  }
}