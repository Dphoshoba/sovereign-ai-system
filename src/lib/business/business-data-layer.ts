import { prisma } from "@/lib/prisma"

// Phase 29.1 — Unified Business Data Layer.
// Single source of truth for operational business data. Direct, limited
// Prisma queries only — lightweight and production/serverless safe.

export type BusinessClientsSummary = {
  total: number
  active: number
  leads: number
  recent: { id: string; name: string; type: string; status: string }[]
}

export type BusinessProjectsSummary = {
  total: number
  active: number
  completed: number
  overdue: number
  totalValueAud: number
  recent: {
    id: string
    title: string
    status: string
    valueAud: number | null
    dueDate: string | null
  }[]
}

export type BusinessTasksSummary = {
  total: number
  open: number
  inProgress: number
  completed: number
  overdue: number
  highPriority: number
}

export type BusinessInvoicesSummary = {
  total: number
  paid: number
  unpaid: number
  overdue: number
  totalInvoicedAud: number
  totalPaidAud: number
  outstandingAud: number
}

export type BusinessLeadsSummary = {
  total: number
  new: number
  qualified: number
  highValue: number
  averageLeadScore: number
  projectedValueAud: number
}

export type BusinessProposalsSummary = {
  total: number
  draft: number
  sent: number
  accepted: number
  pipelineValueAud: number
}

export type BusinessRevenueSummary = {
  totalInvoicedAud: number
  totalPaidAud: number
  outstandingAud: number
  collectionRate: number
  pipelineValueAud: number
}

export type BusinessOperationsSummary = {
  activeProjects: number
  openTasks: number
  overdueTasks: number
  overdueInvoices: number
  unconvertedHighValueLeads: number
  operationalLoad: number
}

export type BusinessSnapshot = {
  clients: BusinessClientsSummary
  projects: BusinessProjectsSummary
  tasks: BusinessTasksSummary
  invoices: BusinessInvoicesSummary
  leads: BusinessLeadsSummary
  proposals: BusinessProposalsSummary
  revenue: BusinessRevenueSummary
  operations: BusinessOperationsSummary
  generatedAt: string
}

const QUERY_LIMIT = 100
const RECENT_LIMIT = 5
const HIGH_VALUE_LEAD_SCORE = 80

const COMPLETED_PROJECT_STATUSES = new Set(["completed", "done"])
const COMPLETED_TASK_STATUSES = new Set(["done", "completed"])
const IN_PROGRESS_TASK_STATUSES = new Set(["in_progress", "doing"])
const ACCEPTED_PROPOSAL_STATUSES = new Set(["accepted", "approved", "won"])

function sum(values: (number | null | undefined)[]) {
  return Math.round(
    values.reduce<number>((total, value) => total + (value ?? 0), 0) * 100
  ) / 100
}

export async function getBusinessSnapshot(): Promise<BusinessSnapshot> {
  const now = new Date()

  const [clients, projects, tasks, invoices, leads, proposals] =
    await Promise.all([
      prisma.clientProfile.findMany({
        orderBy: { createdAt: "desc" },
        take: QUERY_LIMIT,
        select: { id: true, name: true, type: true, status: true },
      }),
      prisma.clientProject.findMany({
        orderBy: { createdAt: "desc" },
        take: QUERY_LIMIT,
        select: {
          id: true,
          title: true,
          status: true,
          valueAud: true,
          dueDate: true,
        },
      }),
      prisma.clientProjectTask.findMany({
        orderBy: { createdAt: "desc" },
        take: QUERY_LIMIT,
        select: { status: true, priority: true, dueDate: true },
      }),
      prisma.clientInvoice.findMany({
        orderBy: { createdAt: "desc" },
        take: QUERY_LIMIT,
        select: {
          status: true,
          amountAud: true,
          dueDate: true,
          paidDate: true,
        },
      }),
      prisma.creatorLead.findMany({
        orderBy: { createdAt: "desc" },
        take: QUERY_LIMIT,
        select: {
          status: true,
          leadScore: true,
          projectedValue: true,
        },
      }),
      prisma.creatorProposal.findMany({
        orderBy: { createdAt: "desc" },
        take: QUERY_LIMIT,
        select: { status: true, estimatedValue: true },
      }),
    ])

  // Clients.
  const clientsSummary: BusinessClientsSummary = {
    total: clients.length,
    active: clients.filter((client) => client.status === "active").length,
    leads: clients.filter((client) => client.type === "lead").length,
    recent: clients.slice(0, RECENT_LIMIT),
  }

  // Projects.
  const overdueProjects = projects.filter(
    (project) =>
      !COMPLETED_PROJECT_STATUSES.has(project.status) &&
      project.dueDate !== null &&
      project.dueDate < now
  )

  const projectsSummary: BusinessProjectsSummary = {
    total: projects.length,
    active: projects.filter((project) => project.status === "active").length,
    completed: projects.filter((project) =>
      COMPLETED_PROJECT_STATUSES.has(project.status)
    ).length,
    overdue: overdueProjects.length,
    totalValueAud: sum(projects.map((project) => project.valueAud)),
    recent: projects.slice(0, RECENT_LIMIT).map((project) => ({
      id: project.id,
      title: project.title,
      status: project.status,
      valueAud: project.valueAud,
      dueDate: project.dueDate?.toISOString() ?? null,
    })),
  }

  // Tasks.
  const completedTasks = tasks.filter((task) =>
    COMPLETED_TASK_STATUSES.has(task.status)
  )
  const overdueTasks = tasks.filter(
    (task) =>
      !COMPLETED_TASK_STATUSES.has(task.status) &&
      task.dueDate !== null &&
      task.dueDate < now
  )

  const tasksSummary: BusinessTasksSummary = {
    total: tasks.length,
    open: tasks.length - completedTasks.length,
    inProgress: tasks.filter((task) =>
      IN_PROGRESS_TASK_STATUSES.has(task.status)
    ).length,
    completed: completedTasks.length,
    overdue: overdueTasks.length,
    highPriority: tasks.filter(
      (task) =>
        !COMPLETED_TASK_STATUSES.has(task.status) &&
        (task.priority === "high" || task.priority === "urgent")
    ).length,
  }

  // Invoices.
  const paidInvoices = invoices.filter((invoice) => invoice.status === "paid")
  const unpaidInvoices = invoices.filter(
    (invoice) => invoice.status !== "paid"
  )
  const overdueInvoices = unpaidInvoices.filter(
    (invoice) => invoice.dueDate !== null && invoice.dueDate < now
  )

  const totalInvoicedAud = sum(invoices.map((invoice) => invoice.amountAud))
  const totalPaidAud = sum(paidInvoices.map((invoice) => invoice.amountAud))
  const outstandingAud = sum(unpaidInvoices.map((invoice) => invoice.amountAud))

  const invoicesSummary: BusinessInvoicesSummary = {
    total: invoices.length,
    paid: paidInvoices.length,
    unpaid: unpaidInvoices.length,
    overdue: overdueInvoices.length,
    totalInvoicedAud,
    totalPaidAud,
    outstandingAud,
  }

  // Leads.
  const highValueLeads = leads.filter(
    (lead) => lead.leadScore >= HIGH_VALUE_LEAD_SCORE
  )

  const leadsSummary: BusinessLeadsSummary = {
    total: leads.length,
    new: leads.filter((lead) => lead.status === "new").length,
    qualified: leads.filter((lead) => lead.status === "qualified").length,
    highValue: highValueLeads.length,
    averageLeadScore:
      leads.length > 0
        ? Math.round(
            leads.reduce((total, lead) => total + lead.leadScore, 0) /
              leads.length
          )
        : 0,
    projectedValueAud: sum(leads.map((lead) => lead.projectedValue)),
  }

  // Proposals.
  const proposalsSummary: BusinessProposalsSummary = {
    total: proposals.length,
    draft: proposals.filter((proposal) => proposal.status === "draft").length,
    sent: proposals.filter((proposal) => proposal.status === "sent").length,
    accepted: proposals.filter((proposal) =>
      ACCEPTED_PROPOSAL_STATUSES.has(proposal.status)
    ).length,
    pipelineValueAud: sum(
      proposals
        .filter((proposal) => !ACCEPTED_PROPOSAL_STATUSES.has(proposal.status))
        .map((proposal) => proposal.estimatedValue)
    ),
  }

  // Revenue.
  const revenueSummary: BusinessRevenueSummary = {
    totalInvoicedAud,
    totalPaidAud,
    outstandingAud,
    collectionRate:
      totalInvoicedAud > 0
        ? Math.round((totalPaidAud / totalInvoicedAud) * 100)
        : 0,
    pipelineValueAud: proposalsSummary.pipelineValueAud,
  }

  // Operations — cross-cutting load indicators.
  const operationsSummary: BusinessOperationsSummary = {
    activeProjects: projectsSummary.active,
    openTasks: tasksSummary.open,
    overdueTasks: tasksSummary.overdue,
    overdueInvoices: invoicesSummary.overdue,
    unconvertedHighValueLeads: highValueLeads.filter(
      (lead) => lead.status !== "converted"
    ).length,
    // 0-100: how much of current capacity is consumed by open work.
    operationalLoad: Math.min(
      100,
      projectsSummary.active * 10 +
        tasksSummary.open * 3 +
        tasksSummary.overdue * 5
    ),
  }

  return {
    clients: clientsSummary,
    projects: projectsSummary,
    tasks: tasksSummary,
    invoices: invoicesSummary,
    leads: leadsSummary,
    proposals: proposalsSummary,
    revenue: revenueSummary,
    operations: operationsSummary,
    generatedAt: now.toISOString(),
  }
}
