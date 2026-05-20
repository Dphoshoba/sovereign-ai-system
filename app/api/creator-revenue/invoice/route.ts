import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

function generateInvoiceNumber() {
  return `EV-${Date.now()}`
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const proposal = await prisma.creatorProposal.findUnique({
      where: { id: body.proposalId },
    })

    if (!proposal) {
      return NextResponse.json(
        { ok: false, error: "Proposal not found" },
        { status: 404 }
      )
    }

    const invoice = await prisma.creatorInvoice.create({
      data: {
        proposalId: proposal.id,
        leadId: proposal.leadId || null,
        invoiceNumber: generateInvoiceNumber(),
        amount: proposal.estimatedValue || 0,
        status: "sent",
        notes: "Creator Automation Package Invoice",
        paymentLink: "/payments/demo",
        metadata: {
          proposalTitle: proposal.title,
        },
      },
    })

    await prisma.creatorRevenueEvent.create({
      data: {
        type: "invoice-generated",
        title: invoice.invoiceNumber,
        amount: invoice.amount,
        invoiceId: invoice.id,
        proposalId: proposal.id,
        status: "sent",
      },
    })

    return NextResponse.json({
      ok: true,
      invoice,
    })
  } catch (error) {
    console.error("Invoice generation failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate invoice",
      },
      { status: 500 }
    )
  }
}