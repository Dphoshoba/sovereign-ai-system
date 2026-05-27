type SubtitleInput = {
  script: string
}

export function subtitleAgent(input: SubtitleInput) {
  const { script } = input

  const sentences = script
    .split(".")
    .map((s) => s.trim())
    .filter(Boolean)

  let currentTime = 0

  const subtitles = sentences.map((sentence, index) => {
    const start = currentTime
    const duration = Math.max(2, Math.ceil(sentence.split(" ").length / 2))

    currentTime += duration

    return {
      id: index + 1,
      start,
      end: currentTime,
      text: sentence,
    }
  })

  return subtitles
}