type MemoryRecord = {
  topic: string
  title: string
  thumbnailStyle: string
  ctr: number
  retention: number
  views: number
  outcome: "winning" | "average" | "poor"
}

const memoryDatabase: MemoryRecord[] = []

export async function memoryAgent() {
  function remember(record: MemoryRecord) {
    memoryDatabase.push(record)

    return {
      stored: true,
      totalMemories: memoryDatabase.length,
    }
  }

  function getWinningPatterns() {
    return memoryDatabase.filter((m) => m.outcome === "winning")
  }

  function getBestTopics() {
    const sorted = [...memoryDatabase].sort((a, b) => b.views - a.views)

    return sorted.slice(0, 5)
  }

  function getBestThumbnailStyles() {
    const counts: Record<string, number> = {}

    memoryDatabase.forEach((m) => {
      counts[m.thumbnailStyle] = (counts[m.thumbnailStyle] || 0) + 1
    })

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([style]) => style)
  }

  function getBestTitles() {
    return [...memoryDatabase]
      .sort((a, b) => b.ctr - a.ctr)
      .slice(0, 10)
      .map((m) => ({
        title: m.title,
        ctr: m.ctr,
      }))
  }

  return {
    remember,
    getWinningPatterns,
    getBestTopics,
    getBestThumbnailStyles,
    getBestTitles,
  }
}
