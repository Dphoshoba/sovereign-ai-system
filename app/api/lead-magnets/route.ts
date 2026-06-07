import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

function createSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

export async function GET() {
  try {
    const leadMagnets = await prisma.leadMagnet.findMany({
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json({
      ok: true,
      leadMagnets,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch lead magnets",
      },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const { title, description, fileUrl } = await req.json()

    if (!title || !description) {
      return NextResponse.json(
        { ok: false, error: "Title and description are required" },
        { status: 400 }
      )
    }

    const baseSlug = createSlug(title)
    let slug = baseSlug
    let suffix = 1

    while (await prisma.leadMagnet.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${suffix}`
      suffix++
    }

    const leadMagnet = await prisma.leadMagnet.create({
      data: {
        title,
        slug,
        description,
        fileUrl: fileUrl || null,
      },
    })

    return NextResponse.json({
      ok: true,
      leadMagnet,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create lead magnet",
      },
      { status: 500 }
    )
  }
}
