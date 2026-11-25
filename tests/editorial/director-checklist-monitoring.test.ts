import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { AUTHENTICATION_REQUIRED_BODY } from "../../lib/publishing/require-editor-auth";
import { buildDirectorChecklist } from "../../lib/publishing/director-checklist";
import {
  DIRECTOR_MONITORING_STATUSES,
  attachDirectorMonitoring,
  buildDirectorMonitoringView,
} from "../../lib/publishing/director-checklist-monitoring";
import {
  RESEARCH_AUDIT_FINGERPRINT_ACTION,
  serializeArticleAuditAssociation,
} from "../../lib/research/article-audit-association";
import { computeArticleAuditFingerprint } from "../../lib/research/article-audit-fingerprint";
import {
  FEATURED_IMAGE_PROMPT_APPROVED_ACTION,
  serializeFeaturedImagePromptNote,
} from "../../lib/ai/featured-image-prompt";
import type { DirectorChecklistArticle } from "../../lib/publishing/director-checklist";

const mockGetUser = vi.fn();
const articleFindUnique = vi.fn();
const operationalEventFindMany = vi.fn();

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
    operationalEvent: {
      findMany: (...args: unknown[]) => operationalEventFindMany(...args),
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

function withCurrentAudit(article: DirectorChecklistArticle): DirectorChecklistArticle {
  const createdAt = new Date("2026-09-15T00:00:00.000Z");
  const audit = {
    id: "audit-1",
    articleId: article.id,
    createdAt,
    consensusScore: 85,
    sourceQualityScore: 80,
    publicationRecommendation: "publish-ready",
  };
  const fingerprint = computeArticleAuditFingerprint(article, [SOURCE_URL]);
  return {
    ...article,
    researchAudits: [audit],
    researchSources: [{ url: SOURCE_URL, title: "NIST" }],
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

function withFeaturedPrompt(article: DirectorChecklistArticle): DirectorChecklistArticle {
  const fingerprint = computeArticleAuditFingerprint(article, [SOURCE_URL]);
  return {
    ...article,
    reviewNotes: [
      ...article.reviewNotes,
      {
        id: "prompt-1",
        action: FEATURED_IMAGE_PROMPT_APPROVED_ACTION,
        note: serializeFeaturedImagePromptNote({
          version: 1,
          articleId: article.id,
          contentFingerprint: fingerprint,
          prompt: "Editorial hero",
          approvedAt: "2026-09-16T00:00:00.000Z",
          approvedBy: "editor@example.com",
        }),
        createdAt: "2026-09-16T00:00:00.000Z",
        reviewer: "editor@example.com",
      },
    ],
  };
}

describe("Director Checklist monitoring statuses", () => {
  it("exposes the six mandated monitoring statuses", () => {
    expect(DIRECTOR_MONITORING_STATUSES).toEqual([
      "Success",
      "Pending",
      "Failed",
      "Blocked",
      "Unavailable",
      "Unknown",
    ]);
  });

  it("maps generate/audit/approval evidence without inventing success", () => {
    const view = buildDirectorMonitoringView(
      baseArticle({ status: "review-required", researchSources: [], researchAudits: [] }),
    );
    expect(view.readOnly).toBe(true);
    expect(view.steps[0].monitoringStatus).toBe("Pending");
    expect(view.steps[1].monitoringStatus).toBe("Pending");
    expect(view.steps[2].monitoringStatus).toBe("Blocked");
    expect(view.summary.Success).toBe(0);
  });

  it("marks approval Failed when article status is rejected", () => {
    const view = buildDirectorMonitoringView(
      withCurrentAudit(baseArticle({ status: "rejected" })),
    );
    expect(view.steps.find((step) => step.id === "human_approval")?.monitoringStatus).toBe(
      "Failed",
    );
  });

  it("marks later stages Unavailable when article is archived", () => {
    const view = buildDirectorMonitoringView(
      withCurrentAudit(
        baseArticle({
          status: "archived",
          approvedAt: "2026-09-16T00:00:00.000Z",
          approvedBy: "editor@example.com",
        }),
      ),
    );
    expect(view.steps.find((step) => step.id === "publication")?.monitoringStatus).toBe(
      "Unavailable",
    );
    expect(
      view.steps.find((step) => step.id === "social_distribution")?.monitoringStatus,
    ).toBe("Unavailable");
  });

  it("marks social publishing claims as Pending", () => {
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
              id: "social-x",
              platform: "twitter",
              status: "publishing",
              publishedAt: null,
            },
          ],
        }),
      ),
    );
    const view = buildDirectorMonitoringView(article);
    expect(view.steps.find((step) => step.id === "social_distribution")).toMatchObject({
      monitoringStatus: "Pending",
      evidence: expect.objectContaining({ twitterPublishingCount: 1 }),
    });
  });

  it("marks social Failed / Unknown from operational events only", () => {
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
              id: "social-x",
              platform: "twitter",
              status: "approved",
              publishedAt: null,
            },
          ],
        }),
      ),
    );

    const failed = attachDirectorMonitoring(buildDirectorChecklist(article), article, [
      {
        type: "social_publish_failed",
        source: "twitter",
        entityType: "SocialPost",
        entityId: "social-x",
        createdAt: "2026-09-17T03:00:00.000Z",
        message: "X rejected the post.",
      },
    ]);
    expect(failed.steps.find((step) => step.id === "social_distribution")?.monitoringStatus).toBe(
      "Failed",
    );

    const uncertain = attachDirectorMonitoring(buildDirectorChecklist(article), article, [
      {
        type: "social_publish_uncertain",
        source: "twitter",
        entityType: "SocialPost",
        entityId: "social-x",
        createdAt: "2026-09-17T04:00:00.000Z",
        message: "Outcome uncertain.",
      },
    ]);
    expect(
      uncertain.steps.find((step) => step.id === "social_distribution")?.monitoringStatus,
    ).toBe("Unknown");
  });

  it("does not treat missing operational events as failure", () => {
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
              id: "social-x",
              platform: "twitter",
              status: "approved",
              publishedAt: null,
            },
          ],
        }),
      ),
    );
    const view = buildDirectorMonitoringView(article, []);
    expect(view.steps.find((step) => step.id === "social_distribution")?.monitoringStatus).toBe(
      "Pending",
    );
    expect(view.summary.Failed).toBe(0);
    expect(view.summary.Unknown).toBe(0);
  });
});

describe("GET /api/articles/director-checklist monitoring permissions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    articleFindUnique.mockResolvedValue(null);
    operationalEventFindMany.mockResolvedValue([]);
  });

  it("rejects unauthenticated callers before loading monitoring evidence", async () => {
    const { GET } = await import("../../app/api/articles/director-checklist/route");
    const response = await GET(
      new NextRequest(
        "https://attacker.example/api/articles/director-checklist?articleId=article-1",
      ),
    );
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual(AUTHENTICATION_REQUIRED_BODY);
    expect(articleFindUnique).not.toHaveBeenCalled();
    expect(operationalEventFindMany).not.toHaveBeenCalled();
  });

  it("returns read-only monitoring for an authorised editor", async () => {
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
    operationalEventFindMany.mockResolvedValue([]);

    const { GET } = await import("../../app/api/articles/director-checklist/route");
    const response = await GET(
      new NextRequest(
        "http://localhost/api/articles/director-checklist?articleId=article-1",
      ),
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.readOnly).toBe(true);
    expect(body.monitoring.readOnly).toBe(true);
    expect(body.monitoring.steps).toHaveLength(6);
    expect(body.monitoring.summary).toEqual(
      expect.objectContaining({
        Success: expect.any(Number),
        Pending: expect.any(Number),
        Failed: expect.any(Number),
        Blocked: expect.any(Number),
        Unavailable: expect.any(Number),
        Unknown: expect.any(Number),
      }),
    );
    expect(operationalEventFindMany).not.toHaveBeenCalled();
  });
});
