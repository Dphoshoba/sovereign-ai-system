export const ADOPTED_AUDIT_SPECIFICATION_VERSION = "EV-REG-SPEC-1.0.0" as const;

export type AuditSpecificationSemantics = "baseline" | "versioned";

export type AuditSpecificationFields = {
  specificationVersion?: string | null;
  disputes?: unknown;
};

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
  if (audit.specificationVersion !== ADOPTED_AUDIT_SPECIFICATION_VERSION) {
    return "Versioned audit specification is not the adopted contract.";
  }
  if (!Array.isArray(audit.disputes)) {
    return "Versioned audit dispute metadata is missing.";
  }
  return null;
}
