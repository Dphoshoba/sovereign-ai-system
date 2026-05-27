function formatTime(seconds: number) {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")},000`
}

export function subtitlesToSRT(subtitles: any[]) {
  return subtitles
    .map(
      (sub) => `${sub.id}
${formatTime(sub.start)} --> ${formatTime(sub.end)}
${sub.text}
`
    )
    .join("\n")
}