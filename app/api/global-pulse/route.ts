import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const [
      leads,
      events,
      toolActions,
      missions,
      agents,
      optimizations,
      forecasts,
      invoices,
      proposals,
    ] = await Promise.all([
      prisma.creatorLead.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
      prisma.operationalEvent.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
      prisma.toolExecutionAction.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
      prisma.autonomousMissionTask.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
      prisma.executiveAgent.findMany({ where: { status: "active" } }),
      prisma.optimizationRun.findMany({ orderBy: { createdAt: "desc" }, take: 1 }),
      prisma.predictiveForecast.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
      prisma.creatorInvoice.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
      prisma.creatorProposal.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
    ])

    const criticalEvents = events.filter((event) => event.severity === "critical").length
    const highEvents = events.filter((event) => event.severity === "high").length
    const newEvents = events.filter((event) => event.status === "new").length
    const failedActions = toolActions.filter((action) => action.status === "failed").length
    const queuedActions = toolActions.filter((action) =>
      ["queued", "approval-required", "running"].includes(action.status)
    ).length
    const pendingMissions = missions.filter((mission) => mission.status === "pending").length
    const hotLeads = leads.filter(
      (lead) => lead.leadScore >= 75 || ["ready", "urgent"].includes(lead.readiness)
    ).length

    const projectedRevenue = proposals.reduce(
      (sum, proposal) => sum + (proposal.estimatedValue || 0),
      0
    )

    const invoicedRevenue = invoices.reduce(
      (sum, invoice) => sum + invoice.amount,
      0
    )

    const latestOptimization = optimizations[0]
    const healthScore = latestOptimization?.healthScore ?? 80

    const status =
      criticalEvents > 0 || failedActions > 3
        ? "critical"
        : highEvents > 0 || healthScore < 60
          ? "warning"
          : queuedActions > 0 || pendingMissions > 0
            ? "active"
            : "stable"

    return NextResponse.json({
      ok: true,
      status,
      metrics: {
        healthScore,
        activeAgents: agents.length,
        newEvents,
        highEvents,
        criticalEvents,
        queuedActions,
        failedActions,
        pendingMissions,
        hotLeads,
        forecastCount: forecasts.length,
        projectedRevenue,
        invoicedRevenue,
      },
      latest: {
        event: events[0] || null,
        forecast: forecasts[0] || null,
        optimization: latestOptimization || null,
      },
    })
  } catch (error) {
    console.error("Global pulse fetch failed:", error)

    return NextResponse.json(
      { ok: false, error: "Failed to fetch global pulse" },
      { status: 500 }
    )
  }
}
