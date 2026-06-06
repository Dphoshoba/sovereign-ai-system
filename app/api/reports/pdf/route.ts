export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { PDFDocument, StandardFonts, rgb } from "pdf-lib"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const [articles, socialPosts, newsletters, subscribers] =
      await Promise.all([
        prisma.article.findMany(),
        prisma.socialPost.findMany(),
        prisma.newsletter.findMany(),
        prisma.subscriber.findMany(),
      ])

    const publishedArticles = articles.filter((a) => a.status === "published")
    const publishedSocialPosts = socialPosts.filter(
      (s) => s.status === "published"
    )
    const sentNewsletters = newsletters.filter(
      (n) => n.status === "sent"
    )
    const activeSubscribers = subscribers.filter(
      (s) => s.status === "active"
    )

    const pdfDoc = await PDFDocument.create()

    const page = pdfDoc.addPage([595, 842])

    const font = await pdfDoc.embedFont(
      StandardFonts.Helvetica
    )

    const boldFont = await pdfDoc.embedFont(
      StandardFonts.HelveticaBold
    )

    let y = 790

    function drawText(
      text: string,
      size = 11,
      bold = false
    ) {
      page.drawText(text, {
        x: 50,
        y,
        size,
        font: bold ? boldFont : font,
        color: rgb(0, 0, 0),
      })

      y -= size + 10
    }

    drawText(
      "Echoes & Visions Monthly Report",
      22,
      true
    )

    drawText(
      new Date().toLocaleString("default", {
        month: "long",
        year: "numeric",
      }),
      14
    )

    y -= 10

    drawText("Executive Summary", 16, true)

    drawText(
      `Published ${publishedArticles.length} articles, distributed ${publishedSocialPosts.length} social posts, delivered ${sentNewsletters.length} newsletters, and maintained ${activeSubscribers.length} active subscribers.`
    )

    y -= 10

    drawText("Metrics", 16, true)

    drawText(
      `Articles Published: ${publishedArticles.length}`
    )

    drawText(
      `Social Posts Published: ${publishedSocialPosts.length}`
    )

    drawText(
      `Newsletters Sent: ${sentNewsletters.length}`
    )

    drawText(
      `Active Subscribers: ${activeSubscribers.length}`
    )

    y -= 10

    drawText("Recent Articles", 16, true)

    publishedArticles
      .slice()
      .sort(
        (a, b) =>
          new Date(
            b.publishedAt ?? b.updatedAt
          ).getTime() -
          new Date(
            a.publishedAt ?? a.updatedAt
          ).getTime()
      )
      .slice(0, 5)
      .forEach((article) => {
        drawText(`• ${article.title}`)
      })

    y -= 10

    drawText("Recent Newsletters", 16, true)

    sentNewsletters
      .slice()
      .sort(
        (a, b) =>
          new Date(
            b.sentAt ?? b.updatedAt
          ).getTime() -
          new Date(
            a.sentAt ?? a.updatedAt
          ).getTime()
      )
      .slice(0, 5)
      .forEach((newsletter) => {
        drawText(`• ${newsletter.subject}`)
      })

    const pdfBytes = await pdfDoc.save()

    return new NextResponse(
      Buffer.from(pdfBytes),
      {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition":
            'attachment; filename="monthly-report.pdf"',
        },
      }
    )
  } catch (error) {
    console.error(
      "PDF report failed:",
      error
    )

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "PDF report failed",
      },
      { status: 500 }
    )
  }
}