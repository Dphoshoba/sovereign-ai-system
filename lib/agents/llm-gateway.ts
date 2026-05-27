import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

type LLMProvider =
  | "openai"
  | "gemini"
  | "claude"

type GenerateInput = {
  provider: LLMProvider
  prompt: string
  systemPrompt?: string
}

export async function llmGateway(
  input: GenerateInput
) {
  const {
    provider,
    prompt,
    systemPrompt,
  } = input

  if (provider === "openai") {
    const completion =
      await openai.chat.completions.create({
        model: "gpt-4.1-mini",

        messages: [
          {
            role: "system",
            content:
              systemPrompt ||
              "You are an elite AI strategist.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],

        temperature: 0.8,
      })

    return {
      provider,
      output:
        completion.choices[0]?.message
          ?.content || "",
    }
  }

  /*
    Future providers:
    Gemini
    Claude
  */

  return {
    provider,
    output:
      "Provider not implemented yet.",
  }
}