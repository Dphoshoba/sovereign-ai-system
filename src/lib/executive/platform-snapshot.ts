import { prisma } from "@/lib/prisma"

export const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

export function isOverdueTask(task: {
  dueDate: Date | null
  status: string
}) {
  if (!task.dueDate || task.status === "done") {
    return false
  }

  return task.dueDate.getTime() < Date.now()
}

export function isOverdueInvoice(invoice: {
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

export function getProjectProgress(
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

export function isAtRiskProject(project: {
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

export function isDueWithinSevenDays(project: {
  status: string
  dueDate: Date | null
}) {
  if (project.status !== "active" || !project.dueDate) {
    return false
  }

  return project.dueDate.getTime() <= Date.now() + SEVEN_DAYS_MS
}

export function computeDeliveryHealthScore(
  overdueTasks: number,
  overdueInvoices: number,
  atRiskProjects: number
) {
  return Math.max(
    0,
    100 - overdueTasks * 10 - overdueInvoices * 15 - atRiskProjects * 20
  )
}

export type ProjectWithProgress = {
  id: string
  title: string
  status: string
  dueDate: Date | null
  progressPercent: number
}

export type ExecutivePlatformSnapshot = {
  reviewRequiredArticles: { id: string; title: string }[]
  draftArticles: { id: string; title: string }[]
  scheduledCount: number
  publishedArticles: number
  draftCount: number
  reviewRequiredCount: number
  totalSubscribers: number
  activeSubscribers: number
  monthlySubscribers: number
  growthRate: number
  leadMagnetSubscribers: number
  topLeadMagnet: string | null
  leadMagnetCount: number
  blogCtaSubscribers: number
  totalLeads: number
  hotLeads: { id: string; name: string; email: string; leadScore: number }[]
  wonLeads: number
  proposalReadyLeads: {
    id: string
    name: string
    email: string
    projectedValue: number | null
  }[]
  totalPipelineValue: number
  wonRevenue: number
  openPipeline: number
  totalInvoiced: number
  totalPaid: number
  outstandingRevenue: number
  activeClients: number
  activeProjects: number
  openTasks: number
  doneTasks: number
  overdueTasks: number
  overdueTaskItems: { id: string; title: string; projectId: string }[]
  totalProjectValue: number
  deliveryHealthScore: number
  overdueInvoices: number
  overdueInvoiceItems: {
    id: string
    invoiceNumber: string
    amountAud: number
  }[]
  atRiskProjects: ProjectWithProgress[]
  dueSoonProjects: ProjectWithProgress[]
  readyToCompleteProjects: ProjectWithProgress[]
  recentlyPaidInvoiceCount: number
}

export async function getExecutivePlatformSnapshot(): Promise<ExecutivePlatformSnapshot> {
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

  const reviewRequiredArticles = articles
    .filter((article) => article.status === "review-required")
    .map((article) => ({ id: article.id, title: article.title }))

  const draftArticles = articles
    .filter((article) => article.status === "draft")
    .map((article) => ({ id: article.id, title: article.title }))

  const scheduledCount = articles.filter(
    (article) => article.status === "scheduled"
  ).length

  const publishedArticles = articles.filter(
    (article) => article.status === "published"
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

  const blogCtaSubscribers = subscribers.filter(
    (subscriber) =>
      subscriber.source === "blog-cta" ||
      subscriber.source?.includes("blog-cta") === true
  ).length

  const hotLeads = leads
    .filter(
      (lead) =>
        lead.leadScore >= 75 || ["ready", "urgent"].includes(lead.readiness)
    )
    .map((lead) => ({
      id: lead.id,
      name: lead.name,
      email: lead.email,
      leadScore: lead.leadScore,
    }))

  const proposalReadyLeads = leads
    .filter((lead) => lead.status === "proposal-ready")
    .map((lead) => ({
      id: lead.id,
      name: lead.name,
      email: lead.email,
      projectedValue: lead.projectedValue,
    }))

  const openPipeline = leads
    .filter((lead) =>
      ["new", "contacted", "proposal-ready", "proposal-sent"].includes(
        lead.status || ""
      )
    )
    .reduce((sum, lead) => sum + (lead.projectedValue || 0), 0)

  const outstandingRevenue = invoices
    .filter((invoice) => ["sent", "overdue"].includes(invoice.status))
    .reduce((sum, invoice) => sum + invoice.amountAud, 0)

  const visibleProjectIds = new Set(projects.map((project) => project.id))
  const visibleTasks = tasks.filter((task) =>
    visibleProjectIds.has(task.projectId)
  )

  const overdueTaskItems = visibleTasks
    .filter((task) => isOverdueTask(task))
    .map((task) => ({
      id: task.id,
      title: task.title,
      projectId: task.projectId,
    }))

  const overdueInvoiceItems = invoices
    .filter((invoice) => isOverdueInvoice(invoice))
    .map((invoice) => ({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      amountAud: invoice.amountAud,
    }))

  const projectsWithProgress: ProjectWithProgress[] = projects.map(
    (project) => ({
      id: project.id,
      title: project.title,
      status: project.status,
      dueDate: project.dueDate,
      progressPercent: getProjectProgress(project.id, visibleTasks),
    })
  )

  const atRiskProjects = projectsWithProgress.filter((project) =>
    isAtRiskProject(project)
  )

  const dueSoonProjects = projectsWithProgress.filter((project) =>
    isDueWithinSevenDays(project)
  )

  const readyToCompleteProjects = projectsWithProgress.filter(
    (project) =>
      project.status === "active" &&
      project.progressPercent === 100
  )

  const recentlyPaidInvoiceCount = invoices.filter((invoice) => {
    if (invoice.status !== "paid" || !invoice.paidDate) {
      return false
    }

    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
    return invoice.paidDate.getTime() >= thirtyDaysAgo
  }).length

  const overdueTasks = overdueTaskItems.length
  const overdueInvoices = overdueInvoiceItems.length
  const deliveryHealthScore = computeDeliveryHealthScore(
    overdueTasks,
    overdueInvoices,
    atRiskProjects.length
  )

  return {
    reviewRequiredArticles,
    draftArticles,
    scheduledCount,
    publishedArticles,
    draftCount: draftArticles.length,
    reviewRequiredCount: reviewRequiredArticles.length,
    totalSubscribers,
    activeSubscribers,
    monthlySubscribers,
    growthRate,
    leadMagnetSubscribers,
    topLeadMagnet,
    leadMagnetCount: leadMagnets.length,
    blogCtaSubscribers,
    totalLeads: leads.length,
    hotLeads,
    wonLeads: leads.filter((lead) => lead.status === "won").length,
    proposalReadyLeads,
    totalPipelineValue: leads.reduce(
      (sum, lead) => sum + (lead.projectedValue || 0),
      0
    ),
    wonRevenue: leads
      .filter((lead) => lead.status === "won")
      .reduce((sum, lead) => sum + (lead.projectedValue || 0), 0),
    openPipeline,
    totalInvoiced: invoices
      .filter((invoice) => invoice.status !== "draft")
      .reduce((sum, invoice) => sum + invoice.amountAud, 0),
    totalPaid: invoices
      .filter((invoice) => invoice.status === "paid")
      .reduce((sum, invoice) => sum + invoice.amountAud, 0),
    outstandingRevenue,
    activeClients: clients.filter((client) => client.status === "active").length,
    activeProjects: projects.filter((project) => project.status === "active")
      .length,
    openTasks: visibleTasks.filter((task) => task.status !== "done").length,
    doneTasks: visibleTasks.filter((task) => task.status === "done").length,
    overdueTasks,
    overdueTaskItems,
    totalProjectValue: projects.reduce(
      (sum, project) => sum + (project.valueAud || 0),
      0
    ),
    deliveryHealthScore,
    overdueInvoices,
    overdueInvoiceItems,
    atRiskProjects,
    dueSoonProjects,
    readyToCompleteProjects,
    recentlyPaidInvoiceCount,
  }
}
