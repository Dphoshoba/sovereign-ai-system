import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it, vi } from "vitest"
import { approveFeaturedImagePrompt } from "../../lib/ai/approve-featured-image-prompt"
import {
  FEATURED_IMAGE_PROMPT_APPROVED_ACTION,
  MAX_FEATURED_IMAGE_PROMPT_LENGTH,
  computeArticleContentFingerprint,
  inspectFeaturedImagePromptState,
  parseFeaturedImagePromptNote,
  requireCurrentFeaturedImagePrompt,
  serializeFeaturedImagePromptNote,
} from "../../lib/ai/featured-image-prompt"
import { generateAndPersistFeaturedImage } from "../../lib/ai/persist-featured-image"
import {
  RESEARCH_AUDIT_FINGERPRINT_ACTION,
  serializeArticleAuditAssociation,
} from "../../lib/research/article-audit-association"
import { MINIMAL_PNG } from "./article-images.test"
import { ARTICLE_2_FEATURED_IMAGE_PROMPT } from "./fixtures/article-2-featured-image-prompt"

const sourceUrl = "https://www.nist.gov/itl/ai-risk-management-framework"
const approvedAt = "2026-09-18T11:55:51.914Z"
const actor = "dphogeorge@gmail.com"

function baseArticle() {
  return {
    id: "cmqm9s0hp000004unmb0j817s",
    slug: "ai-business-infrastructure-founders-ministries-teams",
    title:
      "AI as Business Infrastructure: How Founders, Ministries, and Teams Move Beyond One-Off Tools",
    category: "ai-tools",
    content: `See [NIST](${sourceUrl}).`,
    excerpt: "Governed AI infrastructure for teams.",
    seoTitle: "AI as Business Infrastructure",
    seoDescription: "Move beyond one-off tools.",
    seoKeywords: "AI infrastructure, governance",
    featuredImage: null,
    status: "approved",
    approvedAt: new Date(approvedAt),
    approvedBy: actor,
    scheduledFor: null,
    publishedAt: null,
    researchSources: [
      {
        title: "NIST AI RMF",
        url: sourceUrl,
        sourceType: "stored-research-source",
        authorityScore: 90,
        trustScore: 90,
      },
    ],
    researchAudits: [
      {
        id: "cmu6wb5tz000004jq531afq3x",
        articleId: "cmqm9s0hp000004unmb0j817s",
        createdAt: new Date("2026-09-18T11:50:00.000Z"),
      },
    ],
    reviewNotes: [] as Array<{
      id?: string
      action: string
      note: string | null
      createdAt?: Date | string
      reviewer?: string
    }>,
  }
}

function withCurrentAudit(article: ReturnType<typeof baseArticle>) {
  const fingerprint = computeArticleContentFingerprint(article)
  article.reviewNotes.push({
    id: "assoc-1",
    action: RESEARCH_AUDIT_FINGERPRINT_ACTION,
    note: serializeArticleAuditAssociation({
      auditId: article.researchAudits[0].id,
      contentFingerprint: fingerprint,
      createdAt: new Date(article.researchAudits[0].createdAt),
    }),
  })
  return { article, fingerprint }
}

function promptNote(input: {
  articleId: string
  fingerprint: string
  prompt: string
  approvedAt?: string
  approvedBy?: string
  id?: string
}) {
  return {
    id: input.id ?? "prompt-1",
    action: FEATURED_IMAGE_PROMPT_APPROVED_ACTION,
    reviewer: input.approvedBy ?? actor,
    createdAt: new Date(input.approvedAt ?? "2026-09-18T12:00:00.000Z"),
    note: serializeFeaturedImagePromptNote({
      version: 1,
      articleId: input.articleId,
      contentFingerprint: input.fingerprint,
      prompt: input.prompt,
      approvedAt: input.approvedAt ?? "2026-09-18T12:00:00.000Z",
      approvedBy: input.approvedBy ?? actor,
    }),
  }
}

function createStore(
  article: ReturnType<typeof baseArticle>,
  update = vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
    Object.assign(article, data)
    return { ...article, ...data }
  }),
) {
  const tx = {
    $queryRaw: vi.fn(async () => [{ id: article.id }]),
    article: {
      findUnique: vi.fn(async () => article),
      update,
    },
    articleReviewNote: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const created = {
          id: `note-${article.reviewNotes.length + 1}`,
          action: String(data.action),
          note: String(data.note),
          reviewer: String(data.reviewer),
          createdAt: new Date("2026-09-18T12:00:00.000Z"),
        }
        article.reviewNotes.push(created)
        return created
      }),
    },
    publishingQueue: { update: vi.fn() },
  }
  return {
    $transaction: async (fn: (client: typeof tx) => unknown) => fn(tx),
    article: {
      findUnique: async () => article,
      update,
    },
    articleReviewNote: tx.articleReviewNote,
    tx,
    update,
  }
}

describe("featured-image prompt contract", () => {
  it("round-trips the strict payload and rejects extra or missing keys", () => {
    const { article, fingerprint } = withCurrentAudit(baseArticle())
    const serialized = serializeFeaturedImagePromptNote({
      version: 1,
      articleId: article.id,
      contentFingerprint: fingerprint,
      prompt: ARTICLE_2_FEATURED_IMAGE_PROMPT,
      approvedAt: "2026-09-18T12:00:00.000Z",
      approvedBy: actor,
    })

    expect(
      parseFeaturedImagePromptNote({
        action: FEATURED_IMAGE_PROMPT_APPROVED_ACTION,
        note: serialized,
      }),
    ).toMatchObject({
      version: 1,
      articleId: article.id,
      contentFingerprint: fingerprint,
      prompt: ARTICLE_2_FEATURED_IMAGE_PROMPT,
      approvedBy: actor,
    })

    expect(
      parseFeaturedImagePromptNote({
        action: FEATURED_IMAGE_PROMPT_APPROVED_ACTION,
        note: JSON.stringify({
          version: 1,
          articleId: article.id,
          contentFingerprint: fingerprint,
          prompt: ARTICLE_2_FEATURED_IMAGE_PROMPT,
          approvedAt: "2026-09-18T12:00:00.000Z",
          approvedBy: actor,
          extra: true,
        }),
      }),
    ).toBeNull()

    expect(
      parseFeaturedImagePromptNote({
        action: FEATURED_IMAGE_PROMPT_APPROVED_ACTION,
        note: JSON.stringify({
          version: 2,
          articleId: article.id,
          contentFingerprint: fingerprint,
          prompt: ARTICLE_2_FEATURED_IMAGE_PROMPT,
          approvedAt: "2026-09-18T12:00:00.000Z",
          approvedBy: actor,
        }),
      }),
    ).toBeNull()

    expect(
      parseFeaturedImagePromptNote({
        action: FEATURED_IMAGE_PROMPT_APPROVED_ACTION,
        note: JSON.stringify({
          version: 1,
          articleId: article.id,
          contentFingerprint: fingerprint.toUpperCase(),
          prompt: ARTICLE_2_FEATURED_IMAGE_PROMPT,
          approvedAt: "2026-09-18T12:00:00.000Z",
          approvedBy: actor,
        }),
      }),
    ).toBeNull()

    expect(
      parseFeaturedImagePromptNote({
        action: FEATURED_IMAGE_PROMPT_APPROVED_ACTION,
        note: JSON.stringify({
          version: 1,
          articleId: article.id,
          contentFingerprint: fingerprint,
          prompt: ARTICLE_2_FEATURED_IMAGE_PROMPT,
          approvedAt: "2026-09-18T12:00:00Z",
          approvedBy: actor,
        }),
      }),
    ).toBeNull()

    expect(
      parseFeaturedImagePromptNote({
        action: FEATURED_IMAGE_PROMPT_APPROVED_ACTION,
        note: JSON.stringify({
          version: 1,
          articleId: article.id,
          contentFingerprint: fingerprint,
          prompt: ` ${ARTICLE_2_FEATURED_IMAGE_PROMPT} `,
          approvedAt: "2026-09-18T12:00:00.000Z",
          approvedBy: actor,
        }),
      }),
    ).toBeNull()

    expect(
      parseFeaturedImagePromptNote({
        action: FEATURED_IMAGE_PROMPT_APPROVED_ACTION,
        note: JSON.stringify({
          version: 1,
          articleId: article.id,
          prompt: ARTICLE_2_FEATURED_IMAGE_PROMPT,
          approvedAt: "2026-09-18T12:00:00.000Z",
          approvedBy: actor,
        }),
      }),
    ).toBeNull()

    expect(
      parseFeaturedImagePromptNote({
        action: "content-remediated-audit-stale",
        note: `featuredImagePrompt: ${ARTICLE_2_FEATURED_IMAGE_PROMPT}`,
      }),
    ).toBeNull()
  })

  it("does not treat a historical governance note as an approved prompt", () => {
    const { article } = withCurrentAudit(baseArticle())
    article.reviewNotes.push({
      id: "cmu2ii7280004bnunscknmt88",
      action: "content-remediated-audit-stale",
      note: `featuredImagePrompt: ${ARTICLE_2_FEATURED_IMAGE_PROMPT}`,
    })

    const inspected = inspectFeaturedImagePromptState(article)
    expect(inspected.ok).toBe(true)
    if (!inspected.ok) throw new Error("expected inspect ok")
    expect(inspected.promptStatus).toBe("missing")
    expect(inspected.current).toBeNull()
  })
})

describe("approveFeaturedImagePrompt", () => {
  it("rejects a non-approved article without writing a note", async () => {
    const { article } = withCurrentAudit(baseArticle())
    article.status = "review-required"
    const store = createStore(article)

    const result = await approveFeaturedImagePrompt(
      { articleId: article.id, prompt: ARTICLE_2_FEATURED_IMAGE_PROMPT, actor },
      { prisma: store },
    )

    expect(result).toMatchObject({
      ok: false,
      code: "invalid_status",
      articleUnchanged: true,
    })
    expect(store.tx.articleReviewNote.create).not.toHaveBeenCalled()
  })

  it("rejects a missing current audit without writing a note", async () => {
    const article = baseArticle()
    const store = createStore(article)

    const result = await approveFeaturedImagePrompt(
      { articleId: article.id, prompt: ARTICLE_2_FEATURED_IMAGE_PROMPT, actor },
      { prisma: store },
    )

    expect(result).toMatchObject({
      ok: false,
      code: "missing_audit",
      articleUnchanged: true,
    })
    expect(store.tx.articleReviewNote.create).not.toHaveBeenCalled()
  })

  it("rejects an oversized prompt without writing a note", async () => {
    const { article } = withCurrentAudit(baseArticle())
    const store = createStore(article)

    const result = await approveFeaturedImagePrompt(
      {
        articleId: article.id,
        prompt: "x".repeat(MAX_FEATURED_IMAGE_PROMPT_LENGTH + 1),
        actor,
      },
      { prisma: store },
    )

    expect(result).toMatchObject({
      ok: false,
      code: "invalid_prompt",
      articleUnchanged: true,
    })
    expect(store.tx.articleReviewNote.create).not.toHaveBeenCalled()
  })

  it("approves a current fingerprint-bound prompt", async () => {
    const { article, fingerprint } = withCurrentAudit(baseArticle())
    const store = createStore(article)

    const result = await approveFeaturedImagePrompt(
      { articleId: article.id, prompt: ARTICLE_2_FEATURED_IMAGE_PROMPT, actor },
      { prisma: store },
    )

    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error("expected approval")
    expect(result.alreadyApplied).toBe(false)
    expect(result.prompt.prompt).toBe(ARTICLE_2_FEATURED_IMAGE_PROMPT)
    expect(result.prompt.contentFingerprint).toBe(fingerprint)
    expect(result.prompt.approvedBy).toBe(actor)
    expect(store.tx.articleReviewNote.create).toHaveBeenCalledTimes(1)
    expect(store.update).not.toHaveBeenCalled()
  })

  it("is idempotent for the same prompt and fingerprint", async () => {
    const { article, fingerprint } = withCurrentAudit(baseArticle())
    article.reviewNotes.push(
      promptNote({
        articleId: article.id,
        fingerprint,
        prompt: ARTICLE_2_FEATURED_IMAGE_PROMPT,
      }),
    )
    const store = createStore(article)

    const result = await approveFeaturedImagePrompt(
      { articleId: article.id, prompt: ARTICLE_2_FEATURED_IMAGE_PROMPT, actor },
      { prisma: store },
    )

    expect(result).toMatchObject({
      ok: true,
      alreadyApplied: true,
      articleUnchanged: true,
    })
    expect(store.tx.articleReviewNote.create).not.toHaveBeenCalled()
  })

  it("requires an explicit replace flag and keeps the previous note", async () => {
    const { article, fingerprint } = withCurrentAudit(baseArticle())
    article.reviewNotes.push(
      promptNote({
        articleId: article.id,
        fingerprint,
        prompt: ARTICLE_2_FEATURED_IMAGE_PROMPT,
        id: "prompt-old",
      }),
    )
    const store = createStore(article)

    const denied = await approveFeaturedImagePrompt(
      {
        articleId: article.id,
        prompt: `${ARTICLE_2_FEATURED_IMAGE_PROMPT} Additional calm negative space.`,
        actor,
      },
      { prisma: store },
    )
    expect(denied).toMatchObject({
      ok: false,
      code: "replacement_required",
      articleUnchanged: true,
    })
    expect(store.tx.articleReviewNote.create).not.toHaveBeenCalled()

    const replaced = await approveFeaturedImagePrompt(
      {
        articleId: article.id,
        prompt: `${ARTICLE_2_FEATURED_IMAGE_PROMPT} Additional calm negative space.`,
        replace: true,
        actor,
        now: new Date("2026-09-18T13:00:00.000Z"),
      },
      { prisma: store },
    )
    expect(replaced.ok).toBe(true)
    if (!replaced.ok) throw new Error("expected replacement")
    expect(replaced.alreadyApplied).toBe(false)
    expect(article.reviewNotes.filter((note) => note.action === FEATURED_IMAGE_PROMPT_APPROVED_ACTION)).toHaveLength(2)
    expect(article.reviewNotes.some((note) => note.id === "prompt-old")).toBe(true)

    const inspected = inspectFeaturedImagePromptState(article)
    expect(inspected.ok).toBe(true)
    if (!inspected.ok) throw new Error("expected current after replace")
    expect(inspected.current?.prompt).toContain("Additional calm negative space")
    expect(inspected.superseded).toHaveLength(1)
    expect(inspected.superseded[0]?.noteId).toBe("prompt-old")
  })

  it("marks a prompt historical-stale after content or source change", async () => {
    const { article, fingerprint } = withCurrentAudit(baseArticle())
    article.reviewNotes.push(
      promptNote({
        articleId: article.id,
        fingerprint,
        prompt: ARTICLE_2_FEATURED_IMAGE_PROMPT,
      }),
    )

    article.content = `${article.content} A new paragraph.`
    const inspected = inspectFeaturedImagePromptState(article)
    expect(inspected.ok).toBe(true)
    if (!inspected.ok) throw new Error("expected stale inspect")
    expect(inspected.promptStatus).toBe("historical-stale")
    expect(inspected.current).toBeNull()
    expect(inspected.historicalStale[0]?.prompt).toBe(ARTICLE_2_FEATURED_IMAGE_PROMPT)

    const nextFingerprint = computeArticleContentFingerprint(article)
    article.researchAudits.push({
      id: "audit-after-edit",
      articleId: article.id,
      createdAt: new Date("2026-09-18T14:00:00.000Z"),
    })
    article.reviewNotes.push({
      id: "assoc-2",
      action: RESEARCH_AUDIT_FINGERPRINT_ACTION,
      note: serializeArticleAuditAssociation({
        auditId: "audit-after-edit",
        contentFingerprint: nextFingerprint,
        createdAt: new Date("2026-09-18T14:00:00.000Z"),
      }),
    })

    const required = requireCurrentFeaturedImagePrompt(article)
    expect(required).toMatchObject({
      ok: false,
      code: "stale_approved_featured_image_prompt",
      articleUnchanged: true,
    })

    const sourced = withCurrentAudit(baseArticle()).article
    sourced.reviewNotes.push(
      promptNote({
        articleId: sourced.id,
        fingerprint: computeArticleContentFingerprint(sourced),
        prompt: ARTICLE_2_FEATURED_IMAGE_PROMPT,
      }),
    )
    sourced.researchSources = [
      {
        ...sourced.researchSources[0],
        url: "https://www.cisa.gov/ai",
      },
    ]
    const sourceChanged = inspectFeaturedImagePromptState(sourced)
    expect(sourceChanged.ok).toBe(true)
    if (!sourceChanged.ok) throw new Error("expected source-stale inspect")
    expect(sourceChanged.promptStatus).toBe("historical-stale")
  })
})

describe("generateAndPersistFeaturedImage approved-prompt gate", () => {
  it("fails closed without a current approved prompt and does not generate", async () => {
    const { article } = withCurrentAudit(baseArticle())
    const generateImage = vi.fn()
    const persistImage = vi.fn()
    const store = createStore(article)

    const result = await generateAndPersistFeaturedImage({
      articleId: article.id,
      prisma: store,
      generateImage,
      persistImage,
    })

    expect(result).toMatchObject({
      ok: false,
      code: "missing_approved_featured_image_prompt",
      articleUnchanged: true,
    })
    expect(generateImage).not.toHaveBeenCalled()
    expect(persistImage).not.toHaveBeenCalled()
    expect(store.update).not.toHaveBeenCalled()
  })

  it("fails closed for malformed and cross-article notes", async () => {
    const { article, fingerprint } = withCurrentAudit(baseArticle())
    article.reviewNotes.push({
      id: "bad-json",
      action: FEATURED_IMAGE_PROMPT_APPROVED_ACTION,
      note: "{not-json",
    })
    const generateImage = vi.fn()
    const malformed = await generateAndPersistFeaturedImage({
      articleId: article.id,
      prisma: createStore(article),
      generateImage,
    })
    expect(malformed).toMatchObject({
      ok: false,
      code: "malformed_featured_image_prompt",
      articleUnchanged: true,
    })
    expect(generateImage).not.toHaveBeenCalled()

    const other = withCurrentAudit(baseArticle()).article
    other.reviewNotes = [
      ...other.reviewNotes,
      promptNote({
        articleId: "other-article",
        fingerprint,
        prompt: ARTICLE_2_FEATURED_IMAGE_PROMPT,
      }),
    ]
    const cross = await generateAndPersistFeaturedImage({
      articleId: other.id,
      prisma: createStore(other),
      generateImage,
    })
    expect(cross).toMatchObject({
      ok: false,
      code: "cross_article_featured_image_prompt",
      articleUnchanged: true,
    })
  })

  it("passes the exact approved prompt to the provider and never uses a fallback", async () => {
    const { article, fingerprint } = withCurrentAudit(baseArticle())
    article.reviewNotes.push(
      promptNote({
        articleId: article.id,
        fingerprint,
        prompt: ARTICLE_2_FEATURED_IMAGE_PROMPT,
      }),
    )
    const store = createStore(article)
    const seen: string[] = []

    const result = await generateAndPersistFeaturedImage({
      articleId: article.id,
      prisma: store,
      generateImage: async (prompt) => {
        seen.push(prompt)
        return MINIMAL_PNG.toString("base64")
      },
      persistImage: async () => ({
        ok: true,
        imageUrl:
          "https://kqptdgbttfuqkzxzbazw.supabase.co/storage/v1/object/public/article-images/ai-business-infrastructure-founders-ministries-teams/img.png",
        objectPath:
          "ai-business-infrastructure-founders-ministries-teams/img.png",
      }),
    })

    expect(result.ok).toBe(true)
    expect(seen).toEqual([ARTICLE_2_FEATURED_IMAGE_PROMPT])
    expect(seen[0]).not.toContain("elegant premium SaaS")
    if (!result.ok || !("imageUrl" in result)) throw new Error("expected persist")
    expect(article.featuredImage).toBe(result.imageUrl)
    expect(article.status).toBe("approved")
    expect(article.approvedBy).toBe(actor)
    expect(article.scheduledFor).toBeNull()
    expect(article.publishedAt).toBeNull()
    expect(article.content).toContain("NIST")
    expect(article.researchSources).toHaveLength(1)
    expect(article.researchAudits).toHaveLength(1)
  })

  it("leaves the article unchanged when the provider or upload fails", async () => {
    const { article, fingerprint } = withCurrentAudit(baseArticle())
    article.reviewNotes.push(
      promptNote({
        articleId: article.id,
        fingerprint,
        prompt: ARTICLE_2_FEATURED_IMAGE_PROMPT,
      }),
    )

    const provider = await generateAndPersistFeaturedImage({
      articleId: article.id,
      prisma: createStore(article),
      generateImage: async () => {
        throw new Error("provider down")
      },
    })
    expect(provider).toMatchObject({
      ok: false,
      code: "featured_image_generation_failed",
      articleUnchanged: true,
    })
    expect(article.featuredImage).toBeNull()
    expect(article.status).toBe("approved")

    const uploadStore = createStore(article)
    const upload = await generateAndPersistFeaturedImage({
      articleId: article.id,
      prisma: uploadStore,
      generateImage: async () => MINIMAL_PNG.toString("base64"),
      persistImage: async () => ({ ok: false, error: "Image upload failed" }),
    })
    expect(upload).toMatchObject({
      ok: false,
      articleUnchanged: true,
    })
    expect(uploadStore.update).not.toHaveBeenCalled()
    expect(article.featuredImage).toBeNull()
  })

  it("rejects ambiguous current prompts that share an approval timestamp", () => {
    const { article, fingerprint } = withCurrentAudit(baseArticle())
    article.reviewNotes.push(
      promptNote({
        articleId: article.id,
        fingerprint,
        prompt: "Calm operations hub with human approval gates.",
        approvedAt: "2026-09-18T12:00:00.000Z",
        id: "prompt-a",
      }),
      promptNote({
        articleId: article.id,
        fingerprint,
        prompt: "A different five-layer operations hub.",
        approvedAt: "2026-09-18T12:00:00.000Z",
        id: "prompt-b",
      }),
    )

    expect(requireCurrentFeaturedImagePrompt(article)).toMatchObject({
      ok: false,
      code: "ambiguous_featured_image_prompt",
      articleUnchanged: true,
    })
  })

  it("does not contain a Production generic fallback prompt", () => {
    const source = readFileSync(
      join(process.cwd(), "lib/ai/persist-featured-image.ts"),
      "utf8",
    )
    expect(source).not.toContain("buildFallbackPrompt")
    expect(source).not.toContain("elegant premium SaaS")
    expect(source).not.toContain("abstract creator workspace")
    expect(source).not.toMatch(/NODE_ENV[\s\S]{0,80}fallback/)
  })

  it("does not hardcode Article 2’s prompt in production code and stays schema-neutral", () => {
    const productionSources = [
      "lib/ai/persist-featured-image.ts",
      "lib/ai/featured-image-prompt.ts",
      "lib/ai/approve-featured-image-prompt.ts",
      "app/api/ai/generate-featured-image/route.ts",
      "app/api/articles/featured-image-prompt/route.ts",
    ].map((relative) => readFileSync(join(process.cwd(), relative), "utf8"))

    for (const source of productionSources) {
      expect(source).not.toContain("five clearly differentiated layers")
      expect(source).not.toContain(ARTICLE_2_FEATURED_IMAGE_PROMPT)
    }

    const schema = readFileSync(join(process.cwd(), "prisma/schema.prisma"), "utf8")
    expect(schema).not.toContain("featuredImagePrompt")
    expect(schema).not.toContain("featured-image-prompt-approved")
  })
})
