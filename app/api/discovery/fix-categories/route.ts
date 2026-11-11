import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireEditorAuth } from "../../../../lib/publishing/require-editor-auth"

export async function POST() {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  const bible = await prisma.discoveredTopic.updateMany({
    where: {
      OR: [
        { title: { contains: "Bible" } },
        { title: { contains: "Biblical" } },
      ],
    },
    data: {
      category: "bible-stories",
      status: "discovered",
    },
  })

  const motivation = await prisma.discoveredTopic.updateMany({
    where: {
      OR: [
        { title: { contains: "Discipline" } },
        { title: { contains: "Personal Growth" } },
      ],
    },
    data: {
      category: "motivation",
    },
  })

  return NextResponse.json({
    ok: true,
    bibleUpdated: bible.count,
    motivationUpdated: motivation.count,
  })
}