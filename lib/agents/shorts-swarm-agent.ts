import { llmGateway } from "./llm-gateway"

type ShortsSwarmInput = {
  script: string
  persona?: string
  style?: string
  count?: number
}

export async function shortsSwarmAgent(
  input: ShortsSwarmInput
) {
  const {
    script,
    persona = "creators",
    style = "viral cinematic",
    count = 10,
  } = input

  const systemPrompt = `
You are an elite Shorts strategist.

Your responsibilities:
- Extract viral moments
- Generate Shorts hooks
- Generate captions
- Generate CTA variants
- Generate retention edits
- Optimize for TikTok, YouTube Shorts, Instagram Reels
- Maximize retention and shares

Output JSON only.
`

  const prompt = `
Analyze this script and generate ${count} Shorts.

For EACH Short generate:

1. Hook
2. Title
3. Caption
4. CTA
5. Viral angle
6. Retention pattern
7. Suggested duration
8. Emotional trigger
9. Platform optimization
10. Scene extraction timestamp
11. Visual editing style
12. Subtitle style

Script:
${script}

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
    persona,
    style,
    count,
    shortsPlan: response.output,
  }
}