import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requirePublishingEditor } from "../../../../lib/publishing/require-editor-auth"
import { sendApprovedNewsletter } from "../../../../lib/newsletter/send-newsletter"
import { getAppUrl } from "../../../../src/lib/site-config"
import type { NewsletterSendStore } from "../../../../lib/newsletter/send-newsletter"

export async function POST(req: NextRequest) {
  const auth = await requirePublishingEditor()
  if (!auth.ok) return auth.response

  try {
    const body = await req.json()
    const newsletterId = body?.newsletterId
    if (!newsletterId || typeof newsletterId !== "string") {
      return NextResponse.json(
        { ok: false, error: "Missing newsletterId" },
        { status: 400 },
      )
    }

    const mode =
      body?.mode === "single-recipient-test" ? "single-recipient-test" : "list"

    const result = await sendApprovedNewsletter({
      newsletterId,
      actor: auth.actor,
      origin: getAppUrl(),
      store: prisma as unknown as NewsletterSendStore,
      mode,
      testRecipient:
        typeof body?.testRecipient === "string"
          ? body.testRecipient
          : undefined,
      confirmSingleRecipientTest: body?.confirmSingleRecipientTest === true,
    })

    return NextResponse.json(result.body, { status: result.status })
  } catch (error) {
    console.error("Newsletter send failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Send failed",
      },
      { status: 500 },
    )
  }
}
