import { NextResponse } from "next/server"
import { computeOverallHealthScore } from "@/lib/executive/platform-snapshot"
import { getExecutivePlatformSnapshot } from "@/lib/executive/platform-snapshot"

export async function GET() {
  try {
    const snapshot = await getExecutivePlatformSnapshot()

    const overallHealthScore = computeOverallHealthScore(snapshot)

    const alerts: string[] = []

    if (snapshot.reviewRequiredCount > 0) {
      alerts.push(
        `${snapshot.reviewRequiredCount} article${snapshot.reviewRequiredCount === 1 ? "" : "s"} require editorial review`
      )
    }

    if (snapshot.outstandingRevenue > 0) {
      alerts.push(
        `Outstanding client revenue: AUD ${snapshot.outstandingRevenue.toLocaleString("en-AU")}`
      )
    }

    if (snapshot.overdueTasks > 0) {
      alerts.push(
        `${snapshot.overdueTasks} client delivery task${snapshot.overdueTasks === 1 ? "" : "s"} overdue`
      )
    }

    if (snapshot.deliveryHealthScore < 70) {
      alerts.push(
        `Delivery health score is ${snapshot.deliveryHealthScore} — client delivery needs attention`
      )
    }

    const priorities: string[] = []

    if (snapshot.reviewRequiredCount > 0) {
      priorities.push("Clear the editorial review queue")
    }

    if (snapshot.scheduledCount === 0) {
      priorities.push("Schedule upcoming content to maintain publishing momentum")
    }

    if (snapshot.proposalReadyLeads.length > 0) {
      priorities.push(
        `Send proposals to ${snapshot.proposalReadyLeads.length} proposal-ready lead${snapshot.proposalReadyLeads.length === 1 ? "" : "s"}`
      )
    }

    if (snapshot.hotLeads.length > 0) {
      priorities.push(
        `Follow up with ${snapshot.hotLeads.length} hot CRM lead${snapshot.hotLeads.length === 1 ? "" : "s"}`
      )
    }

    if (snapshot.atRiskProjects.length > 0) {
      priorities.push(
        `Review ${snapshot.atRiskProjects.length} at-risk client project${snapshot.atRiskProjects.length === 1 ? "" : "s"}`
      )
    }

    const opportunities: string[] = []

    if (snapshot.growthRate > 0) {
      opportunities.push(
        `Subscriber growth rate is ${snapshot.growthRate}% this month — promote lead magnets`
      )
    }

    if (snapshot.topLeadMagnet) {
      opportunities.push(
        `Top lead magnet "${snapshot.topLeadMagnet}" is performing — create similar offers`
      )
    }

    if (snapshot.wonLeads > 0) {
      opportunities.push(
        `${snapshot.wonLeads} won lead${snapshot.wonLeads === 1 ? "" : "s"} — convert into client delivery projects`
      )
    }

    if (snapshot.openPipeline > 0) {
      opportunities.push(
        `Open pipeline value AUD ${snapshot.openPipeline.toLocaleString("en-AU")} — advance active deals`
      )
    }

    if (snapshot.recentlyPaidInvoiceCount > 0) {
      opportunities.push(
        `${snapshot.recentlyPaidInvoiceCount} recent paid invoice${snapshot.recentlyPaidInvoiceCount === 1 ? "" : "s"} — consider upsell proposals`
      )
    }

    if (opportunities.length === 0) {
      opportunities.push(
        "Business systems are operational — focus on content, leads, and client delivery growth"
      )
    }

    return NextResponse.json({
      ok: true,
      overview: {
        content: {
          publishedArticles: snapshot.publishedArticles,
          drafts: snapshot.draftCount,
          reviewRequired: snapshot.reviewRequiredCount,
          scheduled: snapshot.scheduledCount,
        },
        growth: {
          totalSubscribers: snapshot.totalSubscribers,
          activeSubscribers: snapshot.activeSubscribers,
          monthlySubscribers: snapshot.monthlySubscribers,
          growthRate: snapshot.growthRate,
          leadMagnetSubscribers: snapshot.leadMagnetSubscribers,
          topLeadMagnet: snapshot.topLeadMagnet,
        },
        crm: {
          totalLeads: snapshot.totalLeads,
          hotLeads: snapshot.hotLeads.length,
          wonLeads: snapshot.wonLeads,
          proposalReadyLeads: snapshot.proposalReadyLeads.length,
        },
        revenue: {
          totalPipelineValue: snapshot.totalPipelineValue,
          wonRevenue: snapshot.wonRevenue,
          openPipeline: snapshot.openPipeline,
          totalInvoiced: snapshot.totalInvoiced,
          totalPaid: snapshot.totalPaid,
          outstandingRevenue: snapshot.outstandingRevenue,
        },
        delivery: {
          activeClients: snapshot.activeClients,
          activeProjects: snapshot.activeProjects,
          openTasks: snapshot.openTasks,
          doneTasks: snapshot.doneTasks,
          overdueTasks: snapshot.overdueTasks,
          totalProjectValue: snapshot.totalProjectValue,
          deliveryHealthScore: snapshot.deliveryHealthScore,
        },
        executiveSummary: {
          overallHealthScore,
          alerts,
          priorities,
          opportunities,
        },
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Executive overview failed",
      },
      { status: 500 }
    )
  }
}
