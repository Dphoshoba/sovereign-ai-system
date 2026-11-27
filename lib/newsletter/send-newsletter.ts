import { createHash } from "node:crypto"
import { Resend } from "resend"
import {
  newsletterLiveListDistributionAllowed,
  resolveNewsletterConfig,
} from "./newsletter-config"
import { buildNewsletterHtml } from "./send-html"

export const NEWSLETTER_RECIPIENT_ENTITY = "NewsletterRecipient"

export type NewsletterRecord = {
  id: string
  status: string
  subject: string
  previewText: string | null
  content: string
}

export type SubscriberRecord = {
  id: string
  email: string
  status: string
}

type EventRow = {
  type: string
  entityId: string | null
  payload: unknown
}

export type NewsletterSendStore = {
  newsletter: {
    findUnique: (args: {
      where: { id: string }
    }) => Promise<NewsletterRecord | null>
    update: (args: {
      where: { id: string }
      data: Record<string, unknown>
    }) => Promise<NewsletterRecord>
  }
  subscriber: {
    findMany: (args: {
      where: { status: string }
    }) => Promise<SubscriberRecord[]>
  }
  operationalEvent: {
    findMany: (args: {
      where: Record<string, unknown>
      select?: Record<string, boolean>
    }) => Promise<EventRow[]>
    create: (args: { data: Record<string, unknown> }) => Promise<unknown>
  }
}

export type RecipientOutcome = {
  subscriberId: string
  emailHash: string
  outcome:
    | "accepted"
    | "failed"
    | "skipped_duplicate"
    | "skipped_ambiguous"
    | "skipped_unsubscribed"
  providerMessageId?: string
  error?: string
  /** Provider accepted the API request — not proof of inbox delivery. */
  providerAccepted?: boolean
}

export type SendNewsletterResult = {
  status: number
  body: Record<string, unknown>
}

function emailHash(email: string): string {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex")
}

function recipientEntityId(newsletterId: string, subscriberId: string): string {
  return `${newsletterId}:${subscriberId}`
}

function failure(
  status: number,
  body: Record<string, unknown>,
): SendNewsletterResult {
  return { status, body }
}

async function priorOutcomes(
  store: NewsletterSendStore,
  newsletterId: string,
): Promise<Map<string, EventRow[]>> {
  const rows = await store.operationalEvent.findMany({
    where: {
      entityType: NEWSLETTER_RECIPIENT_ENTITY,
      entityId: { startsWith: `${newsletterId}:` },
      type: {
        in: [
          "newsletter_recipient_accepted",
          "newsletter_recipient_failed",
          "newsletter_recipient_claimed",
          "newsletter_recipient_ambiguous",
        ],
      },
    },
  })
  const map = new Map<string, EventRow[]>()
  for (const row of rows) {
    if (!row.entityId) continue
    const list = map.get(row.entityId) ?? []
    list.push(row)
    map.set(row.entityId, list)
  }
  return map
}

function decidePrior(
  events: EventRow[] | undefined,
):
  | { action: "send" }
  | { action: "skip"; outcome: RecipientOutcome["outcome"]; error?: string } {
  if (!events || events.length === 0) return { action: "send" }
  if (events.some((e) => e.type === "newsletter_recipient_accepted")) {
    return { action: "skip", outcome: "skipped_duplicate" }
  }
  if (events.some((e) => e.type === "newsletter_recipient_ambiguous")) {
    return {
      action: "skip",
      outcome: "skipped_ambiguous",
      error:
        "Prior send outcome was ambiguous; not retrying without operator review.",
    }
  }
  if (events.some((e) => e.type === "newsletter_recipient_claimed")) {
    const hasTerminalFailure = events.some(
      (e) => e.type === "newsletter_recipient_failed",
    )
    if (!hasTerminalFailure) {
      return {
        action: "skip",
        outcome: "skipped_ambiguous",
        error: "Prior claim has no terminal outcome; treated as ambiguous.",
      }
    }
  }
  return { action: "send" }
}

async function recordRecipient(
  store: NewsletterSendStore,
  data: Record<string, unknown>,
) {
  try {
    await store.operationalEvent.create({ data })
  } catch {
    // Ledger write failure must not invent delivery success.
  }
}

export async function sendApprovedNewsletter(input: {
  newsletterId: string
  actor: string
  origin: string
  store: NewsletterSendStore
  mode?: "list" | "single-recipient-test"
  testRecipient?: string
  confirmSingleRecipientTest?: boolean
  env?: NodeJS.ProcessEnv
  createClient?: (apiKey: string) => { emails: { send: (payload: Record<string, unknown>) => Promise<{ data: { id?: string } | null; error: { message?: string } | null }> } }
}): Promise<SendNewsletterResult> {
  const env = input.env ?? process.env
  const config = resolveNewsletterConfig(env)
  if (!config.ok) {
    return failure(500, { ok: false, code: config.code, error: config.error })
  }

  const mode = input.mode ?? "list"
  if (mode === "single-recipient-test") {
    if (input.confirmSingleRecipientTest !== true) {
      return failure(400, {
        ok: false,
        code: "test_confirmation_required",
        error:
          "Single-recipient test requires confirmSingleRecipientTest: true.",
      })
    }
    const testTo =
      typeof input.testRecipient === "string"
        ? input.testRecipient.trim().toLowerCase()
        : ""
    if (!testTo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testTo)) {
      return failure(400, {
        ok: false,
        code: "invalid_test_recipient",
        error: "A valid testRecipient email is required.",
      })
    }

    const newsletter = await input.store.newsletter.findUnique({
      where: { id: input.newsletterId },
    })
    if (!newsletter) {
      return failure(404, { ok: false, error: "Newsletter not found" })
    }
    if (newsletter.status !== "approved" && newsletter.status !== "sent") {
      return failure(403, {
        ok: false,
        error: "Newsletter must be approved before a test send.",
      })
    }

    const { html, listUnsubscribeUrl } = buildNewsletterHtml({
      previewText: newsletter.previewText,
      content: newsletter.content,
      recipientEmail: testTo,
      origin: input.origin,
      senderLabel: config.from,
      env,
    })

    const client =
      input.createClient?.(config.apiKey) ??
      (new Resend(config.apiKey) as unknown as {
        emails: {
          send: (payload: Record<string, unknown>) => Promise<{
            data: { id?: string } | null
            error: { message?: string } | null
          }>
        }
      })

    let providerMessageId: string | undefined
    let providerError: string | undefined
    try {
      const result = await client.emails.send({
        from: config.from,
        to: testTo,
        subject: `[TEST] ${newsletter.subject}`,
        html,
        headers: listUnsubscribeUrl
          ? { "List-Unsubscribe": `<${listUnsubscribeUrl}>` }
          : undefined,
        tags: [{ name: "newsletter_mode", value: "single_recipient_test" }],
      })
      if (result.error) {
        providerError = result.error.message || "Provider rejected test send"
      } else {
        providerMessageId = result.data?.id
      }
    } catch (error) {
      providerError =
        error instanceof Error ? error.message : "Provider request failed"
    }

    await recordRecipient(input.store, {
      type: providerError
        ? "newsletter_test_failed"
        : "newsletter_test_accepted",
      source: "newsletter",
      title: providerError
        ? "Newsletter single-recipient test failed"
        : "Newsletter single-recipient test accepted by provider",
      message: providerError
        ? providerError
        : "Provider accepted the test API request. This is not inbox-delivery confirmation.",
      severity: providerError ? "high" : "info",
      status: "new",
      entityType: "Newsletter",
      entityId: newsletter.id,
      payload: {
        mode: "single-recipient-test",
        actor: input.actor,
        emailHash: emailHash(testTo),
        providerMessageId: providerMessageId ?? null,
        providerAccepted: !providerError,
        inboxDeliveryClaimed: false,
        listTouched: false,
      },
    })

    if (providerError) {
      return failure(502, {
        ok: false,
        code: "provider_rejected",
        error: providerError,
        providerAccepted: false,
        inboxDeliveryClaimed: false,
      })
    }

    return {
      status: 200,
      body: {
        ok: true,
        mode: "single-recipient-test",
        providerAccepted: true,
        providerMessageId: providerMessageId ?? null,
        inboxDeliveryClaimed: false,
        newsletterStatusUnchanged: true,
        listTouched: false,
        note: "Provider accepted the API request. Webhooks may later confirm delivery; acceptance alone is not inbox delivery.",
      },
    }
  }

  if (!newsletterLiveListDistributionAllowed(env)) {
    return failure(403, {
      ok: false,
      code: "live_list_disabled",
      error:
        "Live subscriber-list distribution is disabled in this environment. Use single-recipient test after Director confirmation.",
    })
  }

  const newsletter = await input.store.newsletter.findUnique({
    where: { id: input.newsletterId },
  })
  if (!newsletter) {
    return failure(404, { ok: false, error: "Newsletter not found" })
  }
  if (newsletter.status === "sent") {
    return failure(400, {
      ok: false,
      error: "This newsletter has already been sent.",
    })
  }
  if (newsletter.status !== "approved" && newsletter.status !== "partially-sent") {
    return failure(403, {
      ok: false,
      error: "Newsletter must be approved first",
    })
  }

  const subscribers = await input.store.subscriber.findMany({
    where: { status: "active" },
  })
  if (subscribers.length === 0) {
    return failure(400, {
      ok: false,
      error: "No active subscribers found",
    })
  }

  const priors = await priorOutcomes(input.store, newsletter.id)
  const client =
    input.createClient?.(config.apiKey) ??
    (new Resend(config.apiKey) as unknown as {
      emails: {
        send: (payload: Record<string, unknown>) => Promise<{
          data: { id?: string } | null
          error: { message?: string } | null
        }>
      }
    })

  const outcomes: RecipientOutcome[] = []

  for (const subscriber of subscribers) {
    if (subscriber.status !== "active") {
      outcomes.push({
        subscriberId: subscriber.id,
        emailHash: emailHash(subscriber.email),
        outcome: "skipped_unsubscribed",
      })
      continue
    }

    const entityId = recipientEntityId(newsletter.id, subscriber.id)
    const prior = decidePrior(priors.get(entityId))
    if (prior.action === "skip") {
      outcomes.push({
        subscriberId: subscriber.id,
        emailHash: emailHash(subscriber.email),
        outcome: prior.outcome,
        error: prior.error,
      })
      continue
    }

    await recordRecipient(input.store, {
      type: "newsletter_recipient_claimed",
      source: "newsletter",
      title: "Newsletter recipient send claimed",
      message: "A single recipient send attempt was claimed.",
      severity: "info",
      status: "new",
      entityType: NEWSLETTER_RECIPIENT_ENTITY,
      entityId,
      payload: {
        newsletterId: newsletter.id,
        subscriberId: subscriber.id,
        emailHash: emailHash(subscriber.email),
        actor: input.actor,
      },
    })

    const { html, listUnsubscribeUrl } = buildNewsletterHtml({
      previewText: newsletter.previewText,
      content: newsletter.content,
      recipientEmail: subscriber.email,
      origin: input.origin,
      senderLabel: config.from,
      env,
    })

    try {
      const result = await client.emails.send({
        from: config.from,
        to: subscriber.email,
        subject: newsletter.subject,
        html,
        headers: listUnsubscribeUrl
          ? { "List-Unsubscribe": `<${listUnsubscribeUrl}>` }
          : undefined,
      })

      if (result.error) {
        await recordRecipient(input.store, {
          type: "newsletter_recipient_failed",
          source: "newsletter",
          title: "Newsletter recipient provider rejection",
          message: result.error.message || "Provider rejected send",
          severity: "high",
          status: "new",
          entityType: NEWSLETTER_RECIPIENT_ENTITY,
          entityId,
          payload: {
            newsletterId: newsletter.id,
            subscriberId: subscriber.id,
            emailHash: emailHash(subscriber.email),
            providerAccepted: false,
            inboxDeliveryClaimed: false,
          },
        })
        outcomes.push({
          subscriberId: subscriber.id,
          emailHash: emailHash(subscriber.email),
          outcome: "failed",
          error: result.error.message || "Provider rejected send",
          providerAccepted: false,
        })
        continue
      }

      const messageId = result.data?.id
      if (!messageId) {
        await recordRecipient(input.store, {
          type: "newsletter_recipient_ambiguous",
          source: "newsletter",
          title: "Newsletter recipient outcome ambiguous",
          message:
            "Provider returned no message id; delivery state is ambiguous.",
          severity: "high",
          status: "new",
          entityType: NEWSLETTER_RECIPIENT_ENTITY,
          entityId,
          payload: {
            newsletterId: newsletter.id,
            subscriberId: subscriber.id,
            emailHash: emailHash(subscriber.email),
            providerAccepted: false,
            inboxDeliveryClaimed: false,
          },
        })
        outcomes.push({
          subscriberId: subscriber.id,
          emailHash: emailHash(subscriber.email),
          outcome: "skipped_ambiguous",
          error: "Provider returned no message id",
        })
        continue
      }

      await recordRecipient(input.store, {
        type: "newsletter_recipient_accepted",
        source: "newsletter",
        title: "Newsletter recipient accepted by provider",
        message:
          "Provider accepted the API request. This is not inbox-delivery confirmation.",
        severity: "info",
        status: "new",
        entityType: NEWSLETTER_RECIPIENT_ENTITY,
        entityId,
        payload: {
          newsletterId: newsletter.id,
          subscriberId: subscriber.id,
          emailHash: emailHash(subscriber.email),
          providerMessageId: messageId,
          providerAccepted: true,
          inboxDeliveryClaimed: false,
        },
      })
      outcomes.push({
        subscriberId: subscriber.id,
        emailHash: emailHash(subscriber.email),
        outcome: "accepted",
        providerMessageId: messageId,
        providerAccepted: true,
      })
    } catch (error) {
      await recordRecipient(input.store, {
        type: "newsletter_recipient_ambiguous",
        source: "newsletter",
        title: "Newsletter recipient outcome ambiguous",
        message:
          error instanceof Error ? error.message : "Provider request failed",
        severity: "high",
        status: "new",
        entityType: NEWSLETTER_RECIPIENT_ENTITY,
        entityId,
        payload: {
          newsletterId: newsletter.id,
          subscriberId: subscriber.id,
          emailHash: emailHash(subscriber.email),
          providerAccepted: false,
          inboxDeliveryClaimed: false,
          uncertain: true,
        },
      })
      outcomes.push({
        subscriberId: subscriber.id,
        emailHash: emailHash(subscriber.email),
        outcome: "skipped_ambiguous",
        error:
          error instanceof Error ? error.message : "Provider request failed",
      })
    }
  }

  const accepted = outcomes.filter((o) => o.outcome === "accepted").length
  const failed = outcomes.filter((o) => o.outcome === "failed").length
  const ambiguous = outcomes.filter(
    (o) => o.outcome === "skipped_ambiguous",
  ).length
  const pendingWork =
    outcomes.filter((o) => o.outcome === "failed").length > 0 ||
    outcomes.some(
      (o) =>
        o.outcome !== "accepted" &&
        o.outcome !== "skipped_duplicate" &&
        o.outcome !== "skipped_unsubscribed" &&
        o.outcome !== "skipped_ambiguous",
    )

  // Mark sent only when every active recipient is accepted or safely skipped as duplicate.
  const allSettledOk = outcomes.every(
    (o) =>
      o.outcome === "accepted" ||
      o.outcome === "skipped_duplicate" ||
      o.outcome === "skipped_unsubscribed",
  )
  const anyAccepted = accepted > 0

  let updated = newsletter
  if (allSettledOk && anyAccepted) {
    updated = await input.store.newsletter.update({
      where: { id: newsletter.id },
      data: { status: "sent", sentAt: new Date() },
    })
  } else if (anyAccepted || failed > 0 || ambiguous > 0) {
    updated = await input.store.newsletter.update({
      where: { id: newsletter.id },
      data: { status: "partially-sent" },
    })
  }

  const ok = allSettledOk && anyAccepted
  return {
    status: ok ? 200 : 207,
    body: {
      ok,
      providerAcceptedCount: accepted,
      failedCount: failed,
      ambiguousCount: ambiguous,
      outcomes,
      newsletter: updated,
      inboxDeliveryClaimed: false,
      note: "Provider acceptance is recorded per recipient. Inbox delivery is not claimed without delivery webhooks.",
      pendingWork,
    },
  }
}
