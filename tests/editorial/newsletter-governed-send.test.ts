import { beforeEach, describe, expect, it, vi } from "vitest"
import { resolveNewsletterConfig } from "../../lib/newsletter/newsletter-config"
import {
  createUnsubscribeToken,
  verifyUnsubscribeToken,
} from "../../lib/newsletter/unsubscribe-token"
import { sendApprovedNewsletter } from "../../lib/newsletter/send-newsletter"
import type { NewsletterSendStore } from "../../lib/newsletter/send-newsletter"

describe("newsletter config fail-closed", () => {
  it("rejects missing NEWSLETTER_RESEND_API_KEY without falling back to RESEND_API_KEY", () => {
    const result = resolveNewsletterConfig({
      RESEND_API_KEY: "re_other",
      NEWSLETTER_FROM:
        "Echoes & Visions <newsletter@news.echoesandvisions.com>",
    } as NodeJS.ProcessEnv)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.code).toBe("missing_newsletter_resend_api_key")
    }
  })

  it("rejects placeholder NEWSLETTER_FROM", () => {
    const result = resolveNewsletterConfig({
      NEWSLETTER_RESEND_API_KEY: "re_news",
      NEWSLETTER_FROM: "Echoes & Visions <newsletter@yourdomain.com>",
    } as NodeJS.ProcessEnv)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.code).toBe("placeholder_newsletter_from")
    }
  })

  it("accepts dedicated key + verified domain sender", () => {
    const result = resolveNewsletterConfig({
      NEWSLETTER_RESEND_API_KEY: "re_news",
      NEWSLETTER_FROM:
        "Echoes & Visions <newsletter@news.echoesandvisions.com>",
    } as NodeJS.ProcessEnv)
    expect(result.ok).toBe(true)
  })
})

describe("unsubscribe tokens", () => {
  const env = {
    NEWSLETTER_RESEND_API_KEY: "re_news_test",
  } as NodeJS.ProcessEnv

  it("round-trips a secure token", () => {
    const token = createUnsubscribeToken("Reader@Example.com", env)
    expect(token).toBeTruthy()
    const verified = verifyUnsubscribeToken(token!, env)
    expect(verified).toEqual({ ok: true, email: "reader@example.com" })
  })

  it("rejects a tampered token", () => {
    const token = createUnsubscribeToken("reader@example.com", env)!
    const verified = verifyUnsubscribeToken(token.slice(0, -2) + "ab", env)
    expect(verified.ok).toBe(false)
  })
})

describe("sendApprovedNewsletter safeguards", () => {
  const events: Array<Record<string, unknown>> = []
  let newsletterStatus = "approved"
  const send = vi.fn()

  const store: NewsletterSendStore = {
    newsletter: {
      findUnique: async () => ({
        id: "news-1",
        status: newsletterStatus,
        subject: "Subject",
        previewText: "Preview",
        content: "<p>Body</p>",
      }),
      update: async ({ data }) => {
        newsletterStatus = String(data.status)
        return {
          id: "news-1",
          status: newsletterStatus,
          subject: "Subject",
          previewText: "Preview",
          content: "<p>Body</p>",
        }
      },
    },
    subscriber: {
      findMany: async () => [
        { id: "sub-1", email: "a@example.com", status: "active" },
        { id: "sub-2", email: "b@example.com", status: "active" },
      ],
    },
    operationalEvent: {
      findMany: async () =>
        events.map((e) => ({
          type: String(e.type),
          entityId: (e.entityId as string) ?? null,
          payload: e.payload,
        })),
      create: async ({ data }) => {
        events.push(data)
        return data
      },
    },
  }

  const env = {
    NEWSLETTER_RESEND_API_KEY: "re_news",
    NEWSLETTER_FROM:
      "Echoes & Visions <newsletter@news.echoesandvisions.com>",
    VERCEL_ENV: "production",
  } as NodeJS.ProcessEnv

  beforeEach(() => {
    events.length = 0
    newsletterStatus = "approved"
    send.mockReset()
  })

  it("blocks live list distribution when Preview or disabled", async () => {
    const result = await sendApprovedNewsletter({
      newsletterId: "news-1",
      actor: "editor@example.com",
      origin: "https://www.echoesandvisions.com",
      store,
      env: { ...env, VERCEL_ENV: "preview" },
      createClient: () => ({ emails: { send } }),
    })
    expect(result.status).toBe(403)
    expect(result.body.code).toBe("live_list_disabled")
    expect(send).not.toHaveBeenCalled()
  })

  it("records partial failure without claiming full sent", async () => {
    send
      .mockResolvedValueOnce({ data: { id: "msg-1" }, error: null })
      .mockResolvedValueOnce({
        data: null,
        error: { message: "bounce_sim" },
      })

    const result = await sendApprovedNewsletter({
      newsletterId: "news-1",
      actor: "editor@example.com",
      origin: "https://www.echoesandvisions.com",
      store,
      env,
      createClient: () => ({ emails: { send } }),
    })

    expect(result.status).toBe(207)
    expect(result.body.ok).toBe(false)
    expect(result.body.providerAcceptedCount).toBe(1)
    expect(result.body.failedCount).toBe(1)
    expect(result.body.inboxDeliveryClaimed).toBe(false)
    expect(newsletterStatus).toBe("partially-sent")
  })

  it("skips duplicate recipient sends after prior acceptance", async () => {
    events.push({
      type: "newsletter_recipient_accepted",
      entityId: "news-1:sub-1",
      payload: {},
    })
    send.mockResolvedValue({ data: { id: "msg-2" }, error: null })

    const result = await sendApprovedNewsletter({
      newsletterId: "news-1",
      actor: "editor@example.com",
      origin: "https://www.echoesandvisions.com",
      store,
      env,
      createClient: () => ({ emails: { send } }),
    })

    expect(send).toHaveBeenCalledOnce()
    expect(result.body.providerAcceptedCount).toBe(1)
    const outcomes = result.body.outcomes as Array<{ outcome: string }>
    expect(outcomes.some((o) => o.outcome === "skipped_duplicate")).toBe(true)
  })

  it("single-recipient test never touches the subscriber list", async () => {
    const findMany = vi.fn(store.subscriber.findMany)
    store.subscriber.findMany = findMany
    send.mockResolvedValue({ data: { id: "test-1" }, error: null })

    const result = await sendApprovedNewsletter({
      newsletterId: "news-1",
      actor: "editor@example.com",
      origin: "https://www.echoesandvisions.com",
      store,
      mode: "single-recipient-test",
      testRecipient: "director@example.com",
      confirmSingleRecipientTest: true,
      env,
      createClient: () => ({ emails: { send } }),
    })

    expect(result.status).toBe(200)
    expect(result.body.listTouched).toBe(false)
    expect(result.body.newsletterStatusUnchanged).toBe(true)
    expect(findMany).not.toHaveBeenCalled()
    expect(newsletterStatus).toBe("approved")
    expect(send.mock.calls[0]?.[0]).toMatchObject({
      to: "director@example.com",
      from: env.NEWSLETTER_FROM,
    })
    expect(String(send.mock.calls[0]?.[0]?.html)).toContain("Unsubscribe")
  })
})
