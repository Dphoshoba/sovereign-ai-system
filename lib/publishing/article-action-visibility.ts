export type ImmediatePublishVisibilityInput = {
  status: string;
  hasCurrentAudit: boolean;
  approvedAt?: Date | string | null;
  approvedBy?: string | null;
  hasFeaturedImage?: boolean;
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

export function canShowPrepareForReviewAction(input: {
  status: string;
  hasCurrentAudit: boolean;
}): boolean {
  return !input.hasCurrentAudit && PREPARE_FOR_REVIEW_STATUSES.has(input.status);
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
