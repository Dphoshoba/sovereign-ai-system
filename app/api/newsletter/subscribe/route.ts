import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  payloadWithinLimit,
  publicCaptureAllowed,
} from "../../../../lib/security/public-capture"

const SUBSCRIBED_BODY = {
  ok: true,
  subscribed: true,
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Consent marker recorded on subscribe (act of submitting the form). */
export const NEWSLETTER_CONSENT_VERSION = "ev-newsletter-consent-v1"

function subscriptionSource(value: unknown) {
  const base =
    typeof value === "string" && value.trim() ? value.trim() : "newsletter"
  return `${base}|consent:${NEWSLETTER_CONSENT_VERSION}`
}

export async function POST(req: NextRequest) {
  if (!payloadWithinLimit(req) || !(await publicCaptureAllowed("newsletter-subscribe", req))) {
    return NextResponse.json({ ok: false, error: "Too many requests" }, { status: 429 })
  }

  try {
    const body = await req.json()
    const email = typeof body?.email === "string" ? body.email.toLowerCase().trim() : ""

    if (!email || !EMAIL_PATTERN.test(email)) {
      return NextResponse.json(
        {
          ok: false,
          error: "A valid email is required",
        },
        { status: 400 }
      )
    }

    const source = subscriptionSource(body?.source)
    const existing = await prisma.subscriber.findUnique({
      where: {
        email,
      },
    })

    if (existing) {
      await prisma.subscriber.update({
        where: { email },
        data: {
          status: "active",
          source,
        },
      })
    } else {
      await prisma.subscriber.create({
        data: {
          email,
          status: "active",
          source,
        },
      })
    }

    return NextResponse.json(SUBSCRIBED_BODY)
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "Subscription failed",
      },
      { status: 500 }
    )
  }
}
