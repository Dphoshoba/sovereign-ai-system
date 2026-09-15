import {
  computeArticleAuditFingerprint,
  type AuditableArticleState,
} from "./article-audit-fingerprint";

export const RESEARCH_AUDIT_FINGERPRINT_ACTION =
  "research-audit-fingerprint" as const;

const ASSOCIATION_KEYS = [
  "algorithm",
  "auditId",
  "contentFingerprint",
  "createdAt",
  "version",
] as const;
const SHA256_PATTERN = /^[a-f0-9]{64}$/;

export type ArticleAuditAssociation = {
  version: 1;
  auditId: string;
  contentFingerprint: string;
  algorithm: "sha256";
  createdAt: string;
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

export function isResearchAuditFingerprintNote(note: {
  action: string;
}): boolean {
  return note.action === RESEARCH_AUDIT_FINGERPRINT_ACTION;
}

export function serializeArticleAuditAssociation(input: {
  auditId: string;
  contentFingerprint: string;
  createdAt: Date;
}): string {
  const association: ArticleAuditAssociation = {
    version: 1,
    auditId: input.auditId,
    contentFingerprint: input.contentFingerprint,
    algorithm: "sha256",
    createdAt: input.createdAt.toISOString(),
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
      record.version !== 1 ||
      record.algorithm !== "sha256" ||
      typeof record.auditId !== "string" ||
      record.auditId.length === 0 ||
      record.auditId.trim() !== record.auditId ||
      typeof record.contentFingerprint !== "string" ||
      !SHA256_PATTERN.test(record.contentFingerprint) ||
      !isExactIsoTimestamp(record.createdAt)
    ) {
      return null;
    }

    return {
      version: 1,
      auditId: record.auditId,
      contentFingerprint: record.contentFingerprint,
      algorithm: "sha256",
      createdAt: record.createdAt,
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
        association.contentFingerprint !== currentFingerprint
      ) {
        return [];
      }
      const audit = auditsById.get(association.auditId);
      if (!audit) return [];
      const createdAt = new Date(audit.createdAt);
      if (Number.isNaN(createdAt.valueOf())) return [];
      if (association.createdAt !== createdAt.toISOString()) return [];
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
