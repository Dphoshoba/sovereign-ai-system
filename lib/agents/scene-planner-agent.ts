import { llmGateway } from "./llm-gateway"

type ScenePlannerInput = {
  script: string
  persona?: string
  style?: string
}

export async function scenePlannerAgent(
  input: ScenePlannerInput
) {
  const {
    script,
    persona = "creators",
    style = "cinematic",
  } = input

  const systemPrompt = `
You are an elite cinematic AI scene planner.

Your job:
- Break scripts into scenes
- Define visuals
- Define B-roll
- Define transitions
- Define pacing
- Define emotion
- Define camera movement
- Define retention hooks
- Define Shorts extraction moments

Output JSON only.
`

  const prompt = `
Analyze this script and generate:

1. Scene timeline
2. Scene durations
3. B-roll suggestions
4. Camera directions
5. Emotional pacing
6. Transition suggestions
7. Shorts extraction timestamps
8. Retention spikes
9. Visual intensity map

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
    scenePlan: response.output,
  }
}