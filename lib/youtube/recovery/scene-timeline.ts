/**
 * Deterministic scene/timeline helpers recovered from the historical render path.
 * No LLM calls — suitable for fixtures and Director-bound packages.
 */

export type SceneTimelineItem = {
  start: number
  end: number
  duration: number
  scene: string
  broll?: string
  text?: string
  emotion?: "high" | "warm" | "calm" | string
  transition?: "fast-cut" | "crossfade" | "slow-fade" | string
}

export function buildSceneTimelineFromScript(input: {
  script: string
  defaultScene?: string
  sceneDurationSeconds?: number
}): SceneTimelineItem[] {
  const sentences = input.script
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 12)

  const chunkSize = Math.max(1, Math.ceil(sentences.length / 6) || 1)
  const duration = input.sceneDurationSeconds ?? 6
  const defaultScene = input.defaultScene || "/backgrounds/default.mp4"

  const items: SceneTimelineItem[] = []
  let cursor = 0
  for (let i = 0; i < sentences.length; i += chunkSize) {
    const chunk = sentences.slice(i, i + chunkSize).join(". ")
    const start = cursor
    const end = start + duration
    items.push({
      start,
      end,
      duration,
      scene: defaultScene,
      text: chunk.slice(0, 180),
      emotion: /breakthrough|transform|growth|powerful/i.test(chunk)
        ? "high"
        : /prayer|heart|ministry|community/i.test(chunk)
          ? "warm"
          : "calm",
      transition: i === 0 ? "slow-fade" : "crossfade",
    })
    cursor = end
  }

  if (items.length === 0) {
    items.push({
      start: 0,
      end: duration,
      duration,
      scene: defaultScene,
      text: input.script.slice(0, 180) || "Opening",
      emotion: "calm",
      transition: "slow-fade",
    })
  }

  return items
}

export function detectShortsHookSentence(script: string): {
  bestSentence: string
  bestIndex: number
} {
  const hookPatterns = [
    /most people/i,
    /nobody tells you/i,
    /the future/i,
    /mistake/i,
    /secret/i,
    /you need to/i,
    /why .* matters/i,
    /this changes everything/i,
    /warning/i,
    /here's the truth/i,
  ]

  const sentences = script.split(/[.!?]+/).map((s) => s.trim()).filter(Boolean)
  let bestIndex = 0
  let bestScore = 0

  sentences.forEach((sentence, index) => {
    let score = 0
    for (const pattern of hookPatterns) {
      if (pattern.test(sentence)) score += 10
    }
    if (sentence.length > 80) score += 2
    if (/\byou\b/i.test(sentence)) score += 2
    if (score > bestScore) {
      bestScore = score
      bestIndex = index
    }
  })

  return {
    bestSentence: sentences[bestIndex] || "",
    bestIndex,
  }
}
