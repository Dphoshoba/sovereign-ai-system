import {
  computeArticleAuditFingerprint,
  type AuditableArticleState,
} from "./article-audit-fingerprint";
import {
  CURRENT_RESEARCH_AUDIT_ENGINE_REVISION,
  isCurrentResearchAuditEngineRevision,
  isResearchAuditEngineRevision,
} from "./research-audit-engine-revision";

export const RESEARCH_AUDIT_FINGERPRINT_ACTION =
  "research-audit-fingerprint" as const;

const ASSOCIATION_KEYS = [
  "algorithm",
  "auditId",
  "contentFingerprint",
  "createdAt",
  "engineRevision",
  "version",
] as const;
const SHA256_PATTERN = /^[a-f0-9]{64}$/;

export type ArticleAuditAssociation = {
  version: 2;
  auditId: string;
  contentFingerprint: string;
  algorithm: "sha256";
  createdAt: string;
  engineRevision: string;
};

export type ArticleAuditAssociationNote = {
  action: string;
  note: string | null;
};

export type AssociatedAudit = {
  id: string;
  articleId: string;
  createdAt: Date | string;
};

function isExactIsoTimestamp(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString() === value;
}

const NAIVE_TIMESTAMP_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?$/;

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function pad3(value: number): string {
  return String(value).padStart(3, "0");
}

/**
 * Re-express a PostgreSQL `timestamp without time zone` value as a UTC ISO
 * string using the wall-clock components node-pg/Prisma expose after decoding.
 *
 * node-pg interprets naive timestamps in the process local timezone. Production
 * associations store that same wall clock with a `Z` suffix because Prepare
 * serialised `Date#toISOString()` under a UTC runtime. Recovering the wall
 * clock via local getters (not `getUTC*`) makes recognition TZ-independent
 * without rewriting stored association notes.
 *
 * Callers: `auditCreatedAtMatchesAssociation` / `partitionAssociatedArticleAudits`
 * in this file; `resolveArticleAuditState` → Prepare duplicate guard and
 * `/admin/articles/[id]/audit` via `ArticleAuditPanel`.
 * User instruction: implement timezone-stable audit recognition locally while
 * preserving exact timestamp binding and existing UTC-written Production records.
 */
export function utcIsoFromTimestampWithoutTimezone(
  value: Date | string,
): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    // Avoid type-predicate narrowing of an already-string value to `never`.
    const exactIso = new Date(trimmed);
    if (!Number.isNaN(exactIso.valueOf()) && exactIso.toISOString() === trimmed) {
      return trimmed;
    }

    const naive = trimmed.match(NAIVE_TIMESTAMP_PATTERN);
    if (naive) {
      const ms = (naive[7] ?? "0").padEnd(3, "0").slice(0, 3);
      return `${naive[1]}-${naive[2]}-${naive[3]}T${naive[4]}:${naive[5]}:${naive[6]}.${ms}Z`;
    }

    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.valueOf())) return null;
    value = parsed;
  }

  if (!(value instanceof Date) || Number.isNaN(value.valueOf())) return null;

  return (
    `${value.getFullYear()}-${pad2(value.getMonth() + 1)}-${pad2(value.getDate())}` +
    `T${pad2(value.getHours())}:${pad2(value.getMinutes())}:${pad2(value.getSeconds())}` +
    `.${pad3(value.getMilliseconds())}Z`
  );
}

function coerceAuditCreatedAt(value: Date | string): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.valueOf()) ? null : value;
  }
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  const naive = trimmed.match(NAIVE_TIMESTAMP_PATTERN);
  if (naive) {
    // Mirror node-pg: treat naive DB text as process-local wall time.
    return new Date(
      Number(naive[1]),
      Number(naive[2]) - 1,
      Number(naive[3]),
      Number(naive[4]),
      Number(naive[5]),
      Number(naive[6]),
      Number((naive[7] ?? "0").padEnd(3, "0").slice(0, 3)),
    );
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.valueOf()) ? null : parsed;
}

/**
 * Exact timestamp binding for audit associations.
 *
 * Compares the association ISO string to the PostgreSQL
 * `timestamp without time zone` wall clock recovered after local decode
 * (node-pg/Prisma semantics). Association notes written under UTC Prepare store
 * that same wall clock with a `Z` suffix via `Date#toISOString()`.
 *
 * Absolute `Date#toISOString()` equality is intentionally not used as an
 * alternate accept path: under a non-UTC process timezone the same Date can
 * have a different absolute ISO and local wall ISO, and accepting either would
 * let one audit Date match two distinct association timestamps.
 */
export function auditCreatedAtMatchesAssociation(
  auditCreatedAt: Date | string,
  associationCreatedAt: string,
): boolean {
  const createdAt = coerceAuditCreatedAt(auditCreatedAt);
  if (!createdAt) return false;

  const wallIso = utcIsoFromTimestampWithoutTimezone(createdAt);
  return wallIso !== null && associationCreatedAt === wallIso;
}

export function isResearchAuditFingerprintNote(note: {
  action: string;
}): boolean {
  return note.action === RESEARCH_AUDIT_FINGERPRINT_ACTION;
}

export function serializeArticleAuditAssociation(input: {
  auditId: string;
  contentFingerprint: string;
  createdAt: Date;
  engineRevision?: string;
}): string {
  // Use the same naive wall-clock ISO as auditCreatedAtMatchesAssociation so
  // Prepare write + later resolve stay aligned under any process timezone.
  // Under UTC this equals Date#toISOString() for PostgreSQL timestamp-without
  // time zone values, preserving existing Production association notes.
  const createdAt = utcIsoFromTimestampWithoutTimezone(input.createdAt);
  if (!createdAt) {
    throw new Error("Invalid audit createdAt for association serialisation.");
  }

  const association: ArticleAuditAssociation = {
    version: 2,
    auditId: input.auditId,
    contentFingerprint: input.contentFingerprint,
    algorithm: "sha256",
    createdAt,
    engineRevision: input.engineRevision ?? CURRENT_RESEARCH_AUDIT_ENGINE_REVISION,
  };

  return JSON.stringify(association);
}

export function parseArticleAuditAssociation(
  reviewNote: ArticleAuditAssociationNote,
): ArticleAuditAssociation | null {
  if (!isResearchAuditFingerprintNote(reviewNote) || !reviewNote.note) {
    return null;
  }

  try {
    const value: unknown = JSON.parse(reviewNote.note);
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      return null;
    }

    const record = value as Record<string, unknown>;
    const keys = Object.keys(record).sort();
    if (
      keys.length !== ASSOCIATION_KEYS.length ||
      !ASSOCIATION_KEYS.every((key, index) => key === keys[index])
    ) {
      return null;
    }

    if (
      record.version !== 2 ||
      record.algorithm !== "sha256" ||
      typeof record.auditId !== "string" ||
      record.auditId.length === 0 ||
      record.auditId.trim() !== record.auditId ||
      typeof record.contentFingerprint !== "string" ||
      !SHA256_PATTERN.test(record.contentFingerprint) ||
      !isExactIsoTimestamp(record.createdAt) ||
      !isResearchAuditEngineRevision(record.engineRevision)
    ) {
      return null;
    }

    return {
      version: 2,
      auditId: record.auditId,
      contentFingerprint: record.contentFingerprint,
      algorithm: "sha256",
      createdAt: record.createdAt,
      engineRevision: record.engineRevision,
    };
  } catch {
    return null;
  }
}

export function partitionAssociatedArticleAudits<
  TAudit extends AssociatedAudit,
>(
  article: AuditableArticleState & { id: string },
  sourceUrls: string[],
  audits: TAudit[],
  reviewNotes: ArticleAuditAssociationNote[],
): { current: TAudit | null; historical: TAudit[] } {
  const currentFingerprint = computeArticleAuditFingerprint(
    article,
    sourceUrls,
  );
  const auditsById = new Map(
    audits
      .filter((audit) => audit.articleId === article.id)
      .map((audit) => [audit.id, audit]),
  );

  const matching = reviewNotes
    .map(parseArticleAuditAssociation)
    .flatMap((association) => {
      if (
        !association ||
        association.contentFingerprint !== currentFingerprint ||
        !isCurrentResearchAuditEngineRevision(association.engineRevision)
      ) {
        return [];
      }
      const audit = auditsById.get(association.auditId);
      if (!audit) return [];
      if (!auditCreatedAtMatchesAssociation(audit.createdAt, association.createdAt)) {
        return [];
      }
      const createdAt = coerceAuditCreatedAt(audit.createdAt);
      if (!createdAt) return [];
      return [{ audit, createdAt }];
    })
    .sort(
      (left, right) =>
        right.createdAt.valueOf() - left.createdAt.valueOf() ||
        right.audit.id.localeCompare(left.audit.id),
    );

  const current = matching[0]?.audit ?? null;

  return {
    current,
    historical: current ? audits.filter((audit) => audit !== current) : audits,
  };
}
