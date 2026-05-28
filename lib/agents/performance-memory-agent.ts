import { prisma } from "@/lib/prisma"

type SavePerformanceInput = {
  videoId: string
  title?: string
  metrics: {
    views: number
    estimatedMinutesWatched: number
    averageViewDuration: number
    likes: number
    subscribersGained: number
  }
  reinforcement?: any
}

export async function savePerformanceMemory(input: SavePerformanceInput) {
  return prisma.videoPerformanceMemory.create({
    data: {
      videoId: input.videoId,
      title: input.title || "",
      views: input.metrics.views,
      estimatedMinutesWatched: input.metrics.estimatedMinutesWatched,
      averageViewDuration: input.metrics.averageViewDuration,
      likes: input.metrics.likes,
      subscribersGained: input.metrics.subscribersGained,
      rewardScore: input.reinforcement?.rewardScore || 0,
      strategyNotes: input.reinforcement || {},
    },
  })
}