import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { jsPDF } from "jspdf"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const { proposalId } = await request.json()

    if (!proposalId) {
      return NextResponse.json(
        { ok: false, error: "proposalId is required" },
        { status: 400 }
      )
    }

    const proposal = await prisma.creatorProposal.findUnique({
      where: { id: proposalId },
    })

    if (!proposal) {
      return NextResponse.json(
        { ok: false, error: "Proposal not found" },
        { status: 404 }
      )
    }

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

    addText("Echoes & Visions Proposal", 20)
    addText(proposal.title, 16)

    addText(`Status: ${proposal.status}`)
    addText(
      `Estimated Value: AUD ${Number(
        proposal.estimatedValue || 0
      ).toLocaleString("en-AU")}`
    )
    addText(`Implementation: ${proposal.implementationWeeks || 0} weeks`)

    addText("Summary", 14)
    addText(proposal.description || "No summary provided.")

    addText("Proposal Details", 14)
    addText(proposal.proposalContent || "No proposal details provided.", 9)

    addText("Next Step", 14)
    addText(
      "Book a strategy session to review this proposal and confirm the implementation plan."
    )

    const arrayBuffer = doc.output("arraybuffer")
    const pdfBuffer = Buffer.from(arrayBuffer)

    const safeFilename =
      proposal.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || "proposal"

    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeFilename}.pdf"`,
      },
    })
  } catch (error) {
    console.error("PDF export failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "PDF export failed",
      },
      { status: 500 }
    )
  }
}
