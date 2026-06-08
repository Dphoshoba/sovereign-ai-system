import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const ALLOWED_ACTION_TYPES = [
  "open-page",
  "create-follow-up-task",
  "mark-project-completed",
  "mark-invoice-overdue",
  "mark-lead-contacted",
] as const

type ActionType = (typeof ALLOWED_ACTION_TYPES)[number]

function isAllowedAdminUrl(url: unknown): url is string {
  return typeof url === "string" && url.startsWith("/admin/")
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const actionType = body.actionType?.trim() as ActionType
    const payload = body.payload ?? {}

    if (!actionType || !ALLOWED_ACTION_TYPES.includes(actionType)) {
      return NextResponse.json(
        {
          ok: false,
          error: `actionType must be one of: ${ALLOWED_ACTION_TYPES.join(", ")}`,
        },
        { status: 400 }
      )
    }

    if (actionType === "open-page") {
      const url = payload.url

      if (!isAllowedAdminUrl(url)) {
        return NextResponse.json(
          {
            ok: false,
            error: "payload.url must be an internal admin path starting with /admin/",
          },
          { status: 400 }
        )
      }

      return NextResponse.json({
        ok: true,
        actionType,
        redirectTo: url,
        message: `Opening ${url}`,
        result: { url },
      })
    }

    if (actionType === "create-follow-up-task") {
      const projectId = payload.projectId?.trim()
      const title = payload.title?.trim()
      const description = payload.description?.trim() || null
      const priority = payload.priority?.trim() || "high"

      if (!projectId || !title) {
        return NextResponse.json(
          {
            ok: false,
            error: "payload.projectId and payload.title are required",
          },
          { status: 400 }
        )
      }

      const project = await prisma.clientProject.findUnique({
        where: { id: projectId },
      })

      if (!project) {
        return NextResponse.json(
          { ok: false, error: "Project not found" },
          { status: 404 }
        )
      }

      const task = await prisma.clientProjectTask.create({
        data: {
          projectId,
          title,
          description,
          priority,
          status: "todo",
        },
      })

      return NextResponse.json({
        ok: true,
        actionType,
        message: "Follow-up task created.",
        result: { task },
      })
    }

    if (actionType === "mark-project-completed") {
      const projectId = payload.projectId?.trim()

      if (!projectId) {
        return NextResponse.json(
          { ok: false, error: "payload.projectId is required" },
          { status: 400 }
        )
      }

      const project = await prisma.clientProject.findUnique({
        where: { id: projectId },
      })

      if (!project) {
        return NextResponse.json(
          { ok: false, error: "Project not found" },
          { status: 404 }
        )
      }

      const openTasks = await prisma.clientProjectTask.count({
        where: {
          projectId,
          status: {
            not: "done",
          },
        },
      })

      if (openTasks > 0) {
        return NextResponse.json(
          {
            ok: false,
            error: `Project still has ${openTasks} open task${openTasks === 1 ? "" : "s"}. Complete all tasks before marking completed.`,
          },
          { status: 400 }
        )
      }

      const updatedProject = await prisma.clientProject.update({
        where: { id: projectId },
        data: { status: "completed" },
      })

      return NextResponse.json({
        ok: true,
        actionType,
        message: `Project "${updatedProject.title}" marked as completed.`,
        result: { project: updatedProject },
      })
    }

    if (actionType === "mark-invoice-overdue") {
      const invoiceId = payload.invoiceId?.trim()

      if (!invoiceId) {
        return NextResponse.json(
          { ok: false, error: "payload.invoiceId is required" },
          { status: 400 }
        )
      }

      const invoice = await prisma.clientInvoice.findUnique({
        where: { id: invoiceId },
      })

      if (!invoice) {
        return NextResponse.json(
          { ok: false, error: "Invoice not found" },
          { status: 404 }
        )
      }

      if (invoice.status === "paid") {
        return NextResponse.json(
          { ok: false, error: "Paid invoices cannot be marked overdue." },
          { status: 400 }
        )
      }

      const updatedInvoice = await prisma.clientInvoice.update({
        where: { id: invoiceId },
        data: { status: "overdue" },
      })

      return NextResponse.json({
        ok: true,
        actionType,
        message: `Invoice ${updatedInvoice.invoiceNumber} marked as overdue.`,
        result: { invoice: updatedInvoice },
      })
    }

    if (actionType === "mark-lead-contacted") {
      const leadId = payload.leadId?.trim()

      if (!leadId) {
        return NextResponse.json(
          { ok: false, error: "payload.leadId is required" },
          { status: 400 }
        )
      }

      const lead = await prisma.creatorLead.findUnique({
        where: { id: leadId },
      })

      if (!lead) {
        return NextResponse.json(
          { ok: false, error: "Lead not found" },
          { status: 404 }
        )
      }

      const updatedLead = await prisma.creatorLead.update({
        where: { id: leadId },
        data: { status: "contacted" },
      })

      return NextResponse.json({
        ok: true,
        actionType,
        message: `Lead "${updatedLead.name}" marked as contacted.`,
        result: { lead: updatedLead },
      })
    }

    return NextResponse.json(
      { ok: false, error: "Unsupported action type" },
      { status: 400 }
    )
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Executive action failed",
      },
      { status: 500 }
    )
  }
}
