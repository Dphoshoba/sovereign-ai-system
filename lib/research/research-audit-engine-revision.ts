export const CURRENT_RESEARCH_AUDIT_ENGINE_REVISION =
  "article-grounded-v14" as const;

export const VERSIONED_RESEARCH_AUDIT_ENGINE_REVISION =
  "article-grounded-ev-reg-1" as const;

export const ACCEPTED_CURRENT_RESEARCH_AUDIT_ENGINE_REVISIONS = [
  CURRENT_RESEARCH_AUDIT_ENGINE_REVISION,
  VERSIONED_RESEARCH_AUDIT_ENGINE_REVISION,
] as const;

export const RESEARCH_AUDIT_ENGINE_REVISION_PATTERN =
  /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const MAX_RESEARCH_AUDIT_ENGINE_REVISION_LENGTH = 64;

export type ResearchAuditEngineRevision = string;

export function isResearchAuditEngineRevision(
  value: unknown,
): value is ResearchAuditEngineRevision {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= MAX_RESEARCH_AUDIT_ENGINE_REVISION_LENGTH &&
    RESEARCH_AUDIT_ENGINE_REVISION_PATTERN.test(value)
  );
}

export function isCurrentResearchAuditEngineRevision(value: string): boolean {
  return ACCEPTED_CURRENT_RESEARCH_AUDIT_ENGINE_REVISIONS.some(
    (revision) => revision === value,
  );
}
