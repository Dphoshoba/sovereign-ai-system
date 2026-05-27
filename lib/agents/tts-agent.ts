import fs from "fs"
import path from "path"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

type TTSInput = {
  text: string
  filename?: string
  voice?: string
}

export async function ttsAgent(input: TTSInput) {
  const {
    text,
    filename = `voiceover-${Date.now()}.mp3`,
    voice = "alloy",
  } = input

  const speech = await openai.audio.speech.create({
    model: "gpt-4o-mini-tts",
    voice: voice as any,
    input: text,
  })

  const buffer = Buffer.from(await speech.arrayBuffer())

  const outputDir = path.join(process.cwd(), "public", "voiceovers")

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  const outputPath = path.join(outputDir, filename)

  fs.writeFileSync(outputPath, buffer)

  return {
    filename,
    outputPath,
    publicUrl: `/voiceovers/${filename}`,
  }
}
