import { llmGateway } from "./llm-gateway"

type ThumbnailInput = {
  title: string
  topic?: string
  persona?: string
  style?: string
}

export async function thumbnailIntelligenceAgent(
  input: ThumbnailInput
) {
  const {
    title,
    topic = "",
    persona = "creators",
    style = "cinematic",
  } = input

  const systemPrompt = `
You are an elite YouTube thumbnail strategist.

Your job:
- Maximize CTR
- Create emotional curiosity
- Create cinematic thumbnails
- Generate A/B variants
- Increase click psychology
- Increase emotional contrast
- Improve title-thumbnail synergy

Output JSON only.
`

  const prompt = `
Generate:

1. 5 thumbnail concepts
2. Emotional variants
3. Curiosity variants
4. Thumbnail text overlays
5. Thumbnail image prompts
6. CTR psychology explanations
7. A/B testing suggestions
8. Color/emotion strategy
9. Title-thumbnail synergy analysis

Title:
${title}

Topic:
${topic}

Audience Persona:
${persona}

Style:
${style}
`

  const response = await llmGateway({
    provider: "openai",
    systemPrompt,
    prompt,
  })

  return {
    title,
    topic,
    persona,
    style,
    thumbnailPlan: response.output,
  }
}