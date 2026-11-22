import {
  computeArticleAuditFingerprint,
  type AuditableArticleState,
} from "./article-audit-fingerprint";
import {
  CURRENT_RESEARCH_AUDIT_ENGINE_REVISION,
  isCurrentResearchAuditEngineRevision,
  isResearchAuditEngineRevision,
} from "./research-audit-engine-revision";
import {
  fromAdelaideWallClock,
  hasExplicitUtcOffset,
} from "../publishing/adelaide-time";

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
const NAIVE_WALL_CLOCK_PATTERN =
  /^(\d{4}-\d{2}-\d{2})[T ](\d{2}):(\d{2}):(\d{2})(\.\d{1,3})?$/;

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

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function normalizeFraction(fraction: string | undefined) {
  if (!fraction) return ".000";
  return `.${fraction.slice(1).padEnd(3, "0").slice(0, 3)}`;
}

/**
 * Postgres `timestamp without time zone` contract for ArticleResearchAudit:
 * - Production session TZ is UTC, so server-side defaults store UTC wall clocks.
 * - node-pg / Prisma and PostgREST naive strings are interpreted in the *runtime*
 *   local TZ, so `new Date(naive).toISOString()` is host-dependent.
 * - Association notes store `createdAt.toISOString()` from the writer runtime.
 *
 * Matching therefore accepts the stored naive wall clock interpreted as either
 * UTC or Australia/Adelaide (the two writer environments used by this product),
 * while still requiring an exact association ISO for absolute timestamps.
 */
function formatWallClockParts(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  millisecond: number,
) {
  return `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:${pad(second)}.${String(millisecond).padStart(3, "0")}`;
}

export function normalizeAuditCreatedAtWallClock(
  value: Date | string,
): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (hasExplicitUtcOffset(trimmed)) {
      return null;
    }
    const match = trimmed.match(NAIVE_WALL_CLOCK_PATTERN);
    if (!match) return null;
    return `${match[1]}T${match[2]}:${match[3]}:${match[4]}${normalizeFraction(match[5])}`;
  }

  if (!(value instanceof Date) || Number.isNaN(value.valueOf())) {
    return null;
  }

  // Driver-local components preserve the naive DB digits under the usual
  // "timestamp without time zone → local Date" mapping.
  return formatWallClockParts(
    value.getFullYear(),
    value.getMonth() + 1,
    value.getDate(),
    value.getHours(),
    value.getMinutes(),
    value.getSeconds(),
    value.getMilliseconds(),
  );
}

function normalizeAuditCreatedAtUtcWallClock(value: Date): string {
  return formatWallClockParts(
    value.getUTCFullYear(),
    value.getUTCMonth() + 1,
    value.getUTCDate(),
    value.getUTCHours(),
    value.getUTCMinutes(),
    value.getUTCSeconds(),
    value.getUTCMilliseconds(),
  );
}

function associationMatchesNaiveWallClock(
  associationMs: number,
  wallClock: string,
): boolean {
  const asUtcMs = Date.parse(`${wallClock}Z`);
  if (!Number.isNaN(asUtcMs) && associationMs === asUtcMs) {
    return true;
  }

  const asAdelaideMs = adelaideWallClockToUtcMs(wallClock);
  return asAdelaideMs !== null && associationMs === asAdelaideMs;
}

function adelaideWallClockToUtcMs(wallClock: string): number | null {
  const [datePart, timePart = ""] = wallClock.split("T");
  const [hour = "0", minute = "0", secondPart = "0"] = timePart.split(":");
  const [second = "0"] = secondPart.split(".");
  const parsed = fromAdelaideWallClock(
    `${datePart}T${hour}:${minute}:${second}`,
  );
  if (!parsed.ok) return null;
  const fraction = timePart.includes(".")
    ? Number(timePart.split(".")[1]?.slice(0, 3).padEnd(3, "0"))
    : 0;
  if (Number.isNaN(fraction)) return null;
  return parsed.date.getTime() + fraction;
}

export function associationTimestampMatchesAuditCreatedAt(
  associationCreatedAt: string,
  auditCreatedAt: Date | string,
): boolean {
  if (!isExactIsoTimestamp(associationCreatedAt)) return false;
  const associationMs = Date.parse(associationCreatedAt);
  if (Number.isNaN(associationMs)) return false;

  if (auditCreatedAt instanceof Date) {
    if (Number.isNaN(auditCreatedAt.valueOf())) return false;
    if (associationCreatedAt === auditCreatedAt.toISOString()) {
      return true;
    }
    const localWall = normalizeAuditCreatedAtWallClock(auditCreatedAt);
    if (localWall && associationMatchesNaiveWallClock(associationMs, localWall)) {
      return true;
    }
    // Also try UTC components so a UTC-host Date for a naive column still
    // matches when evaluated on a non-UTC test/runtime host.
    return associationMatchesNaiveWallClock(
      associationMs,
      normalizeAuditCreatedAtUtcWallClock(auditCreatedAt),
    );
  }

  if (typeof auditCreatedAt === "string" && hasExplicitUtcOffset(auditCreatedAt)) {
    const absolute = new Date(auditCreatedAt);
    if (Number.isNaN(absolute.valueOf())) return false;
    return associationCreatedAt === absolute.toISOString();
  }

  const wallClock = normalizeAuditCreatedAtWallClock(auditCreatedAt);
  if (!wallClock) return false;
  return associationMatchesNaiveWallClock(associationMs, wallClock);
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
  const association: ArticleAuditAssociation = {
    version: 2,
    auditId: input.auditId,
    contentFingerprint: input.contentFingerprint,
    algorithm: "sha256",
    createdAt: input.createdAt.toISOString(),
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
      if (
        !associationTimestampMatchesAuditCreatedAt(
          association.createdAt,
          audit.createdAt,
        )
      ) {
        return [];
      }
      const associationInstant = new Date(association.createdAt);
      if (Number.isNaN(associationInstant.valueOf())) return [];
      return [{ audit, createdAt: associationInstant }];
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
