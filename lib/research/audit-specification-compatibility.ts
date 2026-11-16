export const EV_REG_SPEC_1_0_0 = "EV-REG-SPEC-1.0.0" as const;
export const EV_REG_SPEC_1_1_0 = "EV-REG-SPEC-1.1.0" as const;

/** New Prepare writes write this version after EV-REG-SPEC-1.1.0 activation. */
export const ADOPTED_AUDIT_SPECIFICATION_VERSION = EV_REG_SPEC_1_1_0;

/** Historical versioned audits remain recognizable under their own gate. */
export const RECOGNIZED_VERSIONED_SPECIFICATIONS = [
  EV_REG_SPEC_1_0_0,
  EV_REG_SPEC_1_1_0,
] as const;

export type RecognizedVersionedSpecification =
  (typeof RECOGNIZED_VERSIONED_SPECIFICATIONS)[number];

export type AuditSpecificationSemantics = "baseline" | "versioned";

export type AuditSpecificationFields = {
  specificationVersion?: string | null;
  disputes?: unknown;
};

export function isRecognizedVersionedSpecification(
  value: unknown,
): value is RecognizedVersionedSpecification {
  return (
    value === EV_REG_SPEC_1_0_0 ||
    value === EV_REG_SPEC_1_1_0
  );
}

export function auditSpecificationSemantics(
  audit: AuditSpecificationFields,
): AuditSpecificationSemantics {
  if (audit.specificationVersion == null) return "baseline";
  return "versioned";
}

export function versionedDisputeMetadataProblem(
  audit: AuditSpecificationFields,
): string | null {
  if (auditSpecificationSemantics(audit) === "baseline") return null;
  if (!isRecognizedVersionedSpecification(audit.specificationVersion)) {
    return "Versioned audit specification is not the adopted contract.";
  }
  if (!Array.isArray(audit.disputes)) {
    return "Versioned audit dispute metadata is missing.";
  }
  return null;
}
