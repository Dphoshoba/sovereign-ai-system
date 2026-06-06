import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

function escapeCsv(value: string) {
  return `"${value.replace(/"/g, '""')}"`
}

export async function GET() {
  const subscribers = await prisma.subscriber.findMany({
    orderBy: {
      createdAt: "desc",
    },
  })

  const rows = [
    ["email", "status", "createdAt", "updatedAt"],
    ...subscribers.map((subscriber) => [
      subscriber.email,
      subscriber.status,
      subscriber.createdAt.toISOString(),
      subscriber.updatedAt.toISOString(),
    ]),
  ]

  const csv = rows
    .map((row) => row.map((value) => escapeCsv(String(value))).join(","))
    .join("\n")

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="subscribers.csv"',
    },
  })
}