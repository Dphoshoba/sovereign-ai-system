import { prisma } from "@/lib/prisma"

type MemoryRecord = {
  topic: string
  title: string
  thumbnailStyle: string
  ctr: number
  retention: number
  views: number
  outcome: "winning" | "average" | "poor"
}

export async function memoryAgent() {
  async function remember(record: MemoryRecord) {
    const saved = await prisma.agentMemory.create({
      data: {
        topic: record.topic,
        title: record.title,
        thumbnailStyle: record.thumbnailStyle,
        ctr: record.ctr,
        retention: record.retention,
        views: record.views,
        outcome: record.outcome,
      },
    })

    return {
      stored: true,
      id: saved.id,
    }
  }

  async function getWinningPatterns() {
    return prisma.agentMemory.findMany({
      where: {
        outcome: "winning",
      },
      orderBy: {
        views: "desc",
      },
      take: 10,
    })
  }

  async function getBestTopics() {
    return prisma.agentMemory.findMany({
      orderBy: {
        views: "desc",
      },
      take: 5,
    })
  }

  async function getBestThumbnailStyles() {
    const memories = await prisma.agentMemory.findMany()

    const counts: Record<string, number> = {}

    memories.forEach((m) => {
      counts[m.thumbnailStyle] = (counts[m.thumbnailStyle] || 0) + 1
    })

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([style]) => style)
  }

  async function getBestTitles() {
    return prisma.agentMemory.findMany({
      orderBy: {
        ctr: "desc",
      },
      take: 10,
    })
  }

  return {
    remember,
    getWinningPatterns,
    getBestTopics,
    getBestThumbnailStyles,
    getBestTitles,
  }
}