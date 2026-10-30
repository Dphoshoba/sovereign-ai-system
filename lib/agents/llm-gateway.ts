import OpenAI from "openai"

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is not configured. Add it to your environment variables."
    )
  }

  return new OpenAI({ apiKey })
}

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
      await getOpenAI().chat.completions.create({
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