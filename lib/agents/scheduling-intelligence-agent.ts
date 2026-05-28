type SchedulingInput = {
  audienceRegion?: string
  audienceType?: string
  contentType?: string
}

export function schedulingIntelligenceAgent(input: SchedulingInput) {
  const region = input.audienceRegion || "global"

  const audience = input.audienceType || "general"

  const contentType = input.contentType || "longform"

  let bestTimes: string[] = []

  if (contentType === "shorts") {
    bestTimes = ["11:00 AM", "3:00 PM", "7:00 PM"]
  } else {
    bestTimes = ["9:00 AM", "1:00 PM", "6:00 PM"]
  }

  const cadence =
    contentType === "shorts"
      ? "2-5 Shorts daily"
      : "3-5 long-form videos weekly"

  return {
    audienceRegion: region,
    audienceType: audience,
    contentType,

    schedulingStrategy: {
      bestUploadTimes: bestTimes,
      cadence,

      recommendations: [
        "Upload consistently within optimal audience windows.",
        "Schedule Shorts around peak scrolling periods.",
        "Cluster related videos into strategic topic waves.",
        "Avoid inconsistent upload gaps.",
      ],
    },
  }
}