import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

function isOverdueTask(task: {
  dueDate: Date | null
  status: string
}) {
  if (!task.dueDate || task.status === "done") {
    return false
  }

  return task.dueDate.getTime() < Date.now()
}

function getProjectProgress(
  projectId: string,
  tasks: { projectId: string; status: string }[]
) {
  const projectTasks = tasks.filter((task) => task.projectId === projectId)

  if (projectTasks.length === 0) {
    return 0
  }

  const doneCount = projectTasks.filter((task) => task.status === "done").length
  return Math.round((doneCount / projectTasks.length) * 100)
}

function isAtRiskProject(project: {
  status: string
  dueDate: Date | null
  progressPercent: number
}) {
  if (project.status !== "active" || !project.dueDate) {
    return false
  }

  const dueWithinSevenDays =
    project.dueDate.getTime() <= Date.now() + SEVEN_DAYS_MS

  return dueWithinSevenDays && project.progressPercent < 50
}

function computeDeliveryHealthScore(
  overdueTasks: number,
  overdueInvoices: number,
  atRiskProjects: number
) {
  return Math.max(
    0,
    100 - overdueTasks * 10 - overdueInvoices * 15 - atRiskProjects * 20
  )
}

function isOverdueInvoice(invoice: {
  dueDate: Date | null
  status: string
}) {
  if (invoice.status === "overdue") {
    return true
  }

  if (invoice.status !== "sent" || !invoice.dueDate) {
    return false
  }

  return invoice.dueDate.getTime() < Date.now()
}

export async function GET() {
  try {
    const [
      articles,
      subscribers,
      leadMagnets,
      leads,
      invoices,
      clients,
      projects,
      tasks,
    ] = await Promise.all([
      prisma.article.findMany(),
      prisma.subscriber.findMany(),
      prisma.leadMagnet.findMany(),
      prisma.creatorLead.findMany(),
      prisma.clientInvoice.findMany(),
      prisma.clientProfile.findMany({ where: { type: "client" } }),
      prisma.clientProject.findMany({
        where: { status: { not: "archived" } },
      }),
      prisma.clientProjectTask.findMany(),
    ])

    const publishedArticles = articles.filter(
      (article) => article.status === "published"
    ).length
    const drafts = articles.filter((article) => article.status === "draft").length
    const reviewRequired = articles.filter(
      (article) => article.status === "review-required"
    ).length
    const scheduled = articles.filter(
      (article) => article.status === "scheduled"
    ).length

    const totalSubscribers = subscribers.length
    const activeSubscribers = subscribers.filter(
      (subscriber) => subscriber.status === "active"
    ).length
    const currentDate = new Date()
    const monthlySubscribers = subscribers.filter((subscriber) => {
      const createdAt = new Date(subscriber.createdAt)
      return (
        createdAt.getMonth() === currentDate.getMonth() &&
        createdAt.getFullYear() === currentDate.getFullYear()
      )
    }).length
    const growthRate =
      totalSubscribers > 0
        ? Math.round((monthlySubscribers / totalSubscribers) * 100)
        : 0

    const leadMagnetSubscribers = leadMagnets.reduce(
      (sum, magnet) => sum + magnet.subscribers,
      0
    )
    const topLeadMagnet =
      leadMagnets.length === 0
        ? null
        : leadMagnets.reduce((top, magnet) =>
            magnet.subscribers > top.subscribers ? magnet : top
          ).title

    const totalLeads = leads.length
    const hotLeads = leads.filter(
      (lead) =>
        lead.leadScore >= 75 || ["ready", "urgent"].includes(lead.readiness)
    ).length
    const wonLeads = leads.filter((lead) => lead.status === "won").length
    const proposalReadyLeads = leads.filter(
      (lead) => lead.status === "proposal-ready"
    ).length

    const totalPipelineValue = leads.reduce(
      (sum, lead) => sum + (lead.projectedValue || 0),
      0
    )
    const wonRevenue = leads
      .filter((lead) => lead.status === "won")
      .reduce((sum, lead) => sum + (lead.projectedValue || 0), 0)
    const openPipeline = leads
      .filter((lead) =>
        ["new", "contacted", "proposal-ready", "proposal-sent"].includes(
          lead.status || ""
        )
      )
      .reduce((sum, lead) => sum + (lead.projectedValue || 0), 0)

    const totalInvoiced = invoices
      .filter((invoice) => invoice.status !== "draft")
      .reduce((sum, invoice) => sum + invoice.amountAud, 0)
    const totalPaid = invoices
      .filter((invoice) => invoice.status === "paid")
      .reduce((sum, invoice) => sum + invoice.amountAud, 0)
    const outstandingRevenue = invoices
      .filter((invoice) => ["sent", "overdue"].includes(invoice.status))
      .reduce((sum, invoice) => sum + invoice.amountAud, 0)

    const visibleProjectIds = new Set(projects.map((project) => project.id))
    const visibleTasks = tasks.filter((task) =>
      visibleProjectIds.has(task.projectId)
    )

    const activeClients = clients.filter(
      (client) => client.status === "active"
    ).length
    const activeProjects = projects.filter(
      (project) => project.status === "active"
    ).length
    const openTasks = visibleTasks.filter((task) => task.status !== "done").length
    const doneTasks = visibleTasks.filter((task) => task.status === "done").length
    const overdueTasks = visibleTasks.filter((task) => isOverdueTask(task)).length
    const totalProjectValue = projects.reduce(
      (sum, project) => sum + (project.valueAud || 0),
      0
    )

    const overdueInvoiceCount = invoices.filter((invoice) =>
      isOverdueInvoice(invoice)
    ).length

    const projectsWithProgress = projects.map((project) => ({
      ...project,
      progressPercent: getProjectProgress(project.id, visibleTasks),
    }))

    const atRiskProjects = projectsWithProgress.filter((project) =>
      isAtRiskProject(project)
    ).length

    const deliveryHealthScore = computeDeliveryHealthScore(
      overdueTasks,
      overdueInvoiceCount,
      atRiskProjects
    )

    let overallHealthScore = 100

    if (reviewRequired > 0) {
      overallHealthScore -= 10
    }

    if (scheduled === 0) {
      overallHealthScore -= 10
    }

    if (growthRate === 0) {
      overallHealthScore -= 10
    }

    if (openPipeline === 0) {
      overallHealthScore -= 15
    }

    if (outstandingRevenue > 0) {
      overallHealthScore -= 15
    }

    overallHealthScore -= overdueTasks * 10

    if (deliveryHealthScore < 70) {
      overallHealthScore -= 10
    }

    overallHealthScore = Math.max(0, overallHealthScore)

    const alerts: string[] = []

    if (reviewRequired > 0) {
      alerts.push(
        `${reviewRequired} article${reviewRequired === 1 ? "" : "s"} require editorial review`
      )
    }

    if (outstandingRevenue > 0) {
      alerts.push(
        `Outstanding client revenue: AUD ${outstandingRevenue.toLocaleString("en-AU")}`
      )
    }

    if (overdueTasks > 0) {
      alerts.push(
        `${overdueTasks} client delivery task${overdueTasks === 1 ? "" : "s"} overdue`
      )
    }

    if (deliveryHealthScore < 70) {
      alerts.push(
        `Delivery health score is ${deliveryHealthScore} — client delivery needs attention`
      )
    }

    const priorities: string[] = []

    if (reviewRequired > 0) {
      priorities.push("Clear the editorial review queue")
    }

    if (scheduled === 0) {
      priorities.push("Schedule upcoming content to maintain publishing momentum")
    }

    if (proposalReadyLeads > 0) {
      priorities.push(
        `Send proposals to ${proposalReadyLeads} proposal-ready lead${proposalReadyLeads === 1 ? "" : "s"}`
      )
    }

    if (hotLeads > 0) {
      priorities.push(`Follow up with ${hotLeads} hot CRM lead${hotLeads === 1 ? "" : "s"}`)
    }

    if (atRiskProjects > 0) {
      priorities.push(
        `Review ${atRiskProjects} at-risk client project${atRiskProjects === 1 ? "" : "s"}`
      )
    }

    const opportunities: string[] = []

    if (growthRate > 0) {
      opportunities.push(
        `Subscriber growth rate is ${growthRate}% this month — promote lead magnets`
      )
    }

    if (topLeadMagnet) {
      opportunities.push(`Top lead magnet "${topLeadMagnet}" is performing — create similar offers`)
    }

    if (wonLeads > 0) {
      opportunities.push(
        `${wonLeads} won lead${wonLeads === 1 ? "" : "s"} — convert into client delivery projects`
      )
    }

    if (openPipeline > 0) {
      opportunities.push(
        `Open pipeline value AUD ${openPipeline.toLocaleString("en-AU")} — advance active deals`
      )
    }

    const recentlyPaidInvoices = invoices.filter((invoice) => {
      if (invoice.status !== "paid" || !invoice.paidDate) {
        return false
      }

      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
      return invoice.paidDate.getTime() >= thirtyDaysAgo
    })

    if (recentlyPaidInvoices.length > 0) {
      opportunities.push(
        `${recentlyPaidInvoices.length} recent paid invoice${recentlyPaidInvoices.length === 1 ? "" : "s"} — consider upsell proposals`
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
          publishedArticles,
          drafts,
          reviewRequired,
          scheduled,
        },
        growth: {
          totalSubscribers,
          activeSubscribers,
          monthlySubscribers,
          growthRate,
          leadMagnetSubscribers,
          topLeadMagnet,
        },
        crm: {
          totalLeads,
          hotLeads,
          wonLeads,
          proposalReadyLeads,
        },
        revenue: {
          totalPipelineValue,
          wonRevenue,
          openPipeline,
          totalInvoiced,
          totalPaid,
          outstandingRevenue,
        },
        delivery: {
          activeClients,
          activeProjects,
          openTasks,
          doneTasks,
          overdueTasks,
          totalProjectValue,
          deliveryHealthScore,
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
