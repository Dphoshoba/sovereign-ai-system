import { ADOPTED_AUDIT_SPECIFICATION_VERSION } from "../research/audit-specification-compatibility";
import { isVersionedEditorialVerifierEnabled } from "../research/versioned-publication";

export type ImmediatePublishVisibilityInput = {
  status: string;
  hasCurrentAudit: boolean;
  approvedAt?: Date | string | null;
  approvedBy?: string | null;
  hasFeaturedImage?: boolean;
};

export type PrepareForReviewVisibilityInput = {
  status: string;
  hasCurrentAudit: boolean;
  /**
   * When a current audit exists and the versioned verifier is active, Prepare
   * is shown if that audit is not already on the adopted governance
   * specification (baseline/null or older versioned). Same adopted-version
   * audits stay duplicate-blocked. When the versioned verifier is off,
   * Prepare stays hidden whenever a current audit exists.
   */
  currentAuditSpecificationVersion?: string | null;
};

const PREPARE_FOR_REVIEW_STATUSES = new Set([
  "draft",
  "review",
  "review-required",
]);

export function hasApprovalMetadata(
  approvedAt?: Date | string | null,
  approvedBy?: string | null,
): boolean {
  if (!approvedAt) return false;
  return Boolean(typeof approvedBy === "string" && approvedBy.trim());
}

/**
 * True when an existing current audit may be re-evaluated via Prepare.
 * Aligns with prepare-article-for-review duplicate / upgrade rules.
 */
export function canRePrepareCurrentAudit(input: {
  currentAuditSpecificationVersion?: string | null;
  versionedVerifierEnabled?: boolean;
}): boolean {
  const versioned =
    input.versionedVerifierEnabled ?? isVersionedEditorialVerifierEnabled();
  if (!versioned) return false;
  return (
    input.currentAuditSpecificationVersion !==
    ADOPTED_AUDIT_SPECIFICATION_VERSION
  );
}

/**
 * True when the editor may run Prepare for Review from the dashboard.
 */
export function canShowPrepareForReviewAction(
  input: PrepareForReviewVisibilityInput & {
    versionedVerifierEnabled?: boolean;
  },
): boolean {
  if (!PREPARE_FOR_REVIEW_STATUSES.has(input.status)) return false;
  if (!input.hasCurrentAudit) return true;
  return canRePrepareCurrentAudit(input);
}

export function canShowScheduleAction(input: {
  status: string;
  hasCurrentAudit: boolean;
}): boolean {
  return input.status === "approved" && input.hasCurrentAudit;
}

export function canShowImmediatePublishAction(
  input: ImmediatePublishVisibilityInput,
): boolean {
  return (
    input.status === "approved" &&
    input.hasCurrentAudit &&
    hasApprovalMetadata(input.approvedAt, input.approvedBy) &&
    Boolean(input.hasFeaturedImage)
  );
}

export function publicationReadinessMessage(
  input: ImmediatePublishVisibilityInput,
): string | null {
  if (input.status !== "approved") return null;
  if (!input.hasCurrentAudit) {
    return "Publication and scheduling require a current research audit matching this content revision.";
  }
  if (!hasApprovalMetadata(input.approvedAt, input.approvedBy)) {
    return "Approval metadata is required before publication.";
  }
  if (!input.hasFeaturedImage) {
    return "A featured image is required before publication.";
  }
  return null;
}
