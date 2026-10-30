import { beforeEach, describe, expect, it, vi } from "vitest"

const emailFindUnique = vi.hoisted(() => vi.fn())
const newsletterFindUnique = vi.hoisted(() => vi.fn())

vi.mock("@/lib/prisma", () => ({
  prisma: {
    emailExecution: {
      findUnique: emailFindUnique,
    },
    newsletter: {
      findUnique: newsletterFindUnique,
    },
  },
}))

function jsonRequest(url: string, body: unknown) {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })
}

describe("credential SDK initialization", () => {
  beforeEach(() => {
    vi.stubEnv("RESEND_API_KEY", "")
    vi.stubEnv("OPENAI_API_KEY", "")
    vi.stubEnv("OPENAI_ADMIN_KEY", "")
    vi.stubEnv("TWITTER_API_KEY", "")
    vi.stubEnv("TWITTER_API_SECRET", "")
    vi.stubEnv("TWITTER_ACCESS_TOKEN", "")
    vi.stubEnv("TWITTER_ACCESS_SECRET", "")
    emailFindUnique.mockReset()
    newsletterFindUnique.mockReset()
  })

  it("imports send routes and agent clients without credentials", async () => {
    await expect(
      import("../../app/api/email-execution/send/route")
    ).resolves.toHaveProperty("POST")
    await expect(
      import("../../app/api/newsletter/send/route")
    ).resolves.toHaveProperty("POST")
    await expect(
      import("../../app/api/newsletters/send/route")
    ).resolves.toHaveProperty("POST")
    await expect(import("../../src/lib/twitter")).resolves.toHaveProperty(
      "getTwitterClient"
    )
    await expect(import("../../lib/agents/llm-gateway")).resolves.toHaveProperty(
      "llmGateway"
    )
    await expect(import("../../lib/agents/tts-agent")).resolves.toHaveProperty(
      "ttsAgent"
    )
  })

  it("rejects an approved email send when RESEND_API_KEY is missing", async () => {
    emailFindUnique.mockResolvedValue({ id: "email-1", approved: true })
    const { POST } = await import("../../app/api/email-execution/send/route")
    const response = await POST(
      jsonRequest("http://localhost/api/email-execution/send", {
        emailId: "email-1",
      })
    )

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: "RESEND_API_KEY is missing",
    })
  })

  it("keeps unapproved email sends blocked", async () => {
    emailFindUnique.mockResolvedValue({ id: "email-1", approved: false })
    const { POST } = await import("../../app/api/email-execution/send/route")
    const response = await POST(
      jsonRequest("http://localhost/api/email-execution/send", {
        emailId: "email-1",
      })
    )

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: "Email must be approved before sending",
    })
  })

  it("rejects newsletter sends when RESEND_API_KEY is missing", async () => {
    const singular = await import("../../app/api/newsletter/send/route")
    const plural = await import("../../app/api/newsletters/send/route")
    const first = await singular.POST(
      jsonRequest("http://localhost/api/newsletter/send", {
        newsletterId: "news-1",
      }) as never
    )
    const second = await plural.POST(
      jsonRequest("http://localhost/api/newsletters/send", {
        newsletterId: "news-1",
      })
    )

    expect(first.status).toBe(500)
    expect(second.status).toBe(500)
    await expect(first.json()).resolves.toEqual({
      ok: false,
      error: "Missing RESEND_API_KEY",
    })
    await expect(second.json()).resolves.toEqual({
      ok: false,
      error: "Missing RESEND_API_KEY",
    })
    expect(newsletterFindUnique).not.toHaveBeenCalled()
  })

  it("rejects OpenAI and Twitter use when credentials are missing", async () => {
    const { llmGateway } = await import("../../lib/agents/llm-gateway")
    const { ttsAgent } = await import("../../lib/agents/tts-agent")
    const { getTwitterClient } = await import("../../src/lib/twitter")

    await expect(
      llmGateway({ provider: "openai", prompt: "ping" })
    ).rejects.toThrow("OPENAI_API_KEY is not configured")
    await expect(
      llmGateway({ provider: "gemini", prompt: "ping" })
    ).resolves.toMatchObject({
      provider: "gemini",
      output: "Provider not implemented yet.",
    })
    await expect(
      ttsAgent({ text: "ping", filename: "should-not-be-written.mp3" })
    ).rejects.toThrow("OPENAI_API_KEY is not configured")
    expect(() => getTwitterClient()).toThrow("Invalid consumer tokens")
  })
})
