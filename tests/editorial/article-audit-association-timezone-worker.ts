/**
 * Child-process worker for timezone-stable audit association recognition.
 *
 * Module under test: lib/research/article-audit-association.ts
 * (utcIsoFromTimestampWithoutTimezone, partitionAssociatedArticleAudits).
 * Existing tests: tests/editorial/article-audit-association.test.ts.
 * Spawned by: tests/editorial/article-audit-association-timezone.test.ts.
 *
 * User instruction: "Run timezone-sensitive tests in separate processes where
 * necessary so each process starts with the intended timezone" and recognise
 * current audits under TZ=UTC, Australia/Adelaide, and America/New_York while
 * reproducing the real database timestamp decoding boundary.
 */
import {
  RESEARCH_AUDIT_FINGERPRINT_ACTION,
  auditCreatedAtMatchesAssociation,
  partitionAssociatedArticleAudits,
  utcIsoFromTimestampWithoutTimezone,
} from "../../lib/research/article-audit-association";
import { computeArticleAuditFingerprint } from "../../lib/research/article-audit-fingerprint";
import { VERSIONED_RESEARCH_AUDIT_ENGINE_REVISION } from "../../lib/research/research-audit-engine-revision";

const article = {
  id: "article-tz",
  title: "Timezone audit binding",
  excerpt: "Wall clock binding.",
  content: "Body.",
  category: "ai-tools",
  seoTitle: "Timezone",
  seoDescription: "Timezone binding.",
  seoKeywords: "timezone",
};

const sources = ["https://www.nist.gov/itl/ai-risk-management-framework"];
const fingerprint = computeArticleAuditFingerprint(article, sources);

/** Production-style association created under UTC for naive wall 20:28:27.377 */
const ASSOCIATION_CREATED_AT = "2026-11-15T20:28:27.377Z";

/**
 * Mirror node-pg: naive timestamp text is interpreted as local wall time.
 */
function decodeTimestampWithoutTimezoneAsPg(wall: {
  y: number;
  m: number;
  d: number;
  h: number;
  mi: number;
  s: number;
  ms: number;
}): Date {
  return new Date(wall.y, wall.m - 1, wall.d, wall.h, wall.mi, wall.s, wall.ms);
}

const audit = {
  id: "audit-current",
  articleId: article.id,
  createdAt: decodeTimestampWithoutTimezoneAsPg({
    y: 2026,
    m: 11,
    d: 15,
    h: 20,
    mi: 28,
    s: 27,
    ms: 377,
  }),
};

const note = {
  action: RESEARCH_AUDIT_FINGERPRINT_ACTION,
  note: JSON.stringify({
    version: 2,
    auditId: audit.id,
    contentFingerprint: fingerprint,
    algorithm: "sha256",
    createdAt: ASSOCIATION_CREATED_AT,
    engineRevision: VERSIONED_RESEARCH_AUDIT_ENGINE_REVISION,
  }),
};

const partitioned = partitionAssociatedArticleAudits(
  article,
  sources,
  [audit],
  [note],
);

const wallIso = utcIsoFromTimestampWithoutTimezone(audit.createdAt);

const payload = {
  tz: process.env.TZ || null,
  offsetMinutes: new Date().getTimezoneOffset(),
  associationCreatedAt: ASSOCIATION_CREATED_AT,
  wallIso,
  auditToISOString: audit.createdAt.toISOString(),
  currentAuditId: partitioned.current?.id ?? null,
  historicalCount: partitioned.historical.length,
  matched: partitioned.current?.id === audit.id,
};

// Dual-interpretation negative check: an absolute Instant whose local wall
// equals ASSOCIATION_CREATED_AT must not also accept its absolute ISO when
// that ISO differs (non-UTC process timezones).
const absoluteAlternate = new Date("2026-11-15T09:58:27.377Z");
const absoluteIso = absoluteAlternate.toISOString();
const absoluteWall = utcIsoFromTimestampWithoutTimezone(absoluteAlternate);
const dualHazard =
  absoluteIso !== absoluteWall &&
  auditCreatedAtMatchesAssociation(absoluteAlternate, absoluteIso) &&
  auditCreatedAtMatchesAssociation(absoluteAlternate, absoluteWall!);

if (!payload.matched || wallIso !== ASSOCIATION_CREATED_AT || dualHazard) {
  console.error(
    JSON.stringify(
      {
        ...payload,
        absoluteIso,
        absoluteWall,
        dualHazard,
        acceptsAbsoluteIso: auditCreatedAtMatchesAssociation(
          absoluteAlternate,
          absoluteIso,
        ),
        acceptsAbsoluteWall: auditCreatedAtMatchesAssociation(
          absoluteAlternate,
          absoluteWall!,
        ),
      },
      null,
      2,
    ),
  );
  process.exit(1);
}

console.log(JSON.stringify({ ...payload, dualHazard: false }));
