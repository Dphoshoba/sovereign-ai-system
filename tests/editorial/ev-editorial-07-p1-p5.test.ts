import { describe, expect, it, vi } from "vitest"
import {
  buildEvidenceHoldReason,
  classifyEvidenceFailure,
  evidenceRecoveryDelayMs,
  isTransientEvidenceFailure,
  withBoundedEvidenceRecovery,
} from "../../lib/research/evidence-recovery"
import {
  assertSlotNotEarly,
  DEFAULT_PUBLISHING_SLOT_POLICY,
  nextPublishingSlot,
} from "../../lib/publishing/publishing-calendar-policy"
import {
  buildDirectorDecisionQueue,
  classifyDirectorQueueBucket,
  groupDirectorDecisionQueue,
} from "../../lib/publishing/director-decision-queue"
import { prepareFeaturedImageAfterApproval } from "../../lib/publishing/post-approval-image-prep"
import { inspectSocialOpsForArticle } from "../../lib/publishing/social-ops-monitoring"
import { EDITORIAL_STAGE_HOLD_ACTION } from "../../lib/publishing/editorial-stage-runner"
import { RESEARCH_FETCH_MAX_TRANSIENT_RETRIES } from "../../lib/research/source-fetch-guard"
import { readFileSync } from "node:fs"
import { join } from "node:path"

describe("EV-EDITORIAL-07-P1 evidence recovery", () => {
  it("classifies transient vs unsupported vs irrecoverable failures", () => {
    expect(classifyEvidenceFailure("fetch failed", "audit_failure")).toBe(
      "transient",
    )
    expect(classifyEvidenceFailure("no sources", "missing_evidence")).toBe(
      "unsupported",
    )
    expect(classifyEvidenceFailure("schema mismatch", "invalid")).toBe(
      "irrecoverable",
    )
    expect(isTransientEvidenceFailure("429 rate limit")).toBe(true)
  })

  it("builds actionable HOLD reasons without inventing scores", () => {
    expect(
      buildEvidenceHoldReason({
        code: "missing_evidence",
        error: "No usable evidence",
        unsupportedClaimCount: 2,
      }),
    ).toMatch(/HOLD: evidence incomplete/)
  })

  it("retries transient work with bounded backoff", async () => {
    const sleep = vi.fn(async () => undefined)
    let calls = 0
    const { result, attempts } = await withBoundedEvidenceRecovery({
      maxAttempts: 3,
      sleep,
      run: async () => {
        calls += 1
        return { ok: calls >= 3, error: calls < 3 ? "socket hang up" : null }
      },
      isRetryable: (value) => !value.ok && isTransientEvidenceFailure(value.error),
    })
    expect(attempts).toBe(3)
    expect(result.ok).toBe(true)
    expect(sleep).toHaveBeenCalled()
    expect(evidenceRecoveryDelayMs(1)).toBeLessThanOrEqual(
      evidenceRecoveryDelayMs(3),
    )
    expect(RESEARCH_FETCH_MAX_TRANSIENT_RETRIES).toBe(2)
  })
})

describe("EV-EDITORIAL-07-P2 post-approval image prep", () => {
  it("skips image automation for unapproved articles", async () => {
    const result = await prepareFeaturedImageAfterApproval(
      { articleId: "a1", actor: "editor@example.com" },
      {
        prisma: {
          $transaction: async (fn) => fn({} as never),
          article: {
            findUnique: async () => ({
              id: "a1",
              title: "Test",
              slug: "test",
              status: "review-required",
              excerpt: null,
              content: "Enough content for a prompt body to be generated here.",
              featuredImage: null,
              researchSources: [],
              researchAudits: [],
              reviewNotes: [],
            }),
          },
        },
      },
    )
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.code).toBe("not_approved")
    expect(result.sideEffects.featuredImageGenerated).toBe(false)
    expect(result.sideEffects.published).toBe(false)
  })

  it("returns already_applied when featured image exists", async () => {
    const result = await prepareFeaturedImageAfterApproval(
      { articleId: "a1", actor: "editor@example.com" },
      {
        prisma: {
          $transaction: async (fn) => fn({} as never),
          article: {
            findUnique: async () => ({
              id: "a1",
              title: "Test",
              slug: "test",
              status: "approved",
              excerpt: null,
              content: "Enough content for a prompt body to be generated here.",
              featuredImage: "https://cdn.example/image.png",
              approvedAt: "2026-11-22T00:00:00.000Z",
              approvedBy: "editor@example.com",
              researchSources: [],
              researchAudits: [{ id: "audit-1" }],
              reviewNotes: [],
            }),
          },
        },
      },
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.outcome).toBe("already_applied")
    expect(result.sideEffects.featuredImageGenerated).toBe(false)
  })

  it("approve route wires post-approval prep without auto-publish", () => {
    const source = readFileSync(
      join(process.cwd(), "app/api/articles/approve/route.ts"),
      "utf8",
    )
    expect(source).toContain("runPostApprovalPublishPrep")
    expect(source).not.toContain('transition: "publish"')
  })
})

describe("EV-EDITORIAL-07-P3 decision queue", () => {
  it("groups review-ready, hold, and published buckets", () => {
    const items = buildDirectorDecisionQueue([
      {
        id: "1",
        title: "Ready",
        slug: "ready",
        category: "ai",
        status: "review-required",
        featuredImage: null,
        researchAudits: [
          {
            id: "a",
            publicationRecommendation: "publish-ready",
            consensusScore: 90,
            sourceQualityScore: 80,
          },
        ],
        reviewNotes: [],
        socialPosts: [],
      },
      {
        id: "2",
        title: "Held",
        slug: "held",
        category: "ai",
        status: "draft",
        featuredImage: null,
        researchAudits: [],
        reviewNotes: [
          { action: EDITORIAL_STAGE_HOLD_ACTION, note: "HOLD: evidence incomplete" },
        ],
        socialPosts: [],
      },
      {
        id: "3",
        title: "Live",
        slug: "live",
        category: "ai",
        status: "published",
        featuredImage: "/x.png",
        researchAudits: [],
        reviewNotes: [],
        socialPosts: [{ id: "s1", platform: "x", status: "draft" }],
      },
    ])

    expect(classifyDirectorQueueBucket(items[0] as never)).toBeDefined()
    const groups = groupDirectorDecisionQueue(items)
    expect(groups.review_ready.map((i) => i.articleId)).toContain("1")
    expect(groups.hold.map((i) => i.articleId)).toContain("2")
    expect(groups.published.map((i) => i.articleId)).toContain("3")
    expect(groups.published[0]?.socialDraftCount).toBe(1)
  })
})

describe("EV-EDITORIAL-07-P4 publishing calendar policy", () => {
  it("returns a future Adelaide slot that avoids occupied times", () => {
    const from = new Date("2026-11-23T00:00:00.000Z")
    const first = nextPublishingSlot({
      from,
      policy: {
        ...DEFAULT_PUBLISHING_SLOT_POLICY,
        cadenceDays: 1,
      },
    })
    expect(assertSlotNotEarly(first, from)).toBe(true)
    const occupiedMs = new Date(first).getTime()
    const second = nextPublishingSlot({
      from,
      occupiedUtc: [new Date(occupiedMs)],
      policy: DEFAULT_PUBLISHING_SLOT_POLICY,
    })
    expect(new Date(second).getTime()).not.toBe(occupiedMs)
    expect(assertSlotNotEarly(second, from)).toBe(true)
  })
})

describe("EV-EDITORIAL-07-P5 social ops monitoring", () => {
  it("preserves dual-gate alerts and canonical path checks", () => {
    const signal = inspectSocialOpsForArticle({
      articleId: "a1",
      slug: "demo-post",
      status: "published",
      posts: [
        {
          id: "s1",
          platform: "x",
          status: "draft",
          targetUrl: "https://example.com/wrong",
        },
      ],
    })
    expect(signal.canonicalPath).toBe("/blog/demo-post")
    expect(signal.needsSocialApproval).toBe(true)
    expect(signal.alerts.some((a) => /separate human approval/i.test(a))).toBe(
      true,
    )
    expect(signal.missingCanonicalUrl).toBe(true)
  })
})
