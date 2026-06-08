import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { jsPDF } from "jspdf"

export const runtime = "nodejs"

function formatDate(value: Date | null) {
  if (!value) {
    return "Not set"
  }

  return value.toLocaleDateString("en-AU")
}

function formatAud(value: number) {
  return `AUD ${value.toLocaleString("en-AU")}`
}

export async function POST(request: Request) {
  try {
    const { invoiceId } = await request.json()

    if (!invoiceId) {
      return NextResponse.json(
        { ok: false, error: "invoiceId is required" },
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

    const doc = new jsPDF()
    const margin = 14
    let y = 18

    function addText(text: string, size = 11) {
      doc.setFontSize(size)
      const lines = doc.splitTextToSize(text || "", 180)
      doc.text(lines, margin, y)
      y += lines.length * 7 + 4

      if (y > 270) {
        doc.addPage()
        y = 18
      }
    }

    addText("Echoes & Visions Invoice", 20)
    addText(`Invoice Number: ${invoice.invoiceNumber}`, 14)
    addText(`Client Name: ${client?.name || "Unknown client"}`)
    addText(`Client Email: ${client?.email || "Not provided"}`)

    if (project?.title) {
      addText(`Project Title: ${project.title}`)
    }

    addText(`Amount: ${formatAud(invoice.amountAud)}`)
    addText(`Status: ${invoice.status}`)
    addText(`Due Date: ${formatDate(invoice.dueDate)}`)

    if (invoice.paidDate) {
      addText(`Paid Date: ${formatDate(invoice.paidDate)}`)
    }

    if (invoice.notes) {
      addText("Notes", 14)
      addText(invoice.notes)
    }

    addText("Payment Instructions", 14)
    addText(
      "Payment instructions will be provided by Echoes & Visions."
    )

    const arrayBuffer = doc.output("arraybuffer")
    const pdfBuffer = Buffer.from(arrayBuffer)

    const safeInvoiceNumber =
      invoice.invoiceNumber
        .replace(/[^a-zA-Z0-9._-]+/g, "-")
        .replace(/^-|-$/g, "") || "invoice"

    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice-${safeInvoiceNumber}.pdf"`,
      },
    })
  } catch (error) {
    console.error("Invoice PDF export failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Invoice PDF export failed",
      },
      { status: 500 }
    )
  }
}
