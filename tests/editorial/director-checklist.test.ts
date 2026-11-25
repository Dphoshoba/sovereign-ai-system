import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  AUTHENTICATION_REQUIRED_BODY,
  EDITOR_FORBIDDEN_BODY,
} from "../../lib/publishing/require-editor-auth";
import {
  buildDirectorChecklist,
  DIRECTOR_CHECKLIST_STEP_IDS,
  type DirectorChecklistArticle,
} from "../../lib/publishing/director-checklist";
import {
  RESEARCH_AUDIT_FINGERPRINT_ACTION,
  serializeArticleAuditAssociation,
} from "../../lib/research/article-audit-association";
import { computeArticleAuditFingerprint } from "../../lib/research/article-audit-fingerprint";
import {
  FEATURED_IMAGE_PROMPT_APPROVED_ACTION,
  serializeFeaturedImagePromptNote,
} from "../../lib/ai/featured-image-prompt";

const mockGetUser = vi.fn();
const articleFindUnique = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
  })),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    article: {
      findUnique: (...args: unknown[]) => articleFindUnique(...args),
    },
  },
}));

const SOURCE_URL = "https://www.nist.gov/artificial-intelligence";

function baseArticle(
  overrides: Partial<DirectorChecklistArticle> = {},
): DirectorChecklistArticle {
  return {
    id: "article-1",
    title: "Governed AI workflows",
    slug: "governed-ai-workflows",
    excerpt: "Evidence-backed operations.",
    content: `See [NIST](${SOURCE_URL}).`,
    category: "ai-tools",
    seoTitle: "Governed AI workflows",
    seoDescription: "Build accountable AI workflows.",
    seoKeywords: "AI governance",
    featuredImage: null,
    status: "draft",
    approvedAt: null,
    approvedBy: null,
    publishedAt: null,
    scheduledFor: null,
    researchSources: [],
    researchAudits: [],
    reviewNotes: [],
    socialPosts: [],
    ...overrides,
  };
}

function withCurrentAudit(
  article: DirectorChecklistArticle,
  scores: {
    consensusScore: number;
    sourceQualityScore: number;
    publicationRecommendation: string;
  } = {
    consensusScore: 85,
    sourceQualityScore: 80,
    publicationRecommendation: "publish-ready",
  },
): DirectorChecklistArticle {
  const createdAt = new Date("2026-09-15T00:00:00.000Z");
  const audit = {
    id: "audit-1",
    articleId: article.id,
    createdAt,
    unverifiedCount: 0,
    facts: [
      {
        claim: "Organizations should document accountability for AI risk.",
        verificationStatus: "verified",
        verificationMethod: "exact",
        verificationCount: 2,
        supportingSources: [
          { sourceUrl: SOURCE_URL, publisherHost: "nist.gov" },
          {
            sourceUrl: "https://www.cisa.gov/topics/artificial-intelligence",
            publisherHost: "cisa.gov",
          },
        ],
      },
    ],
    ...scores,
  };
  const fingerprint = computeArticleAuditFingerprint(article, [SOURCE_URL]);
  return {
    ...article,
    researchAudits: [audit],
    researchSources: [
      {
        url: SOURCE_URL,
        title: "NIST",
      },
    ],
    reviewNotes: [
      ...article.reviewNotes,
      {
        action: RESEARCH_AUDIT_FINGERPRINT_ACTION,
        note: serializeArticleAuditAssociation({
          auditId: audit.id,
          contentFingerprint: fingerprint,
          createdAt,
        }),
      },
    ],
  };
}

function withFeaturedPrompt(
  article: DirectorChecklistArticle,
  prompt = "A calm editorial hero image",
): DirectorChecklistArticle {
  const fingerprint = computeArticleAuditFingerprint(article, [SOURCE_URL]);
  return {
    ...article,
    reviewNotes: [
      ...article.reviewNotes,
      {
        id: "prompt-note-1",
        action: FEATURED_IMAGE_PROMPT_APPROVED_ACTION,
        note: serializeFeaturedImagePromptNote({
          version: 1,
          articleId: article.id,
          contentFingerprint: fingerprint,
          prompt,
          approvedAt: "2026-09-16T00:00:00.000Z",
          approvedBy: "editor@example.com",
        }),
        createdAt: "2026-09-16T00:00:00.000Z",
        reviewer: "editor@example.com",
      },
    ],
  };
}

describe("buildDirectorChecklist status derivation", () => {
  it("exposes the six Director spine steps in order", () => {
    const checklist = buildDirectorChecklist(baseArticle());
    expect(checklist.steps.map((step) => step.id)).toEqual([
      ...DIRECTOR_CHECKLIST_STEP_IDS,
    ]);
  });

  it("does not mark research complete without sources or audits", () => {
    const checklist = buildDirectorChecklist(
      baseArticle({
        status: "review-required",
        researchSources: [],
        researchAudits: [],
      }),
    );
    expect(checklist.steps[0]).toMatchObject({
      id: "generate_research",
      state: "action_required",
      href: "/admin/articles/article-1/edit",
    });
    expect(checklist.steps[1].state).toBe("action_required");
    expect(checklist.steps[2].state).toBe("blocked");
    expect(checklist.nextAction?.id).toBe("generate_research");
  });

  it("marks generate/research complete when content and research sources exist", () => {
    const checklist = buildDirectorChecklist(
      withCurrentAudit(
        baseArticle({
          status: "review-required",
        }),
      ),
    );
    expect(checklist.steps[0].state).toBe("complete");
    expect(checklist.steps[1]).toMatchObject({
      id: "audit_verification",
      state: "complete",
      evidence: expect.objectContaining({
        hasCurrentAudit: true,
        publishReadyAudit: true,
      }),
    });
    expect(checklist.steps[2]).toMatchObject({
      id: "human_approval",
      state: "action_required",
      href: "/admin/articles/article-1/edit",
    });
    expect(checklist.steps[3].state).toBe("blocked");
  });

  it("allows schedule but not immediate publish when approved without a featured image", () => {
    const audited = withCurrentAudit(
      baseArticle({
        status: "approved",
        approvedAt: "2026-09-16T00:00:00.000Z",
        approvedBy: "editor@example.com",
        featuredImage: null,
      }),
    );
    const checklist = buildDirectorChecklist(audited);
    expect(checklist.steps[2].state).toBe("complete");
    expect(checklist.steps[3].state).toBe("action_required");
    expect(checklist.steps[4]).toMatchObject({
      id: "publication",
      state: "action_required",
      evidence: expect.objectContaining({
        canPublish: false,
        canSchedule: true,
      }),
    });
  });

  it("marks publication ready only when approved, current audit, approval metadata, and featured image exist", () => {
    const article = withFeaturedPrompt(
      withCurrentAudit(
        baseArticle({
          status: "approved",
          approvedAt: "2026-09-16T00:00:00.000Z",
          approvedBy: "editor@example.com",
          featuredImage: "https://cdn.example/hero.png",
        }),
      ),
    );
    const checklist = buildDirectorChecklist(article);
    expect(checklist.steps[3].state).toBe("complete");
    expect(checklist.steps[4]).toMatchObject({
      id: "publication",
      state: "action_required",
      evidence: expect.objectContaining({
        canPublish: true,
        canSchedule: true,
      }),
    });
    expect(checklist.steps[5].state).toBe("not_started");
  });

  it("marks X social complete only from published twitter posts", () => {
    const article = withFeaturedPrompt(
      withCurrentAudit(
        baseArticle({
          status: "published",
          approvedAt: "2026-09-16T00:00:00.000Z",
          approvedBy: "editor@example.com",
          publishedAt: "2026-09-17T00:00:00.000Z",
          featuredImage: "https://cdn.example/hero.png",
          socialPosts: [
            {
              id: "social-li",
              platform: "linkedin",
              status: "published",
              publishedAt: "2026-09-17T01:00:00.000Z",
            },
            {
              id: "social-x",
              platform: "twitter",
              status: "approved",
              publishedAt: null,
            },
          ],
        }),
      ),
    );
    const checklist = buildDirectorChecklist(article);
    expect(checklist.steps[4].state).toBe("complete");
    expect(checklist.steps[5]).toMatchObject({
      id: "social_distribution",
      state: "action_required",
      href: "/admin/social?status=approved",
      evidence: expect.objectContaining({
        twitterApprovedCount: 1,
      }),
    });

    const publishedSocial = buildDirectorChecklist({
      ...article,
      socialPosts: [
        {
          id: "social-x",
          platform: "twitter",
          status: "published",
          publishedAt: "2026-09-17T02:00:00.000Z",
        },
      ],
    });
    expect(publishedSocial.steps[5].state).toBe("complete");
    expect(publishedSocial.nextAction).toBeNull();
  });

  it("links each step to an existing authorised workflow path", () => {
    const checklist = buildDirectorChecklist(baseArticle({ content: null }));
    for (const step of checklist.steps) {
      expect(step.href.startsWith("/admin/")).toBe(true);
    }
    expect(checklist.steps[0].href).toBe("/admin/ai-generator");
  });
});

describe("GET /api/articles/director-checklist permissions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    articleFindUnique.mockResolvedValue(null);
  });

  it("rejects unauthenticated callers before loading an article", async () => {
    const { GET } = await import("../../app/api/articles/director-checklist/route");
    const response = await GET(
      new NextRequest(
        "https://attacker.example/api/articles/director-checklist?articleId=article-1",
      ),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual(AUTHENTICATION_REQUIRED_BODY);
    expect(articleFindUnique).not.toHaveBeenCalled();
  });

  it("rejects non-editor sessions before loading an article", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "reader-1",
          email: "reader@example.com",
          app_metadata: { role: "reader" },
        },
      },
      error: null,
    });
    const { GET } = await import("../../app/api/articles/director-checklist/route");
    const response = await GET(
      new NextRequest(
        "http://localhost/api/articles/director-checklist?articleId=article-1",
      ),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual(EDITOR_FORBIDDEN_BODY);
    expect(articleFindUnique).not.toHaveBeenCalled();
  });

  it("returns derived checklist status for an authorised editor", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "editor-1",
          email: "editor@example.com",
          app_metadata: { role: "editor" },
        },
      },
      error: null,
    });
    const article = withCurrentAudit(
      baseArticle({
        status: "review-required",
      }),
    );
    articleFindUnique.mockResolvedValue(article);

    const { GET } = await import("../../app/api/articles/director-checklist/route");
    const response = await GET(
      new NextRequest(
        "http://localhost/api/articles/director-checklist?articleId=article-1",
      ),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      actor: "editor@example.com",
      checklist: {
        articleId: "article-1",
        articleStatus: "review-required",
        steps: expect.arrayContaining([
          expect.objectContaining({
            id: "human_approval",
            state: "action_required",
          }),
        ]),
      },
    });
    expect(articleFindUnique).toHaveBeenCalledTimes(1);
  });
});
