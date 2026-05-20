import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const defaultAgents = [
  {
    name: "Executive Strategist",
    role: "Strategic direction, growth diagnosis and business prioritization.",
    department: "Strategy",
    mission:
      "Identify the highest-leverage moves for Echoes & Visions creator operations.",
    tools: "command-center, learning-memory, revenue, audits",
    memoryScope: "strategy, revenue, learning",
  },
  {
    name: "Creator Success Agent",
    role: "Lead nurturing, creator onboarding and consultation readiness.",
    department: "Creator Success",
    mission:
      "Move creators from interest to audit to onboarding with clarity and care.",
    tools: "crm, nurture, audits",
    memoryScope: "leads, nurture, audits",
  },
  {
    name: "Revenue Operations Agent",
    role: "Proposal, pricing, invoice and revenue pipeline intelligence.",
    department: "Revenue",
    mission:
      "Improve proposal quality, pricing confidence and payment readiness.",
    tools: "proposals, invoices, revenue-events",
    memoryScope: "revenue, proposal, pricing",
  },
  {
    name: "Workflow Architect Agent",
    role: "Automation systems, workflow design and operational mapping.",
    department: "Automation",
    mission:
      "Design and improve creator workflows that reduce manual work and increase consistency.",
    tools: "automation-engine, audits, creator-systems",
    memoryScope: "automation, workflow, systems",
  },
  {
    name: "Intelligence Research Agent",
    role: "Creator trends, niche analysis and opportunity detection.",
    department: "Research",
    mission:
      "Find emerging creator opportunities and strategic patterns worth acting on.",
    tools: "learning-memory, command-center, creator-data",
    memoryScope: "research, niche, trends",
  },
  {
    name: "Operations Monitoring Agent",
    role: "Pipeline health, stalled workflows, inactive leads and operational warnings.",
    department: "Operations",
    mission:
      "Monitor the creator operating system and surface urgent operational issues.",
    tools: "crm, audits, nurture, automations, revenue",
    memoryScope: "operations, pipeline, health",
  },
]

export async function GET() {
  try {
    let agents = await prisma.executiveAgent.findMany({
      orderBy: { createdAt: "asc" },
    })

    if (agents.length === 0) {
      await prisma.executiveAgent.createMany({
        data: defaultAgents,
      })

      agents = await prisma.executiveAgent.findMany({
        orderBy: { createdAt: "asc" },
      })
    }

    const runs = await prisma.executiveAgentRun.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    })

    return NextResponse.json({
      ok: true,
      agents,
      runs,
    })
  } catch (error) {
    console.error("Executive agents fetch failed:", error)

    return NextResponse.json(
      { ok: false, error: "Failed to fetch executive agents" },
      { status: 500 }
    )
  }
}