import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    await prisma.article.count()

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error(error)

    return NextResponse.json({ ok: false }, { status: 503 })
  }
}