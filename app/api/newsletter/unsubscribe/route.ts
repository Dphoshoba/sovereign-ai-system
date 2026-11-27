import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyUnsubscribeToken } from "../../../../lib/newsletter/unsubscribe-token"
import {
  payloadWithinLimit,
  publicCaptureAllowed,
} from "../../../../lib/security/public-capture"

function htmlPage(title: string, body: string) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><title>${title}</title></head><body style="font-family:Georgia,serif;max-width:40rem;margin:3rem auto;padding:0 1rem;line-height:1.6"><h1>${title}</h1>${body}</body></html>`
}

async function unsubscribeEmail(email: string) {
  const existing = await prisma.subscriber.findUnique({ where: { email } })
  if (!existing) {
    return { ok: true as const, already: true }
  }
  if (existing.status === "unsubscribed") {
    return { ok: true as const, already: true }
  }
  await prisma.subscriber.update({
    where: { email },
    data: { status: "unsubscribed" },
  })
  return { ok: true as const, already: false }
}

export async function GET(req: NextRequest) {
  if (!payloadWithinLimit(req) || !(await publicCaptureAllowed("newsletter-unsubscribe", req))) {
    return new NextResponse(
      htmlPage("Too many requests", "<p>Please try again later.</p>"),
      { status: 429, headers: { "content-type": "text/html; charset=utf-8" } },
    )
  }

  const token = req.nextUrl.searchParams.get("token") || ""
  const verified = verifyUnsubscribeToken(token)
  if (!verified.ok) {
    return new NextResponse(
      htmlPage("Unsubscribe", `<p>${verified.error}</p>`),
      { status: 400, headers: { "content-type": "text/html; charset=utf-8" } },
    )
  }

  try {
    const result = await unsubscribeEmail(verified.email)
    return new NextResponse(
      htmlPage(
        "Unsubscribed",
        result.already
          ? "<p>You are already unsubscribed from Echoes &amp; Visions emails.</p>"
          : "<p>You have been unsubscribed. You will be excluded from future newsletter sends.</p>",
      ),
      { status: 200, headers: { "content-type": "text/html; charset=utf-8" } },
    )
  } catch {
    return new NextResponse(
      htmlPage("Unsubscribe", "<p>Unsubscribe failed. Please try again later.</p>"),
      { status: 500, headers: { "content-type": "text/html; charset=utf-8" } },
    )
  }
}

export async function POST(req: NextRequest) {
  if (!payloadWithinLimit(req) || !(await publicCaptureAllowed("newsletter-unsubscribe", req))) {
    return NextResponse.json({ ok: false, error: "Too many requests" }, { status: 429 })
  }

  let token = ""
  const contentType = req.headers.get("content-type") || ""
  try {
    if (contentType.includes("application/json")) {
      const body = await req.json()
      token = typeof body?.token === "string" ? body.token : ""
    } else {
      const form = await req.formData()
      const value = form.get("token")
      token = typeof value === "string" ? value : ""
    }
  } catch {
    token = req.nextUrl.searchParams.get("token") || ""
  }

  if (!token) {
    token = req.nextUrl.searchParams.get("token") || ""
  }

  const verified = verifyUnsubscribeToken(token)
  if (!verified.ok) {
    return NextResponse.json({ ok: false, error: verified.error }, { status: 400 })
  }

  try {
    const result = await unsubscribeEmail(verified.email)
    return NextResponse.json({
      ok: true,
      unsubscribed: true,
      already: result.already,
    })
  } catch {
    return NextResponse.json({ ok: false, error: "Unsubscribe failed" }, { status: 500 })
  }
}
