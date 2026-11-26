export const CORRECTED_AND_UNPUBLISHED_ACTION =
  "corrected-and-unpublished" as const;

export const CORRECTABLE_AUDITED_FIELDS = [
  "title",
  "excerpt",
  "content",
  "category",
  "seoTitle",
  "seoDescription",
  "seoKeywords",
] as const;

export type CorrectableAuditedField =
  (typeof CORRECTABLE_AUDITED_FIELDS)[number];

export type CorrectableAuditedChanges = {
  title?: string;
  excerpt?: string | null;
  content?: string | null;
  category?: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string | null;
};

export type CorrectAndWithdrawRequest = {
  articleId: string;
  reason: string;
  changes: CorrectableAuditedChanges;
};

export type CorrectAndWithdrawFailure = {
  ok: false;
  code:
    | "article_not_found"
    | "invalid_request"
    | "invalid_article_status"
    | "no_effective_change"
    | "correction_conflict"
    | "correction_failed";
  error: string;
  articleUnchanged: true;
};

export type CorrectAndWithdrawSuccess<TArticle> = {
  ok: true;
  article: TArticle;
  articleUnchanged: false;
  changedFields: CorrectableAuditedField[];
  previousFingerprint: string;
  newFingerprint: string;
  note: string;
};

export type CorrectAndWithdrawResult<TArticle> =
  | CorrectAndWithdrawSuccess<TArticle>
  | CorrectAndWithdrawFailure;

export type CorrectionGovernanceNote = {
  version: 1;
  articleId: string;
  reason: string;
  changedFields: CorrectableAuditedField[];
  previousStatus: "published";
  newStatus: "review-required";
  previousFingerprint: string;
  newFingerprint: string;
  correctedAt: string;
  correctedBy: string;
};

const TOP_LEVEL_KEYS = new Set(["articleId", "reason", "changes"]);
const CORRECTABLE_KEY_SET = new Set<string>(CORRECTABLE_AUDITED_FIELDS);
const REQUIRED_STRING_FIELDS = new Set(["title", "category"]);
const FORBIDDEN_FIELDS = new Set([
  "status",
  "approvedAt",
  "approvedBy",
  "scheduledFor",
  "publishedAt",
  "featuredImage",
  "slug",
  "editorialScore",
  "editorialGrade",
  "editorialWarnings",
  "qualityScore",
  "qualityGrade",
  "seoScore",
  "seoGrade",
  "scores",
  "grades",
  "researchSources",
  "sources",
  "ctaType",
  "ctaContent",
  "ctaDestination",
]);
const NOTE_KEYS = [
  "articleId",
  "changedFields",
  "correctedAt",
  "correctedBy",
  "newFingerprint",
  "newStatus",
  "previousFingerprint",
  "previousStatus",
  "reason",
  "version",
] as const;

export type CorrectAndWithdrawParseFailure = {
  ok: false;
  code: "invalid_request";
  error: string;
  articleUnchanged: true;
};

export type CorrectAndWithdrawParseSuccess = {
  ok: true;
  value: CorrectAndWithdrawRequest;
};

function failParse(error: string): CorrectAndWithdrawParseFailure {
  return {
    ok: false,
    code: "invalid_request",
    error,
    articleUnchanged: true,
  };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function firstUnexpectedKey(
  record: Record<string, unknown>,
  allowed: Set<string>,
): { key: string; forbidden: boolean } | null {
  for (const key of Object.keys(record)) {
    if (FORBIDDEN_FIELDS.has(key)) {
      return { key, forbidden: true };
    }
    if (!allowed.has(key)) {
      return { key, forbidden: false };
    }
  }
  return null;
}

function parseNullableText(
  field: string,
  value: unknown,
): string | null | CorrectAndWithdrawParseFailure {
  if (value === null) return null;
  if (typeof value !== "string") {
    return failParse(`Field "${field}" must be a string or null.`);
  }
  return value.trim() === "" ? null : value;
}

function parseRequiredText(
  field: string,
  value: unknown,
): string | CorrectAndWithdrawParseFailure {
  if (typeof value !== "string") {
    return failParse(`Field "${field}" must be a non-empty string.`);
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return failParse(`Field "${field}" must be a non-empty string.`);
  }
  return trimmed;
}

export function parseCorrectAndWithdrawRequest(
  body: unknown,
): CorrectAndWithdrawParseSuccess | CorrectAndWithdrawParseFailure {
  if (!isPlainObject(body)) {
    return failParse("Request body must be a JSON object.");
  }

  const unexpected = firstUnexpectedKey(body, TOP_LEVEL_KEYS);
  if (unexpected) {
    return failParse(
      unexpected.forbidden
        ? `Forbidden field "${unexpected.key}" is not allowed.`
        : `Unknown field "${unexpected.key}" is not allowed.`,
    );
  }

  if (typeof body.articleId !== "string" || body.articleId.trim() === "") {
    return failParse("articleId is required.");
  }
  if (body.articleId.trim() !== body.articleId) {
    return failParse("articleId must not include leading or trailing whitespace.");
  }

  if (typeof body.reason !== "string") {
    return failParse("reason is required.");
  }
  const reason = body.reason.trim();
  if (!reason) {
    return failParse("reason is required.");
  }

  if (!isPlainObject(body.changes)) {
    return failParse("changes must be an object containing at least one audited field.");
  }

  const unexpectedChange = firstUnexpectedKey(body.changes, CORRECTABLE_KEY_SET);
  if (unexpectedChange) {
    return failParse(
      unexpectedChange.forbidden
        ? `Forbidden field "${unexpectedChange.key}" is not allowed.`
        : `Unknown field "${unexpectedChange.key}" is not allowed.`,
    );
  }

  const changeKeys = Object.keys(body.changes);
  if (changeKeys.length === 0) {
    return failParse("changes must contain at least one permitted audited field.");
  }

  const changes: CorrectableAuditedChanges = {};
  for (const field of CORRECTABLE_AUDITED_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(body.changes, field)) continue;
    const raw = body.changes[field];
    if (REQUIRED_STRING_FIELDS.has(field)) {
      const parsed = parseRequiredText(field, raw);
      if (typeof parsed !== "string") return parsed;
      if (field === "title") changes.title = parsed;
      if (field === "category") changes.category = parsed;
    } else {
      const parsed = parseNullableText(field, raw);
      if (parsed !== null && typeof parsed !== "string") return parsed;
      if (field === "excerpt") changes.excerpt = parsed;
      if (field === "content") changes.content = parsed;
      if (field === "seoTitle") changes.seoTitle = parsed;
      if (field === "seoDescription") changes.seoDescription = parsed;
      if (field === "seoKeywords") changes.seoKeywords = parsed;
    }
  }

  if (Object.keys(changes).length === 0) {
    return failParse("changes must contain at least one permitted audited field.");
  }

  return {
    ok: true,
    value: {
      articleId: body.articleId,
      reason,
      changes,
    },
  };
}

export function serializeCorrectionGovernanceNote(
  note: CorrectionGovernanceNote,
): string {
  const record: CorrectionGovernanceNote = {
    version: 1,
    articleId: note.articleId,
    reason: note.reason,
    changedFields: [...note.changedFields],
    previousStatus: "published",
    newStatus: "review-required",
    previousFingerprint: note.previousFingerprint,
    newFingerprint: note.newFingerprint,
    correctedAt: note.correctedAt,
    correctedBy: note.correctedBy,
  };
  return JSON.stringify(record);
}

export function parseCorrectionGovernanceNote(
  raw: string | null,
): CorrectionGovernanceNote | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!isPlainObject(value)) return null;
    const keys = Object.keys(value).sort();
    if (
      keys.length !== NOTE_KEYS.length ||
      !NOTE_KEYS.every((key, index) => key === keys[index])
    ) {
      return null;
    }
    if (
      value.version !== 1 ||
      typeof value.articleId !== "string" ||
      typeof value.reason !== "string" ||
      value.previousStatus !== "published" ||
      value.newStatus !== "review-required" ||
      typeof value.previousFingerprint !== "string" ||
      typeof value.newFingerprint !== "string" ||
      typeof value.correctedAt !== "string" ||
      typeof value.correctedBy !== "string" ||
      !Array.isArray(value.changedFields) ||
      !value.changedFields.every(
        (field): field is CorrectableAuditedField =>
          typeof field === "string" && CORRECTABLE_KEY_SET.has(field),
      )
    ) {
      return null;
    }
    const parsed = new Date(value.correctedAt);
    if (Number.isNaN(parsed.valueOf()) || parsed.toISOString() !== value.correctedAt) {
      return null;
    }
    return {
      version: 1,
      articleId: value.articleId,
      reason: value.reason,
      changedFields: value.changedFields,
      previousStatus: "published",
      newStatus: "review-required",
      previousFingerprint: value.previousFingerprint,
      newFingerprint: value.newFingerprint,
      correctedAt: value.correctedAt,
      correctedBy: value.correctedBy,
    };
  } catch {
    return null;
  }
}

export function collectEffectiveAuditedChanges(
  article: Record<CorrectableAuditedField, string | null>,
  changes: CorrectableAuditedChanges,
): { changedFields: CorrectableAuditedField[]; data: CorrectableAuditedChanges } {
  const data: CorrectableAuditedChanges = {};
  const changedFields: CorrectableAuditedField[] = [];
  for (const field of CORRECTABLE_AUDITED_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(changes, field)) continue;
    const next = changes[field];
    if (next === undefined || next === article[field]) continue;
    changedFields.push(field);
    if (field === "title" && typeof next === "string") data.title = next;
    else if (field === "category" && typeof next === "string") data.category = next;
    else if (field === "excerpt") data.excerpt = next;
    else if (field === "content") data.content = next;
    else if (field === "seoTitle") data.seoTitle = next;
    else if (field === "seoDescription") data.seoDescription = next;
    else if (field === "seoKeywords") data.seoKeywords = next;
  }
  return { changedFields, data };
}
