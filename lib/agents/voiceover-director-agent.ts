import { llmGateway } from "./llm-gateway"

type VoiceoverDirectorInput = {
  script: string
  persona?: string
  style?: string
}

export async function voiceoverDirectorAgent(
  input: VoiceoverDirectorInput
) {
  const {
    script,
    persona = "creators",
    style = "cinematic",
  } = input

  const systemPrompt = `
You are an elite AI voiceover director.

Your responsibilities:
- Break narration into chunks
- Add emotional pacing
- Add pauses
- Add emphasis instructions
- Add cinematic delivery guidance
- Increase retention
- Increase emotional engagement
- Optimize for AI narration systems

Output JSON only.
`

  const prompt = `
Analyze this script and generate:

1. Narration chunks
2. Emotional tone per chunk
3. Pause timing
4. Emphasis instructions
5. Voice intensity map
6. Narration pacing
7. Shorts narration moments
8. Cinematic narration direction

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
    narrationPlan: response.output,
  }
}