import {
  buildExecutiveForecast,
  type ExecutiveForecast,
} from "@/lib/executive/forecast"
import {
  calculateInitiativePerformance,
  type InitiativePerformance,
} from "@/lib/executive/initiative-performance"
import {
  buildExecutiveMonthlyReview,
  getMonthlyReviewDateCutoff,
} from "@/lib/executive/monthly-review"
import { buildPerformanceScorecard } from "@/lib/executive/quarterly-goals"
import {
  computeOverallHealthScore,
  getExecutivePlatformSnapshot,
  type ExecutivePlatformSnapshot,
} from "@/lib/executive/platform-snapshot"
import { buildExecutiveRecommendations } from "@/lib/executive/recommendations"
import {
  buildStrategicPlan,
  type StrategicPlan,
} from "@/lib/executive/strategic-plan"
import { buildExecutiveWeeklyReview } from "@/lib/executive/weekly-review"
import { prisma } from "@/lib/prisma"

export const BOARDROOM_AGENT_ROLES = [
  "CEO",
  "COO",
  "CFO",
  "CMO",
  "Content Director",
  "Growth Director",
  "Delivery Director",
] as const

export type BoardroomAgentRole = (typeof BOARDROOM_AGENT_ROLES)[number]

export type BoardroomAgentReport = {
  role: BoardroomAgentRole
  assessment: string
  concerns: string[]
  opportunities: string[]
  recommendations: string[]
}

export type BoardroomSession = {
  sessionType: string
  healthScore: number
  agents: BoardroomAgentReport[]
  executiveSummary: string
  keyDecisions: string[]
  topPriorities: string[]
  majorRisks: string[]
  majorOpportunities: string[]
}

export type BoardroomContext = {
  sessionType: string
  snapshot: ExecutivePlatformSnapshot
  forecast: ExecutiveForecast
  strategicPlan: StrategicPlan
  goals: {
    id: string
    title: string
    status: string
    progress: number
  }[]
  goalScorecard: ReturnType<typeof buildPerformanceScorecard>
  initiativePerformance: InitiativePerformance
  latestPlanningCycle: {
    healthScore: number | null
    summary: string | null
    recommendations: string[]
    risks: string[]
  } | null
}

function formatAud(value: number) {
  return `AUD ${value.toLocaleString("en-AU")}`
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.filter(Boolean))]
}

function normalizeRecommendation(value: string) {
  return value.trim().toLowerCase()
}

function buildCeoAgent(
  snapshot: ExecutivePlatformSnapshot,
  strategicPlan: StrategicPlan,
  forecast: ExecutiveForecast,
  healthScore: number
): BoardroomAgentReport {
  const concerns: string[] = []
  const opportunities: string[] = []
  const recommendations: string[] = []

  if (healthScore < 70) {
    concerns.push(`Overall business health score is ${healthScore}/100 — below target operating range.`)
  }

  if (strategicPlan.risks.length > 0) {
    concerns.push(...strategicPlan.risks.slice(0, 3))
  }

  if (forecast.riskForecast.length > 0) {
    concerns.push(...forecast.riskForecast.slice(0, 2))
  }

  opportunities.push(...strategicPlan.opportunities.slice(0, 3))
  opportunities.push(...forecast.opportunityForecast.slice(0, 2))

  recommendations.push(
    "Align quarterly goals with strategic plan priorities for the current planning period."
  )

  if (healthScore < 80) {
    recommendations.push(
      "Convene a cross-functional review of the highest-risk operational areas this week."
    )
  }

  recommendations.push(
    "Review strategic plan objectives against live platform metrics before the next planning cycle."
  )

  return {
    role: "CEO",
    assessment: `Business health is ${healthScore}/100. Strategic health from the operating plan is ${strategicPlan.strategicHealth}/100. ${forecast.executiveOutlook}`,
    concerns: uniqueStrings(concerns).slice(0, 5),
    opportunities: uniqueStrings(opportunities).slice(0, 5),
    recommendations: uniqueStrings(recommendations).slice(0, 4),
  }
}

function buildCooAgent(
  snapshot: ExecutivePlatformSnapshot,
  initiativePerformance: InitiativePerformance,
  strategicPlan: StrategicPlan
): BoardroomAgentReport {
  const concerns: string[] = []
  const opportunities: string[] = []
  const recommendations: string[] = []

  if (initiativePerformance.blockedInitiatives > 0) {
    concerns.push(
      `${initiativePerformance.blockedInitiatives} strategic initiative${initiativePerformance.blockedInitiatives === 1 ? "" : "s"} blocked.`
    )
  }

  if (initiativePerformance.initiativeHealth === "Needs Attention") {
    concerns.push(
      `Initiative completion rate is ${initiativePerformance.completionRate}% — needs attention.`
    )
  }

  if (snapshot.overdueTasks > 0) {
    concerns.push(`${snapshot.overdueTasks} overdue delivery task${snapshot.overdueTasks === 1 ? "" : "s"}.`)
  }

  if (initiativePerformance.completedInitiatives > 0) {
    opportunities.push(
      `${initiativePerformance.completedInitiatives} initiative${initiativePerformance.completedInitiatives === 1 ? "" : "s"} completed — execution momentum is building.`
    )
  }

  if (strategicPlan.initiatives.length > 0) {
    opportunities.push(
      `${strategicPlan.initiatives.length} strategic initiatives defined in the current operating plan.`
    )
  }

  recommendations.push("Sync quarterly goal progress from linked strategic initiatives.")
  recommendations.push("Review blocked initiatives and assign unblock owners in the execution engine.")

  if (snapshot.overdueTasks > 0) {
    recommendations.push("Clear overdue client delivery tasks before taking on new execution work.")
  }

  return {
    role: "COO",
    assessment: `${initiativePerformance.totalInitiatives} initiatives tracked (${initiativePerformance.activeInitiatives} active, ${initiativePerformance.completedInitiatives} completed). Delivery health score is ${snapshot.deliveryHealthScore}/100 with ${snapshot.activeProjects} active projects.`,
    concerns: uniqueStrings(concerns).slice(0, 5),
    opportunities: uniqueStrings(opportunities).slice(0, 5),
    recommendations: uniqueStrings(recommendations).slice(0, 4),
  }
}

function buildCfoAgent(snapshot: ExecutivePlatformSnapshot): BoardroomAgentReport {
  const concerns: string[] = []
  const opportunities: string[] = []
  const recommendations: string[] = []

  if (snapshot.outstandingRevenue > 0) {
    concerns.push(`Outstanding revenue: ${formatAud(snapshot.outstandingRevenue)}.`)
  }

  if (snapshot.overdueInvoices > 0) {
    concerns.push(`${snapshot.overdueInvoices} overdue invoice${snapshot.overdueInvoices === 1 ? "" : "s"}.`)
  }

  if (snapshot.openPipeline === 0) {
    concerns.push("Sales pipeline has no open deal value.")
  }

  if (snapshot.wonRevenue > 0) {
    opportunities.push(`Won revenue: ${formatAud(snapshot.wonRevenue)}.`)
  }

  if (snapshot.totalPipelineValue > 0) {
    opportunities.push(`Open pipeline value: ${formatAud(snapshot.openPipeline)} of ${formatAud(snapshot.totalPipelineValue)} total.`)
  }

  if (snapshot.recentlyPaidInvoiceCount > 0) {
    opportunities.push(
      `${snapshot.recentlyPaidInvoiceCount} invoice${snapshot.recentlyPaidInvoiceCount === 1 ? "" : "s"} paid recently.`
    )
  }

  recommendations.push("Follow up on outstanding and overdue invoices this week.")

  if (snapshot.proposalReadyLeads.length > 0) {
    recommendations.push(
      `Convert ${snapshot.proposalReadyLeads.length} proposal-ready lead${snapshot.proposalReadyLeads.length === 1 ? "" : "s"} into signed revenue.`
    )
  }

  if (snapshot.openPipeline === 0) {
    recommendations.push("Rebuild sales pipeline activity with creator lead outreach.")
  }

  return {
    role: "CFO",
    assessment: `Total invoiced ${formatAud(snapshot.totalInvoiced)}, paid ${formatAud(snapshot.totalPaid)}, outstanding ${formatAud(snapshot.outstandingRevenue)}. Pipeline open value is ${formatAud(snapshot.openPipeline)}.`,
    concerns: uniqueStrings(concerns).slice(0, 5),
    opportunities: uniqueStrings(opportunities).slice(0, 5),
    recommendations: uniqueStrings(recommendations).slice(0, 4),
  }
}

function buildCmoAgent(snapshot: ExecutivePlatformSnapshot): BoardroomAgentReport {
  const concerns: string[] = []
  const opportunities: string[] = []
  const recommendations: string[] = []

  if (snapshot.totalLeads === 0) {
    concerns.push("No creator leads in the CRM pipeline.")
  }

  if (snapshot.hotLeads.length === 0 && snapshot.proposalReadyLeads.length === 0) {
    concerns.push("No hot or proposal-ready leads requiring immediate follow-up.")
  }

  if (snapshot.leadMagnetCount === 0) {
    concerns.push("No lead magnets configured for acquisition.")
  }

  if (snapshot.hotLeads.length > 0) {
    opportunities.push(`${snapshot.hotLeads.length} hot lead${snapshot.hotLeads.length === 1 ? "" : "s"} ready for outreach.`)
  }

  if (snapshot.proposalReadyLeads.length > 0) {
    opportunities.push(
      `${snapshot.proposalReadyLeads.length} proposal-ready lead${snapshot.proposalReadyLeads.length === 1 ? "" : "s"} in the funnel.`
    )
  }

  if (snapshot.topLeadMagnet) {
    opportunities.push(`Top lead magnet: ${snapshot.topLeadMagnet}.`)
  }

  recommendations.push("Review creator leads pipeline and prioritize hot prospects.")

  if (snapshot.proposalReadyLeads.length > 0) {
    recommendations.push("Send or follow up on proposals for proposal-ready leads.")
  }

  if (snapshot.leadMagnetCount === 0 || snapshot.leadMagnetSubscribers === 0) {
    recommendations.push("Launch or refresh a lead magnet to improve top-of-funnel conversion.")
  }

  return {
    role: "CMO",
    assessment: `${snapshot.totalLeads} total leads (${snapshot.hotLeads.length} hot, ${snapshot.proposalReadyLeads.length} proposal-ready). ${snapshot.leadMagnetSubscribers} subscribers acquired via lead magnets across ${snapshot.leadMagnetCount} magnet${snapshot.leadMagnetCount === 1 ? "" : "s"}.`,
    concerns: uniqueStrings(concerns).slice(0, 5),
    opportunities: uniqueStrings(opportunities).slice(0, 5),
    recommendations: uniqueStrings(recommendations).slice(0, 4),
  }
}

function buildContentDirectorAgent(
  snapshot: ExecutivePlatformSnapshot
): BoardroomAgentReport {
  const concerns: string[] = []
  const opportunities: string[] = []
  const recommendations: string[] = []

  if (snapshot.reviewRequiredCount > 0) {
    concerns.push(
      `${snapshot.reviewRequiredCount} article${snapshot.reviewRequiredCount === 1 ? "" : "s"} in the editorial review backlog.`
    )
  }

  if (snapshot.scheduledCount === 0) {
    concerns.push("No content scheduled for upcoming publication.")
  }

  if (snapshot.draftCount > snapshot.publishedArticles) {
    concerns.push(
      `Draft backlog (${snapshot.draftCount}) exceeds published output (${snapshot.publishedArticles}).`
    )
  }

  if (snapshot.publishedArticles > 0) {
    opportunities.push(
      `${snapshot.publishedArticles} published article${snapshot.publishedArticles === 1 ? "" : "s"} live on the platform.`
    )
  }

  if (snapshot.scheduledCount > 0) {
    opportunities.push(
      `${snapshot.scheduledCount} article${snapshot.scheduledCount === 1 ? "" : "s"} scheduled for publication.`
    )
  }

  recommendations.push("Clear the editorial review queue before adding new draft volume.")

  if (snapshot.scheduledCount === 0) {
    recommendations.push("Schedule approved content to maintain publishing momentum.")
  }

  if (snapshot.draftCount > 0) {
    recommendations.push("Move high-priority drafts through review and into the publishing queue.")
  }

  return {
    role: "Content Director",
    assessment: `${snapshot.publishedArticles} published, ${snapshot.draftCount} drafts, ${snapshot.reviewRequiredCount} awaiting review, ${snapshot.scheduledCount} scheduled.`,
    concerns: uniqueStrings(concerns).slice(0, 5),
    opportunities: uniqueStrings(opportunities).slice(0, 5),
    recommendations: uniqueStrings(recommendations).slice(0, 4),
  }
}

function buildGrowthDirectorAgent(
  snapshot: ExecutivePlatformSnapshot
): BoardroomAgentReport {
  const concerns: string[] = []
  const opportunities: string[] = []
  const recommendations: string[] = []

  if (snapshot.growthRate === 0) {
    concerns.push("No subscriber growth recorded this month.")
  }

  if (snapshot.totalSubscribers < 50) {
    concerns.push(`Subscriber base is ${snapshot.totalSubscribers} — limited audience reach.`)
  }

  if (snapshot.monthlySubscribers === 0) {
    concerns.push("No new subscribers added this month.")
  }

  if (snapshot.totalSubscribers > 0) {
    opportunities.push(
      `${snapshot.totalSubscribers} total subscribers (${snapshot.activeSubscribers} active).`
    )
  }

  if (snapshot.growthRate > 0) {
    opportunities.push(`Monthly growth rate: ${snapshot.growthRate}%.`)
  }

  if (snapshot.leadMagnetSubscribers > 0) {
    opportunities.push(
      `${snapshot.leadMagnetSubscribers} subscribers acquired through lead magnets.`
    )
  }

  recommendations.push("Review growth dashboard and double down on top-performing acquisition channels.")

  if (snapshot.growthRate === 0) {
    recommendations.push("Launch a subscriber acquisition push via lead magnets and newsletter CTAs.")
  }

  if (snapshot.topLeadMagnet) {
    recommendations.push(`Optimize and promote the top lead magnet: ${snapshot.topLeadMagnet}.`)
  }

  return {
    role: "Growth Director",
    assessment: `${snapshot.totalSubscribers} subscribers with ${snapshot.monthlySubscribers} added this month (${snapshot.growthRate}% growth rate). Lead magnet subscribers: ${snapshot.leadMagnetSubscribers}.`,
    concerns: uniqueStrings(concerns).slice(0, 5),
    opportunities: uniqueStrings(opportunities).slice(0, 5),
    recommendations: uniqueStrings(recommendations).slice(0, 4),
  }
}

function buildDeliveryDirectorAgent(
  snapshot: ExecutivePlatformSnapshot
): BoardroomAgentReport {
  const concerns: string[] = []
  const opportunities: string[] = []
  const recommendations: string[] = []

  if (snapshot.deliveryHealthScore < 70) {
    concerns.push(`Delivery health score is ${snapshot.deliveryHealthScore}/100.`)
  }

  if (snapshot.overdueTasks > 0) {
    concerns.push(`${snapshot.overdueTasks} overdue task${snapshot.overdueTasks === 1 ? "" : "s"}.`)
  }

  if (snapshot.atRiskProjects.length > 0) {
    concerns.push(
      `${snapshot.atRiskProjects.length} project${snapshot.atRiskProjects.length === 1 ? "" : "s"} at risk of missing deadlines.`
    )
  }

  if (snapshot.completedProjects > 0) {
    opportunities.push(
      `${snapshot.completedProjects} completed client project${snapshot.completedProjects === 1 ? "" : "s"}.`
    )
  }

  if (snapshot.readyToCompleteProjects.length > 0) {
    opportunities.push(
      `${snapshot.readyToCompleteProjects.length} project${snapshot.readyToCompleteProjects.length === 1 ? "" : "s"} ready to mark completed.`
    )
  }

  recommendations.push("Review delivery dashboard for project health and task backlog.")

  if (snapshot.overdueTasks > 0) {
    recommendations.push("Assign owners to overdue tasks and reset delivery timelines.")
  }

  if (snapshot.atRiskProjects.length > 0) {
    recommendations.push("Escalate at-risk projects before due dates pass.")
  }

  return {
    role: "Delivery Director",
    assessment: `${snapshot.activeClients} active clients, ${snapshot.activeProjects} active projects, ${snapshot.openTasks} open tasks (${snapshot.doneTasks} done). Delivery health: ${snapshot.deliveryHealthScore}/100.`,
    concerns: uniqueStrings(concerns).slice(0, 5),
    opportunities: uniqueStrings(opportunities).slice(0, 5),
    recommendations: uniqueStrings(recommendations).slice(0, 4),
  }
}

function buildKeyDecisions(agents: BoardroomAgentReport[]): string[] {
  const counts = new Map<string, { label: string; count: number }>()

  for (const agent of agents) {
    for (const recommendation of agent.recommendations) {
      const key = normalizeRecommendation(recommendation)
      const existing = counts.get(key)

      if (existing) {
        existing.count += 1
      } else {
        counts.set(key, { label: recommendation, count: 1 })
      }
    }
  }

  return [...counts.values()]
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label))
    .slice(0, 5)
    .map((item) =>
      item.count > 1 ? `${item.label} (supported by ${item.count} agents)` : item.label
    )
}

function buildTopPriorities(agents: BoardroomAgentReport[]): string[] {
  const priorities = agents.flatMap((agent) => agent.recommendations)
  return uniqueStrings(priorities).slice(0, 5)
}

function buildExecutiveSummary(
  sessionType: string,
  healthScore: number,
  agents: BoardroomAgentReport[],
  strategicPlan: StrategicPlan,
  latestPlanningCycle: BoardroomContext["latestPlanningCycle"]
): string {
  const label = sessionType === "weekly" ? "Weekly" : sessionType
  const riskCount = agents.reduce((sum, agent) => sum + agent.concerns.length, 0)
  const opportunityCount = agents.reduce(
    (sum, agent) => sum + agent.opportunities.length,
    0
  )

  const planningNote = latestPlanningCycle?.summary
    ? ` Latest planning cycle: ${latestPlanningCycle.summary.split(".")[0]}.`
    : ""

  return `${label} executive boardroom session complete. Overall health ${healthScore}/100 across ${agents.length} agent perspectives. ${strategicPlan.executiveSummary.split(".")[0]}. Agents surfaced ${riskCount} concern${riskCount === 1 ? "" : "s"} and ${opportunityCount} opportunity signal${opportunityCount === 1 ? "" : "s"}.${planningNote}`
}

export async function loadBoardroomContext(
  sessionType = "weekly"
): Promise<BoardroomContext> {
  const cutoff = getMonthlyReviewDateCutoff()

  const [
    snapshot,
    briefings,
    leads,
    goals,
    initiatives,
    latestPlanningCycle,
  ] = await Promise.all([
    getExecutivePlatformSnapshot(),
    prisma.executiveBriefing.findMany({
      where: {
        briefingDate: {
          gte: cutoff,
        },
      },
      orderBy: {
        briefingDate: "desc",
      },
    }),
    prisma.creatorLead.findMany(),
    prisma.quarterlyGoal.findMany(),
    prisma.strategicInitiative.findMany({
      select: {
        id: true,
        goalId: true,
        status: true,
        progress: true,
      },
    }),
    prisma.planningCycle.findFirst({
      orderBy: { createdAt: "desc" },
    }),
  ])

  const monthlyReview = buildExecutiveMonthlyReview(briefings)
  const weeklyReview = buildExecutiveWeeklyReview(briefings.slice(0, 7))
  const forecast = buildExecutiveForecast({
    snapshot,
    briefings,
    monthlyReview,
  })
  const recommendations = buildExecutiveRecommendations(snapshot)
  const proposalSentLeads = leads.filter(
    (lead) => lead.status === "proposal-sent"
  ).length
  const strategicPlan = buildStrategicPlan({
    snapshot,
    forecast,
    monthlyReview,
    weeklyReview,
    recommendations,
    proposalSentLeads,
  })
  const initiativePerformance = calculateInitiativePerformance(
    initiatives,
    goals
  )
  const goalScorecard = buildPerformanceScorecard(goals)

  return {
    sessionType,
    snapshot,
    forecast,
    strategicPlan,
    goals,
    goalScorecard,
    initiativePerformance,
    latestPlanningCycle: latestPlanningCycle
      ? {
          healthScore: latestPlanningCycle.healthScore,
          summary: latestPlanningCycle.summary,
          recommendations: Array.isArray(latestPlanningCycle.recommendations)
            ? (latestPlanningCycle.recommendations as string[])
            : [],
          risks: Array.isArray(latestPlanningCycle.risks)
            ? (latestPlanningCycle.risks as string[])
            : [],
        }
      : null,
  }
}

export function runBoardroomSession(context: BoardroomContext): BoardroomSession {
  const {
    sessionType,
    snapshot,
    forecast,
    strategicPlan,
    initiativePerformance,
    latestPlanningCycle,
  } = context

  const healthScore = Math.round(
    (computeOverallHealthScore(snapshot) +
      forecast.forecastHealthScore +
      strategicPlan.strategicHealth) /
      3
  )

  const agents: BoardroomAgentReport[] = [
    buildCeoAgent(snapshot, strategicPlan, forecast, healthScore),
    buildCooAgent(snapshot, initiativePerformance, strategicPlan),
    buildCfoAgent(snapshot),
    buildCmoAgent(snapshot),
    buildContentDirectorAgent(snapshot),
    buildGrowthDirectorAgent(snapshot),
    buildDeliveryDirectorAgent(snapshot),
  ]

  const majorRisks = uniqueStrings([
    ...agents.flatMap((agent) => agent.concerns),
    ...(latestPlanningCycle?.risks ?? []),
    ...forecast.riskForecast.slice(0, 3),
  ]).slice(0, 12)

  const majorOpportunities = uniqueStrings([
    ...agents.flatMap((agent) => agent.opportunities),
    ...strategicPlan.opportunities.slice(0, 3),
    ...forecast.opportunityForecast.slice(0, 3),
  ]).slice(0, 12)

  const keyDecisions = buildKeyDecisions(agents)
  const topPriorities = buildTopPriorities(agents)

  return {
    sessionType,
    healthScore,
    agents,
    executiveSummary: buildExecutiveSummary(
      sessionType,
      healthScore,
      agents,
      strategicPlan,
      latestPlanningCycle
    ),
    keyDecisions,
    topPriorities,
    majorRisks,
    majorOpportunities,
  }
}
