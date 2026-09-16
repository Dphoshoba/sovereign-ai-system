import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { execFileSync, spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { updateArticleUnderGovernanceLock } from "../../lib/publishing/article-lifecycle";
import { transitionArticleLifecycle } from "../../lib/publishing/article-lifecycle";
import { computeArticleAuditFingerprint } from "../../lib/research/article-audit-fingerprint";
import {
  RESEARCH_AUDIT_FINGERPRINT_ACTION,
  serializeArticleAuditAssociation,
} from "../../lib/research/article-audit-association";
import { mutateArticleSources } from "../../lib/research/article-source-mutation";
import { prepareArticleForReview } from "../../lib/research/prepare-article-for-review";
import { resolveArticleAuditState } from "../../lib/research/current-article-audit";

import { GROUNDED_ARTICLE_CLAIM, GROUNDED_EVIDENCE_TEXT } from "../fixtures/research-audit/article-2";

const PORT = "55432";
const CONTAINER = `ev-audit-lifecycle-${process.pid}`;
const DATABASE_URL = `postgresql://postgres:test@127.0.0.1:${PORT}/audit_lifecycle?connect_timeout=10`;

const DDL = `
CREATE TABLE "Article" (
  "id" TEXT PRIMARY KEY,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "excerpt" TEXT,
  "content" TEXT,
  "featuredImage" TEXT,
  "seoTitle" TEXT,
  "seoDescription" TEXT,
  "seoKeywords" TEXT,
  "publishedAt" TIMESTAMP,
  "scheduledFor" TIMESTAMP,
  "approvedAt" TIMESTAMP,
  "approvedBy" TEXT,
  "editorialScore" INTEGER,
  "editorialGrade" TEXT,
  "editorialWarnings" JSONB,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "qualityScore" INTEGER,
  "qualityGrade" TEXT,
  "seoScore" INTEGER,
  "seoGrade" TEXT,
  UNIQUE ("category", "slug")
);
CREATE TABLE "ArticleReviewNote" (
  "id" TEXT PRIMARY KEY,
  "articleId" TEXT NOT NULL REFERENCES "Article"("id") ON DELETE CASCADE,
  "action" TEXT NOT NULL,
  "note" TEXT,
  "reviewer" TEXT NOT NULL DEFAULT 'system',
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE TABLE "ArticleResearchAudit" (
  "id" TEXT PRIMARY KEY,
  "articleId" TEXT NOT NULL REFERENCES "Article"("id") ON DELETE CASCADE,
  "sourceCount" INTEGER NOT NULL DEFAULT 0,
  "averageAuthorityScore" INTEGER NOT NULL DEFAULT 0,
  "averageTrustScore" INTEGER NOT NULL DEFAULT 0,
  "researchConfidence" INTEGER NOT NULL DEFAULT 0,
  "evidenceCount" INTEGER NOT NULL DEFAULT 0,
  "factCount" INTEGER NOT NULL DEFAULT 0,
  "verifiedCount" INTEGER NOT NULL DEFAULT 0,
  "partiallyVerifiedCount" INTEGER NOT NULL DEFAULT 0,
  "unverifiedCount" INTEGER NOT NULL DEFAULT 0,
  "averageVerificationScore" INTEGER NOT NULL DEFAULT 0,
  "consensusScore" INTEGER NOT NULL DEFAULT 0,
  "sourceQualityScore" INTEGER NOT NULL DEFAULT 0,
  "publicationRecommendation" TEXT,
  "sources" JSONB,
  "evidence" JSONB,
  "facts" JSONB,
  "consensus" JSONB,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE TABLE "ResearchSource" (
  "id" TEXT PRIMARY KEY,
  "articleId" TEXT NOT NULL REFERENCES "Article"("id") ON DELETE CASCADE,
  "title" TEXT,
  "url" TEXT,
  "publisher" TEXT,
  "authorityScore" INTEGER NOT NULL DEFAULT 0,
  "trustScore" INTEGER NOT NULL DEFAULT 0,
  "sourceType" TEXT,
  "category" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE TABLE "PublishingQueue" (
  "id" TEXT PRIMARY KEY,
  "articleId" TEXT NOT NULL,
  "platform" TEXT NOT NULL,
  "contentType" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "scheduledAt" TIMESTAMP,
  "publishedAt" TIMESTAMP,
  "payload" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE TABLE "TestFlags" (
  "key" TEXT PRIMARY KEY,
  "value" TEXT NOT NULL
);
CREATE OR REPLACE FUNCTION fail_association_note() RETURNS trigger AS $$
BEGIN
  IF NEW.action = 'research-audit-fingerprint'
     AND EXISTS (
       SELECT 1 FROM "TestFlags"
       WHERE "key" = 'fail_association' AND "value" = 'on'
     ) THEN
    RAISE EXCEPTION 'forced association failure';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER fail_association_note_trigger
  BEFORE INSERT ON "ArticleReviewNote"
  FOR EACH ROW EXECUTE PROCEDURE fail_association_note();
`;

const EVIDENCE_TEXT = GROUNDED_EVIDENCE_TEXT;

function createPrisma() {
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: DATABASE_URL, max: 2 }),
  });
}

async function waitForReady() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const result = spawnSync(
      "docker",
      ["exec", CONTAINER, "pg_isready", "-U", "postgres"],
      { encoding: "utf8" },
    );
    if (result.status === 0) return;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("Disposable PostgreSQL 16 did not become ready.");
}

async function seedArticle(
  prisma: PrismaClient,
  overrides: Record<string, unknown> = {},
) {
  const id = randomUUID();
  return prisma.article.create({
    data: {
      id,
      title: "Governed concurrency article",
      slug: `governed-${id.slice(0, 8)}`,
      category: "ai-tools",
      status: "review-required",
      excerpt: GROUNDED_ARTICLE_CLAIM,
      content:
        `${GROUNDED_ARTICLE_CLAIM} See [NIST](https://www.nist.gov/artificial-intelligence) for the research basis.`,
      seoTitle: "Governed concurrency article",
      seoDescription: "Evidence-backed operations for creators.",
      seoKeywords: "AI governance",
      approvedAt: null,
      approvedBy: null,
      scheduledFor: null,
      publishedAt: null,
      ...overrides,
    },
  });
}

async function attachCurrentAudit(
  prisma: PrismaClient,
  article: { id: string },
  engineRevision?: string,
) {
  const loaded = await prisma.article.findUniqueOrThrow({
    where: { id: article.id },
    include: { researchSources: true },
  });
  const fingerprint = computeArticleAuditFingerprint(loaded, [
    "https://www.nist.gov/artificial-intelligence",
  ]);
  const audit = await prisma.articleResearchAudit.create({
    data: {
      articleId: loaded.id,
      sourceCount: 1,
      evidenceCount: 1,
      factCount: 1,
      verifiedCount: 1,
      publicationRecommendation: "review",
    },
  });
  await prisma.articleReviewNote.create({
    data: {
      articleId: loaded.id,
      action: RESEARCH_AUDIT_FINGERPRINT_ACTION,
      reviewer: "system",
      note: serializeArticleAuditAssociation({
        auditId: audit.id,
        contentFingerprint: fingerprint,
        createdAt: audit.createdAt,
        ...(engineRevision ? { engineRevision } : {}),
      }),
    },
  });
  return audit;
}

const collectEvidence = async () => ({
  topic: "Governed concurrency",
  evidenceCount: 1,
  registryStatus: "ok",
  evidence: [
    {
      id: "chunk-1",
      sourceTitle: "NIST",
      sourceUrl: "https://www.nist.gov/artificial-intelligence",
      sourceType: "government",
      extractedText: EVIDENCE_TEXT,
      confidence: 90,
      requiresHumanReview: true,
    },
  ],
});

describe("real PostgreSQL article governance concurrency", () => {
  let prismaA: PrismaClient;
  let prismaB: PrismaClient;

  beforeAll(async () => {
    const started = spawnSync(
      "docker",
      [
        "run",
        "-d",
        "--name",
        CONTAINER,
        "-e",
        "POSTGRES_PASSWORD=test",
        "-e",
        "POSTGRES_DB=audit_lifecycle",
        "-p",
        `${PORT}:5432`,
        "postgres:16",
      ],
      { encoding: "utf8" },
    );
    if (started.status !== 0) {
      throw new Error(
        `Failed to start disposable PostgreSQL 16: ${started.stderr || started.stdout}`,
      );
    }
    await waitForReady();
    execFileSync("docker", ["exec", "-i", CONTAINER, "psql", "-U", "postgres", "-d", "audit_lifecycle"], {
      input: DDL,
      encoding: "utf8",
    });
    prismaA = createPrisma();
    prismaB = createPrisma();
  }, 120_000);

  afterAll(async () => {
    await prismaA?.$disconnect().catch(() => undefined);
    await prismaB?.$disconnect().catch(() => undefined);
    spawnSync("docker", ["rm", "-f", CONTAINER], { encoding: "utf8" });
  });

  it("serializes identical Prepare for Review requests onto one current audit", async () => {
    const article = await seedArticle(prismaA);
    const [first, second] = await Promise.all([
      prepareArticleForReview(article.id, {
        prisma: prismaA as never,
        collectEvidence,
      }),
      prepareArticleForReview(article.id, {
        prisma: prismaB as never,
        collectEvidence,
      }),
    ]);
    const outcomes = [first, second];
    expect(outcomes.filter((result) => result.ok)).toHaveLength(1);
    expect(
      outcomes.filter((result) => !result.ok && result.code === "duplicate_audit"),
    ).toHaveLength(1);
    const audits = await prismaA.articleResearchAudit.findMany({
      where: { articleId: article.id },
    });
    expect(audits).toHaveLength(1);
    const notes = await prismaA.articleReviewNote.findMany({
      where: {
        articleId: article.id,
        action: RESEARCH_AUDIT_FINGERPRINT_ACTION,
      },
    });
    expect(notes).toHaveLength(1);
  });

  it("serializes preparation against source mutation", async () => {
    const article = await seedArticle(prismaA, { status: "draft" });
    await prismaA.researchSource.create({
      data: {
        articleId: article.id,
        url: "https://www.nist.gov/artificial-intelligence",
        title: "NIST",
      },
    });
    const [prepared, mutated] = await Promise.all([
      prepareArticleForReview(article.id, {
        prisma: prismaA as never,
        collectEvidence,
      }),
      mutateArticleSources(
        {
          articleId: article.id,
          operation: "replace",
          sources: [{ url: "https://www.nist.gov/cyberframework" }],
        },
        { prisma: prismaB },
      ),
    ]);
    expect(prepared.ok || mutated.ok).toBe(true);
    const loaded = await prismaA.article.findUniqueOrThrow({
      where: { id: article.id },
      include: {
        researchAudits: true,
        researchSources: true,
        reviewNotes: true,
      },
    });
    const { currentAudit } = resolveArticleAuditState(loaded);
    const currentUrls = loaded.researchSources
      .map((source) => source.url)
      .filter(Boolean);
    if (currentUrls.includes("https://www.nist.gov/cyberframework")) {
      expect(currentAudit).toBeNull();
    } else {
      expect(currentAudit).not.toBeNull();
    }
    expect(loaded.status).not.toBe("approved");
  });

  it("prevents stale approval after a concurrent content edit", async () => {
    const article = await seedArticle(prismaA);
    await attachCurrentAudit(prismaA, article);
    const [approval, edit] = await Promise.all([
      transitionArticleLifecycle(
        { articleId: article.id, transition: "approve", actor: "editor" },
        { prisma: prismaA },
      ),
      updateArticleUnderGovernanceLock(
        { articleId: article.id, changes: { title: "Revised governed title" } },
        { prisma: prismaB },
      ),
    ]);
    const loaded = await prismaA.article.findUniqueOrThrow({
      where: { id: article.id },
      include: { researchAudits: true, researchSources: true, reviewNotes: true },
    });
    if (loaded.title === "Revised governed title") {
      expect(loaded.status).toBe("review-required");
      expect(loaded.approvedAt).toBeNull();
      expect(resolveArticleAuditState(loaded).currentAudit).toBeNull();
    } else {
      expect(approval.ok).toBe(true);
      expect(loaded.status).toBe("approved");
      expect(edit.ok).toBe(true);
    }
  });

  it("clears a schedule when sources change under the same lock", async () => {
    const article = await seedArticle(prismaA, {
      status: "scheduled",
      scheduledFor: new Date("2026-09-20T00:00:00.000Z"),
      approvedAt: new Date("2026-09-15T00:00:00.000Z"),
      approvedBy: "editor",
    });
    await attachCurrentAudit(prismaA, article);
    const result = await mutateArticleSources(
      {
        articleId: article.id,
        operation: "create",
        source: { url: "https://www.nist.gov/cyberframework" },
      },
      { prisma: prismaA },
    );
    expect(result.ok).toBe(true);
    const loaded = await prismaA.article.findUniqueOrThrow({
      where: { id: article.id },
    });
    expect(loaded.status).toBe("review-required");
    expect(loaded.scheduledFor).toBeNull();
    expect(loaded.approvedAt).toBeNull();
  });

  it("rejects source edits after publication", async () => {
    const article = await seedArticle(prismaA, {
      status: "published",
      publishedAt: new Date("2026-09-16T00:00:00.000Z"),
    });
    const result = await mutateArticleSources(
      {
        articleId: article.id,
        operation: "replace",
        sources: [{ url: "https://example.com/new" }],
      },
      { prisma: prismaA },
    );
    expect(result).toMatchObject({
      ok: false,
      code: "published_immutable",
      articleUnchanged: true,
    });
  });

  it("lets only one due publisher claim the article", async () => {
    const article = await seedArticle(prismaA, {
      status: "scheduled",
      scheduledFor: new Date("2026-09-01T00:00:00.000Z"),
      approvedAt: new Date("2026-09-15T00:00:00.000Z"),
      approvedBy: "editor",
    });
    await attachCurrentAudit(prismaA, article);
    const now = new Date("2026-09-16T00:00:00.000Z");
    const [first, second] = await Promise.all([
      transitionArticleLifecycle(
        { articleId: article.id, transition: "publish", now, requireDueAt: now },
        { prisma: prismaA },
      ),
      transitionArticleLifecycle(
        { articleId: article.id, transition: "publish", now, requireDueAt: now },
        { prisma: prismaB },
      ),
    ]);
    const published = [first, second].filter(
      (result) => result.ok && !result.alreadyApplied,
    );
    const skipped = [first, second].filter(
      (result) => result.ok && result.alreadyApplied,
    );
    expect(published).toHaveLength(1);
    expect(skipped).toHaveLength(1);
    const loaded = await prismaA.article.findUniqueOrThrow({
      where: { id: article.id },
    });
    expect(loaded.status).toBe("published");
  });

  it("rolls back article publication when the queue write fails", async () => {
    const article = await seedArticle(prismaA, {
      status: "approved",
      approvedAt: new Date("2026-09-15T00:00:00.000Z"),
      approvedBy: "editor",
    });
    await attachCurrentAudit(prismaA, article);
    await expect(
      transitionArticleLifecycle(
        {
          articleId: article.id,
          transition: "publish",
          queueId: "missing-queue",
          now: new Date("2026-09-16T00:00:00.000Z"),
        },
        { prisma: prismaA },
      ),
    ).rejects.toThrow();
    const loaded = await prismaA.article.findUniqueOrThrow({
      where: { id: article.id },
    });
    expect(loaded.status).toBe("approved");
    expect(loaded.publishedAt).toBeNull();
  });

  it("rolls back the audit when association creation fails", async () => {
    const article = await seedArticle(prismaA, { status: "draft" });
    await prismaA.researchSource.create({
      data: {
        articleId: article.id,
        url: "https://www.nist.gov/artificial-intelligence",
        title: "NIST",
      },
    });
    await prismaA.$executeRawUnsafe(
      `INSERT INTO "TestFlags" ("key", "value") VALUES ('fail_association', 'on')
       ON CONFLICT ("key") DO UPDATE SET "value" = 'on'`,
    );
    const result = await prepareArticleForReview(article.id, {
      prisma: prismaA as never,
      collectEvidence,
    });
    await prismaA.$executeRawUnsafe(
      `UPDATE "TestFlags" SET "value" = 'off' WHERE "key" = 'fail_association'`,
    );
    expect(result.ok).toBe(false);
    const audits = await prismaA.articleResearchAudit.findMany({
      where: { articleId: article.id },
    });
    const notes = await prismaA.articleReviewNote.findMany({
      where: { articleId: article.id },
    });
    expect(audits).toHaveLength(0);
    expect(notes).toHaveLength(0);
  });

  it("creates one replacement audit for an obsolete engine revision and keeps the older audit", async () => {
    const article = await seedArticle(prismaA, { status: "draft" });
    const obsolete = await attachCurrentAudit(
      prismaA,
      article,
      "legacy-chrome-v0",
    );
    const [first, second] = await Promise.all([
      prepareArticleForReview(article.id, {
        prisma: prismaA as never,
        collectEvidence,
      }),
      prepareArticleForReview(article.id, {
        prisma: prismaB as never,
        collectEvidence,
      }),
    ]);
    expect([first.ok, second.ok].filter(Boolean)).toHaveLength(1);
    expect(
      [first, second].filter((result) => !result.ok && result.code === "duplicate_audit"),
    ).toHaveLength(1);
    const loaded = await prismaA.article.findUniqueOrThrow({
      where: { id: article.id },
      include: { researchAudits: true, researchSources: true, reviewNotes: true },
    });
    expect(loaded.researchAudits).toHaveLength(2);
    expect(loaded.researchAudits.some((audit) => audit.id === obsolete.id)).toBe(
      true,
    );
    const { currentAudit, historicalAudits } = resolveArticleAuditState(loaded);
    expect(currentAudit?.id).not.toBe(obsolete.id);
    expect(historicalAudits.some((audit) => audit.id === obsolete.id)).toBe(true);
  });
});
