import {
  getBusinessSnapshot,
  type BusinessSnapshot,
} from "@/lib/business/business-data-layer"
import { prisma } from "@/lib/prisma"

// Phase 29.2 — Executive Business Memory.
// Converts real business activity (clients, projects, tasks, invoices, leads,
// proposals) into a deterministic executive memory event stream. No OpenAI.
// Production safe: limited direct queries + the unified business data layer.

export type BusinessMemoryEventType =
  | "invoice_issued"
  | "invoice_paid"
  | "invoice_overdue"
  | "project_started"
  | "project_completed"
  | "project_overdue"
  | "lead_created"
  | "lead_qualified"
  | "lead_converted"
  | "proposal_sent"
  | "proposal_accepted"
  | "task_completed"
  | "task_overdue"

export type BusinessMemoryEventSeverity = "positive" | "info" | "warning"

export type BusinessMemoryEvent = {
  id: string
  type: BusinessMemoryEventType
  title: string
  summary: string
  severity: BusinessMemoryEventSeverity
  entityType: string
  entityId: string
  createdAt: string
}

export type BusinessMemory = {
  totalEvents: number
  businessHealth: number
  eventCounts: Record<BusinessMemoryEventType, number>
  recentEvents: BusinessMemoryEvent[]
  generatedAt: string
}

const QUERY_LIMIT = 100
const RECENT_EVENT_LIMIT = 25

const COMPLETED_PROJECT_STATUSES = new Set(["completed", "done"])
const COMPLETED_TASK_STATUSES = new Set(["done", "completed"])
const ACCEPTED_PROPOSAL_STATUSES = new Set(["accepted", "approved", "won"])
const SENT_PROPOSAL_STATUSES = new Set(["sent", "accepted", "approved", "won"])

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function emptyEventCounts(): Record<BusinessMemoryEventType, number> {
  return {
    invoice_issued: 0,
    invoice_paid: 0,
    invoice_overdue: 0,
    project_started: 0,
    project_completed: 0,
    project_overdue: 0,
    lead_created: 0,
    lead_qualified: 0,
    lead_converted: 0,
    proposal_sent: 0,
    proposal_accepted: 0,
    task_completed: 0,
    task_overdue: 0,
  }
}

/** Business health 0-100 from the unified business snapshot. */
function calculateBusinessHealth(snapshot: BusinessSnapshot) {
  const positive =
    Math.min(snapshot.invoices.paid * 4, 12) +
    Math.min(snapshot.projects.completed * 4, 12) +
    Math.min(snapshot.tasks.completed * 2, 10) +
    Math.min(snapshot.leads.qualified * 3, 9) +
    (snapshot.revenue.collectionRate >= 70 ? 7 : 0)

  const negative =
    snapshot.projects.overdue * 6 +
    snapshot.invoices.overdue * 8 +
    Math.min(Math.max(0, snapshot.tasks.open - 10) * 2, 14) +
    (snapshot.revenue.collectionRate < 50 &&
    snapshot.revenue.totalInvoicedAud > 0
      ? 8
      : 0)

  return Math.round(clamp(50 + positive - negative, 0, 100))
}

/** Best-effort daily snapshot persistence — never fails the caller. */
async function storeBusinessMemorySnapshot(memory: BusinessMemory) {
  try {
    const today = new Date().toISOString().slice(0, 10)
    const title = `Business Memory Snapshot ${today}`

    const content = JSON.stringify({
      businessHealth: memory.businessHealth,
      totalEvents: memory.totalEvents,
      eventCounts: memory.eventCounts,
    })

    const existing = await prisma.aiMemory.findFirst({
      where: { type: "business-memory-snapshot", title },
    })

    if (existing) {
      await prisma.aiMemory.update({
        where: { id: existing.id },
        data: { content },
      })
    } else {
      await prisma.aiMemory.create({
        data: {
          type: "business-memory-snapshot",
          title,
          content,
          source: "business-memory",
          tags: "executive,business,memory,snapshot",
        },
      })
    }
  } catch (error) {
    console.error("Failed to store business memory snapshot:", error)
  }
}

export async function buildBusinessMemory(options?: {
  /** Reuse an already-fetched snapshot to avoid duplicate queries. */
  snapshot?: BusinessSnapshot
}): Promise<BusinessMemory> {
  const now = new Date()

  // Aggregates from the unified business data layer; raw rows for events.
  const snapshot = options?.snapshot ?? (await getBusinessSnapshot())

  const [projects, tasks, invoices, leads, proposals] = await Promise.all([
    prisma.clientProject.findMany({
      orderBy: { createdAt: "desc" },
      take: QUERY_LIMIT,
      select: {
        id: true,
        title: true,
        status: true,
        startDate: true,
        dueDate: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.clientProjectTask.findMany({
      orderBy: { createdAt: "desc" },
      take: QUERY_LIMIT,
      select: {
        id: true,
        title: true,
        status: true,
        dueDate: true,
        updatedAt: true,
      },
    }),
    prisma.clientInvoice.findMany({
      orderBy: { createdAt: "desc" },
      take: QUERY_LIMIT,
      select: {
        id: true,
        invoiceNumber: true,
        amountAud: true,
        status: true,
        dueDate: true,
        paidDate: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.creatorLead.findMany({
      orderBy: { createdAt: "desc" },
      take: QUERY_LIMIT,
      select: {
        id: true,
        name: true,
        status: true,
        leadScore: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.creatorProposal.findMany({
      orderBy: { createdAt: "desc" },
      take: QUERY_LIMIT,
      select: {
        id: true,
        title: true,
        status: true,
        estimatedValue: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
  ])

  const events: BusinessMemoryEvent[] = []

  const addEvent = (
    type: BusinessMemoryEventType,
    severity: BusinessMemoryEventSeverity,
    entityType: string,
    entityId: string,
    title: string,
    summary: string,
    createdAt: Date
  ) => {
    events.push({
      id: `${type}-${entityId}`,
      type,
      title,
      summary,
      severity,
      entityType,
      entityId,
      createdAt: createdAt.toISOString(),
    })
  }

  // Invoices.
  for (const invoice of invoices) {
    addEvent(
      "invoice_issued",
      "info",
      "client_invoice",
      invoice.id,
      `Invoice ${invoice.invoiceNumber} issued`,
      `Invoice for $${invoice.amountAud.toLocaleString()} AUD created.`,
      invoice.createdAt
    )

    if (invoice.status === "paid") {
      addEvent(
        "invoice_paid",
        "positive",
        "client_invoice",
        invoice.id,
        `Invoice ${invoice.invoiceNumber} paid`,
        `Collected $${invoice.amountAud.toLocaleString()} AUD.`,
        invoice.paidDate ?? invoice.updatedAt
      )
    } else if (invoice.dueDate !== null && invoice.dueDate < now) {
      addEvent(
        "invoice_overdue",
        "warning",
        "client_invoice",
        invoice.id,
        `Invoice ${invoice.invoiceNumber} overdue`,
        `$${invoice.amountAud.toLocaleString()} AUD outstanding past due date.`,
        invoice.dueDate
      )
    }
  }

  // Projects.
  for (const project of projects) {
    addEvent(
      "project_started",
      "info",
      "client_project",
      project.id,
      `Project started: ${project.title}`,
      `Client project "${project.title}" opened.`,
      project.startDate ?? project.createdAt
    )

    if (COMPLETED_PROJECT_STATUSES.has(project.status)) {
      addEvent(
        "project_completed",
        "positive",
        "client_project",
        project.id,
        `Project completed: ${project.title}`,
        `Delivery finished for "${project.title}".`,
        project.updatedAt
      )
    } else if (project.dueDate !== null && project.dueDate < now) {
      addEvent(
        "project_overdue",
        "warning",
        "client_project",
        project.id,
        `Project overdue: ${project.title}`,
        `"${project.title}" passed its due date while still ${project.status}.`,
        project.dueDate
      )
    }
  }

  // Leads.
  for (const lead of leads) {
    addEvent(
      "lead_created",
      "info",
      "creator_lead",
      lead.id,
      `Lead created: ${lead.name}`,
      `New lead captured (score ${lead.leadScore}/100).`,
      lead.createdAt
    )

    if (lead.status === "qualified") {
      addEvent(
        "lead_qualified",
        "positive",
        "creator_lead",
        lead.id,
        `Lead qualified: ${lead.name}`,
        `Lead qualified at score ${lead.leadScore}/100.`,
        lead.updatedAt
      )
    } else if (lead.status === "converted") {
      addEvent(
        "lead_converted",
        "positive",
        "creator_lead",
        lead.id,
        `Lead converted: ${lead.name}`,
        `Lead converted into client work.`,
        lead.updatedAt
      )
    }
  }

  // Proposals.
  for (const proposal of proposals) {
    if (SENT_PROPOSAL_STATUSES.has(proposal.status)) {
      addEvent(
        "proposal_sent",
        "info",
        "creator_proposal",
        proposal.id,
        `Proposal sent: ${proposal.title}`,
        proposal.estimatedValue
          ? `Proposal worth $${proposal.estimatedValue.toLocaleString()} AUD sent.`
          : `Proposal "${proposal.title}" sent.`,
        proposal.createdAt
      )
    }

    if (ACCEPTED_PROPOSAL_STATUSES.has(proposal.status)) {
      addEvent(
        "proposal_accepted",
        "positive",
        "creator_proposal",
        proposal.id,
        `Proposal accepted: ${proposal.title}`,
        proposal.estimatedValue
          ? `Client accepted $${proposal.estimatedValue.toLocaleString()} AUD proposal.`
          : `Proposal "${proposal.title}" accepted.`,
        proposal.updatedAt
      )
    }
  }

  // Tasks.
  for (const task of tasks) {
    if (COMPLETED_TASK_STATUSES.has(task.status)) {
      addEvent(
        "task_completed",
        "positive",
        "client_project_task",
        task.id,
        `Task completed: ${task.title}`,
        `Delivery task "${task.title}" done.`,
        task.updatedAt
      )
    } else if (task.dueDate !== null && task.dueDate < now) {
      addEvent(
        "task_overdue",
        "warning",
        "client_project_task",
        task.id,
        `Task overdue: ${task.title}`,
        `"${task.title}" passed its due date while still ${task.status}.`,
        task.dueDate
      )
    }
  }

  // Aggregate.
  const eventCounts = emptyEventCounts()

  for (const event of events) {
    eventCounts[event.type] += 1
  }

  events.sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const memory: BusinessMemory = {
    totalEvents: events.length,
    businessHealth: calculateBusinessHealth(snapshot),
    eventCounts,
    recentEvents: events.slice(0, RECENT_EVENT_LIMIT),
    generatedAt: now.toISOString(),
  }

  // Fire-and-forget: persistence never blocks or fails the response.
  void storeBusinessMemorySnapshot(memory)

  return memory
}
