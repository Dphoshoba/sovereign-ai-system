import { ADOPTED_AUDIT_SPECIFICATION_VERSION } from "./audit-specification-compatibility";
import { PUBLISH_READY_CONSENSUS_SCORE } from "./consensus-engine";
import {
  CURRENT_RESEARCH_AUDIT_ENGINE_REVISION,
  VERSIONED_RESEARCH_AUDIT_ENGINE_REVISION,
} from "./research-audit-engine-revision";

export const VERSIONED_EDITORIAL_VERIFIER_ENABLED = false;

export const VERSIONED_VERIFIER_ACTIVATION_BLOCKER =
  "The versioned editorial verifier stays disabled until a verified non-Production audit schema is inspected.";

export function revisionWrittenByEditorialPrepare(): typeof CURRENT_RESEARCH_AUDIT_ENGINE_REVISION {
  return CURRENT_RESEARCH_AUDIT_ENGINE_REVISION;
}

export function versionedAverageVerificationScore(scores: number[]): number | null {
  if (scores.length === 0 || scores.some((score) => !Number.isFinite(score))) return null;
  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}

export function versionedPublicationMetadataProblem(audit: {
  specificationVersion?: unknown;
  disputes?: unknown;
  averageVerificationScore?: unknown;
  engineRevision?: unknown;
} | null | undefined): string | null {
  if (!audit || audit.specificationVersion == null) return null;
  if (audit.specificationVersion !== ADOPTED_AUDIT_SPECIFICATION_VERSION) {
    return "Versioned audit specification is not the adopted contract.";
  }
  if (!Array.isArray(audit.disputes)) {
    return "Versioned audit dispute metadata is missing.";
  }
  for (const dispute of audit.disputes) {
    if (!dispute || typeof dispute !== "object") {
      return "Versioned audit dispute metadata is missing.";
    }
    const record = dispute as Record<string, unknown>;
    const cleared =
      (record.resolution === "not-a-contradiction" || record.resolution === "source-withdrawn") &&
      record.resolvedDisputeId === record.disputeId &&
      record.resolutionExpired !== true;
    if (!cleared) return "An unresolved dispute blocks publication.";
  }
  if (audit.engineRevision !== VERSIONED_RESEARCH_AUDIT_ENGINE_REVISION) {
    return "Versioned audit engine revision is missing.";
  }
  if (
    typeof audit.averageVerificationScore !== "number" ||
    audit.averageVerificationScore < PUBLISH_READY_CONSENSUS_SCORE
  ) {
    return "Versioned audit average verification is below the publication threshold.";
  }
  return null;
}
