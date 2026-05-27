import { llmGateway } from "./llm-gateway"
import { AudiencePersona } from "./persona-agent"

type ScriptGenerationInput = {
  topic: string
  persona: AudiencePersona
  durationMinutes?: number
  style?: string
}

export async function scriptGenerationAgent(
  input: ScriptGenerationInput
) {
  const {
    topic,
    persona,
    durationMinutes = 8,
    style = "cinematic educational",
  } = input

  const systemPrompt = `
You are an elite YouTube content strategist and scriptwriter.

Audience Persona:
${persona}

Style:
${style}

Goals:
- Maximize retention
- Strong first 15 seconds
- Pattern interrupts every 20-30 seconds
- Emotionally engaging
- Highly visual narration
- Curiosity loops
- Strong pacing
- Strong CTA
- Always refer to the channel as "Echoes & Visions".
- Never use placeholders like [Channel Name].
`

  const prompt = `
Generate a complete YouTube script.

Topic:
${topic}

Length:
${durationMinutes} minutes

Requirements:
- Opening hook
- Intro
- Main sections
- Retention hooks
- B-roll suggestions
- Emotional pacing
- CTA section
- Shorts extraction moments
- Scene transitions
- If mentioning the channel, use "Echoes & Visions" (for example: "Welcome to Echoes & Visions").
`

  const response = await llmGateway({
    provider: "openai",
    systemPrompt,
    prompt,
  })

  return {
    topic,
    persona,
    style,
    durationMinutes,
    generatedScript: response.output,
  }
}