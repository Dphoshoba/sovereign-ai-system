import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const INVOICE_STATUSES = ["draft", "sent", "paid", "overdue"] as const

async function enrichInvoice(invoice: {
  clientId: string
  projectId: string | null
  [key: string]: unknown
}) {
  const [client, project] = await Promise.all([
    prisma.clientProfile.findUnique({
      where: { id: invoice.clientId },
    }),
    invoice.projectId
      ? prisma.clientProject.findUnique({
          where: { id: invoice.projectId },
        })
      : Promise.resolve(null),
  ])

  return {
    ...invoice,
    client,
    project,
  }
}

export async function GET() {
  try {
    const invoices = await prisma.clientInvoice.findMany({
      orderBy: {
        createdAt: "desc",
      },
    })

    const invoicesWithRelations = await Promise.all(
      invoices.map((invoice) => enrichInvoice(invoice))
    )

    return NextResponse.json({
      ok: true,
      invoices: invoicesWithRelations,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch client invoices",
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const clientId = body.clientId?.trim()
    const projectId = body.projectId?.trim() || null
    const invoiceNumber = body.invoiceNumber?.trim()
    const amountAud = Number(body.amountAud)
    const dueDate = body.dueDate ? new Date(body.dueDate) : null
    const notes = body.notes?.trim() || null

    if (!clientId || !invoiceNumber) {
      return NextResponse.json(
        { ok: false, error: "clientId and invoiceNumber are required" },
        { status: 400 }
      )
    }

    if (!Number.isFinite(amountAud) || amountAud <= 0) {
      return NextResponse.json(
        { ok: false, error: "amountAud must be a positive number" },
        { status: 400 }
      )
    }

    const client = await prisma.clientProfile.findUnique({
      where: { id: clientId },
    })

    if (!client) {
      return NextResponse.json(
        { ok: false, error: "Client not found" },
        { status: 404 }
      )
    }

    if (projectId) {
      const project = await prisma.clientProject.findUnique({
        where: { id: projectId },
      })

      if (!project) {
        return NextResponse.json(
          { ok: false, error: "Project not found" },
          { status: 404 }
        )
      }

      if (project.clientId !== clientId) {
        return NextResponse.json(
          { ok: false, error: "Project does not belong to this client" },
          { status: 400 }
        )
      }
    }

    const invoice = await prisma.clientInvoice.create({
      data: {
        clientId,
        projectId,
        invoiceNumber,
        amountAud,
        dueDate,
        notes,
        status: "draft",
      },
    })

    return NextResponse.json({
      ok: true,
      invoice: await enrichInvoice(invoice),
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create client invoice",
      },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const id = body.id?.trim()
    const status = body.status?.trim()

    if (!id || !status) {
      return NextResponse.json(
        { ok: false, error: "id and status are required" },
        { status: 400 }
      )
    }

    if (!INVOICE_STATUSES.includes(status as (typeof INVOICE_STATUSES)[number])) {
      return NextResponse.json(
        {
          ok: false,
          error: "status must be draft, sent, paid, or overdue",
        },
        { status: 400 }
      )
    }

    const existing = await prisma.clientInvoice.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "Invoice not found" },
        { status: 404 }
      )
    }

    const invoice = await prisma.clientInvoice.update({
      where: { id },
      data: {
        status,
        paidDate:
          status === "paid"
            ? existing.paidDate || new Date()
            : existing.paidDate,
      },
    })

    return NextResponse.json({
      ok: true,
      invoice: await enrichInvoice(invoice),
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update client invoice",
      },
      { status: 500 }
    )
  }
}
