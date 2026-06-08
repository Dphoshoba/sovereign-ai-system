import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const [leads, invoices] = await Promise.all([
      prisma.creatorLead.findMany(),
      prisma.clientInvoice.findMany(),
    ])

    const valueOf = (status: string) =>
      leads
        .filter((lead) => lead.status === status)
        .reduce((sum, lead) => sum + (lead.projectedValue || 0), 0)

    const totalPipelineValue = leads.reduce(
      (sum, lead) => sum + (lead.projectedValue || 0),
      0
    )

    const wonRevenue = valueOf("won")
    const lostRevenue = valueOf("lost")

    const openPipeline = leads
      .filter((lead) =>
        ["new", "contacted", "proposal-ready", "proposal-sent"].includes(
          lead.status || ""
        )
      )
      .reduce((sum, lead) => sum + (lead.projectedValue || 0), 0)

    const wonLeads = leads.filter((lead) => lead.status === "won").length
    const lostLeads = leads.filter((lead) => lead.status === "lost").length

    const closeRate =
      wonLeads + lostLeads > 0
        ? Math.round((wonLeads / (wonLeads + lostLeads)) * 100)
        : 0

    const totalInvoiced = invoices
      .filter((invoice) => invoice.status !== "draft")
      .reduce((sum, invoice) => sum + invoice.amountAud, 0)

    const totalPaid = invoices
      .filter((invoice) => invoice.status === "paid")
      .reduce((sum, invoice) => sum + invoice.amountAud, 0)

    const outstandingRevenue = invoices
      .filter((invoice) => ["sent", "overdue"].includes(invoice.status))
      .reduce((sum, invoice) => sum + invoice.amountAud, 0)

    return NextResponse.json({
      ok: true,
      summary: {
        totalPipelineValue,
        wonRevenue,
        openPipeline,
        lostRevenue,
        closeRate,
        totalLeads: leads.length,
        wonLeads,
        lostLeads,
        proposalSentLeads: leads.filter(
          (lead) => lead.status === "proposal-sent"
        ).length,
        totalInvoiced,
        totalPaid,
        outstandingRevenue,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Revenue summary failed",
      },
      { status: 500 }
    )
  }
}