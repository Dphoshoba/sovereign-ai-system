import { AudiencePersona } from "./persona-agent"

type PromptInputs = {
  topic: string
  persona: AudiencePersona
  trendScore?: number
  reinforcementScore?: number
  winningHooks?: string[]
  winningTitles?: string[]
  thumbnailStyle?: string
}

export function promptEngineeringAgent(
  input: PromptInputs
) {
  const {
    topic,
    persona,
    trendScore = 70,
    reinforcementScore = 70,
    winningHooks = [],
    winningTitles = [],
    thumbnailStyle = "bold",
  } = input

  const urgencyLevel =
    trendScore >= 85
      ? "high"
      : trendScore >= 70
      ? "medium"
      : "low"

  const optimizationLevel =
    reinforcementScore >= 80
      ? "aggressive"
      : reinforcementScore >= 60
      ? "balanced"
      : "experimental"

  const systemPrompt = `
You are an elite AI content strategist.

Audience Persona:
${persona}

Topic:
${topic}

Urgency Level:
${urgencyLevel}

Optimization Level:
${optimizationLevel}

Winning Hooks:
${winningHooks.join(", ") || "None"}

Winning Titles:
${winningTitles.join(", ") || "None"}

Winning Thumbnail Style:
${thumbnailStyle}

Goals:
- Maximize CTR
- Maximize retention
- Improve audience connection
- Increase Shorts virality
- Reinforce successful structures
- Generate emotionally compelling hooks
- Use audience-aware language
- Increase curiosity and payoff density
`

  const titlePrompt = `
Generate 10 high-CTR YouTube titles for:
${topic}

Requirements:
- Emotionally compelling
- Curiosity-driven
- Audience-aware
- Avoid generic phrasing
- Use proven title structures
- Adapt for ${persona}
`

  const hookPrompt = `
Generate 10 viral hooks for:
${topic}

Requirements:
- First 5 seconds must create curiosity
- Increase retention
- Emotional tension
- Strong payoff expectation
- Optimized for ${persona}
`

  const thumbnailPrompt = `
Generate thumbnail concepts for:
${topic}

Requirements:
- Style: ${thumbnailStyle}
- High contrast
- 2–5 word text
- Strong emotional tension
- Optimized for CTR
- Audience Persona: ${persona}
`

  const shortsPrompt = `
Generate Shorts ideas for:
${topic}

Requirements:
- Viral pacing
- Fast hooks
- Strong captions
- Emotional payoff
- Optimized for retention
- Audience Persona: ${persona}
`

  return {
    systemPrompt,
    titlePrompt,
    hookPrompt,
    thumbnailPrompt,
    shortsPrompt,

    optimization: {
      urgencyLevel,
      optimizationLevel,
      persona,
    },
  }
}