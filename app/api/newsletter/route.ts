import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

async function parseNewsletterPayload(req: Request) {
  const contentType = req.headers.get("content-type") || ""

  if (contentType.includes("application/json")) {
    const body = await req.json()
    return {
      name: typeof body.name === "string" ? body.name : "",
      email: typeof body.email === "string" ? body.email : "",
      wantsRedirect: false,
    }
  }

  const formData = await req.formData()

  return {
    name: String(formData.get("name") || ""),
    email: String(formData.get("email") || ""),
    wantsRedirect: true,
  }
}

export async function POST(req: Request) {
  try {
    const { name, email, wantsRedirect } = await parseNewsletterPayload(req)

    if (!email || typeof email !== "string") {
      if (wantsRedirect) {
        return NextResponse.redirect(new URL("/blog?newsletter=error", req.url), 303)
      }

      return NextResponse.json(
        {
          success: false,
          message: "Email is required",
        },
        { status: 400 }
      )
    }

    const subscriber = await prisma.newsletterSubscriber.upsert({
      where: {
        email: email.toLowerCase().trim(),
      },
      update: {
        name: name || null,
        status: "active",
        source: "blog",
      },
      create: {
        name: name || null,
        email: email.toLowerCase().trim(),
        status: "active",
        source: "blog",
      },
    })

    if (wantsRedirect) {
      return NextResponse.redirect(new URL("/blog?newsletter=success", req.url), 303)
    }

    return NextResponse.json({
      success: true,
      message: "Subscribed successfully",
      subscriber,
    })
  } catch (error) {
    console.error("Newsletter signup failed:", error)

    const contentType = req.headers.get("content-type") || ""
    if (!contentType.includes("application/json")) {
      return NextResponse.redirect(new URL("/blog?newsletter=error", req.url), 303)
    }

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong",
      },
      { status: 500 }
    )
  }
}