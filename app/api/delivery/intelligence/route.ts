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

export async function GET() {
  try {
    const [clients, projects, tasks, invoices] = await Promise.all([
      prisma.clientProfile.findMany({
        where: { type: "client" },
      }),
      prisma.clientProject.findMany({
        where: {
          status: {
            not: "archived",
          },
        },
      }),
      prisma.clientProjectTask.findMany(),
      prisma.clientInvoice.findMany(),
    ])

    const clientMap = Object.fromEntries(
      clients.map((client) => [client.id, client])
    )

    const visibleProjectIds = new Set(projects.map((project) => project.id))
    const visibleTasks = tasks.filter((task) =>
      visibleProjectIds.has(task.projectId)
    )

    const activeProjects = projects.filter(
      (project) => project.status === "active"
    ).length

    const completedProjects = projects.filter(
      (project) => project.status === "completed"
    ).length

    const overdueTaskItems = visibleTasks.filter((task) => isOverdueTask(task))
    const overdueTasks = overdueTaskItems.length

    const overdueInvoiceItems = invoices.filter((invoice) =>
      isOverdueInvoice(invoice)
    )
    const overdueInvoices = overdueInvoiceItems.length

    const projectsWithProgress = projects.map((project) => ({
      ...project,
      clientName: clientMap[project.clientId]?.name || "Unknown client",
      progressPercent: getProjectProgress(project.id, visibleTasks),
    }))

    const atRiskProjectItems = projectsWithProgress.filter((project) =>
      isAtRiskProject(project)
    )
    const atRiskProjects = atRiskProjectItems.length

    const totalRevenueOutstanding = invoices
      .filter((invoice) => ["sent", "overdue"].includes(invoice.status))
      .reduce((sum, invoice) => sum + invoice.amountAud, 0)

    const healthScore = Math.max(
      0,
      100 -
        overdueTasks * 10 -
        overdueInvoices * 15 -
        atRiskProjects * 20
    )

    const recommendations: string[] = []

    for (const invoice of overdueInvoiceItems) {
      recommendations.push(
        `Follow up overdue invoice ${invoice.invoiceNumber}`
      )
    }

    for (const project of atRiskProjectItems) {
      recommendations.push(
        `Project ${project.title} is due soon but only ${project.progressPercent}% complete`
      )
    }

    if (overdueTasks > 0) {
      recommendations.push(
        `Review ${overdueTasks} overdue task${overdueTasks === 1 ? "" : "s"} across active projects`
      )
    }

    const alerts: string[] = []

    for (const invoice of overdueInvoiceItems) {
      alerts.push(
        `Overdue invoice ${invoice.invoiceNumber} for ${formatAud(invoice.amountAud)}`
      )
    }

    for (const project of atRiskProjectItems) {
      alerts.push(
        `At-risk project: ${project.title} (${project.progressPercent}% complete, due ${formatDate(project.dueDate)})`
      )
    }

    if (overdueTasks >= 3) {
      alerts.push(
        `${overdueTasks} delivery tasks are overdue and need immediate attention`
      )
    }

    const opportunities: string[] = []

    for (const project of projectsWithProgress.filter(
      (project) => project.status === "completed"
    )) {
      opportunities.push(
        `Client ${project.clientName} has completed project and may be ready for a follow-up engagement`
      )
    }

    const recentlyPaidInvoices = invoices.filter((invoice) => {
      if (invoice.status !== "paid" || !invoice.paidDate) {
        return false
      }

      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
      return invoice.paidDate.getTime() >= thirtyDaysAgo
    })

    for (const invoice of recentlyPaidInvoices) {
      const clientName =
        clientMap[invoice.clientId]?.name || "Client"
      opportunities.push(
        `${clientName}: invoice ${invoice.invoiceNumber} paid, consider upsell proposal`
      )
    }

    if (opportunities.length === 0 && activeProjects > 0) {
      opportunities.push(
        "Active delivery pipeline is healthy — review upsell opportunities with engaged clients"
      )
    }

    return NextResponse.json({
      ok: true,
      intelligence: {
        healthScore,
        activeProjects,
        completedProjects,
        overdueTasks,
        overdueInvoices,
        atRiskProjects,
        totalRevenueOutstanding,
        recommendations,
        alerts,
        opportunities,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Delivery intelligence failed",
      },
      { status: 500 }
    )
  }
}

function formatAud(value: number) {
  return `AUD ${value.toLocaleString("en-AU")}`
}

function formatDate(value: Date | null) {
  if (!value) {
    return "not set"
  }

  return value.toLocaleDateString("en-AU")
}
