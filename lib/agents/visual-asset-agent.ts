import { llmGateway } from "./llm-gateway"

type VisualAssetInput = {
  script: string
  persona?: string
  style?: string
}

export async function visualAssetAgent(input: VisualAssetInput) {
  const {
    script,
    persona = "creators",
    style = "cinematic",
  } = input

  const systemPrompt = `
You are an elite AI visual director.

Your job:
- Generate cinematic visual prompts
- Generate B-roll prompts
- Generate thumbnail concepts
- Generate motion graphics prompts
- Generate visual storytelling ideas
- Increase emotional engagement
- Increase retention
- Increase cinematic quality

Output JSON only.
`

  const prompt = `
Analyze this script and generate:

1. Cinematic image prompts
2. B-roll prompts
3. Thumbnail concepts
4. Motion graphics prompts
5. Visual storytelling moments
6. Color grading suggestions
7. Emotional visual pacing
8. Scene atmosphere descriptions

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
    visualPlan: response.output,
  }
}
