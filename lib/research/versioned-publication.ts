import {
  isRecognizedVersionedSpecification,
} from "./audit-specification-compatibility";
import { PUBLISH_READY_CONSENSUS_SCORE } from "./consensus-engine";
import {
  evaluateEvReg11PublicationEligibility,
  isEvReg110Audit,
} from "./primary-source-publication";
import {
  CURRENT_RESEARCH_AUDIT_ENGINE_REVISION,
  VERSIONED_RESEARCH_AUDIT_ENGINE_REVISION,
} from "./research-audit-engine-revision";

export const VERSIONED_EDITORIAL_VERIFIER_ENV = "VERSIONED_EDITORIAL_VERIFIER_ENABLED";

export const VERSIONED_VERIFIER_ACTIVATION_BLOCKER =
  "The versioned editorial verifier stays disabled unless VERSIONED_EDITORIAL_VERIFIER_ENABLED=true on the verified non-Production Preview environment.";

export function isVersionedEditorialVerifierEnabled(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return env[VERSIONED_EDITORIAL_VERIFIER_ENV] === "true";
}

/** Compile-time default when the Preview env flag is unset. Prefer isVersionedEditorialVerifierEnabled(). */
export const VERSIONED_EDITORIAL_VERIFIER_ENABLED = false;

export function revisionWrittenByEditorialPrepare(
  env: NodeJS.ProcessEnv = process.env,
):
  | typeof CURRENT_RESEARCH_AUDIT_ENGINE_REVISION
  | typeof VERSIONED_RESEARCH_AUDIT_ENGINE_REVISION {
  return isVersionedEditorialVerifierEnabled(env)
    ? VERSIONED_RESEARCH_AUDIT_ENGINE_REVISION
    : CURRENT_RESEARCH_AUDIT_ENGINE_REVISION;
}

export function versionedAverageVerificationScore(scores: number[]): number | null {
  if (scores.length === 0 || scores.some((score) => !Number.isFinite(score))) return null;
  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}

export function versionedPublicationMetadataProblem(audit: {
  id?: unknown;
  specificationVersion?: unknown;
  disputes?: unknown;
  averageVerificationScore?: unknown;
  engineRevision?: unknown;
  consensusScore?: unknown;
  sourceQualityScore?: unknown;
  publicationRecommendation?: unknown;
  facts?: unknown;
} | null | undefined): string | null {
  if (!audit || audit.specificationVersion == null) return null;
  if (!isRecognizedVersionedSpecification(audit.specificationVersion)) {
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
  if (typeof audit.averageVerificationScore !== "number") {
    return "Versioned audit average verification is below the publication threshold.";
  }
  // EV-REG-SPEC-1.1.0: independence thresholds must not disqualify confirmed
  // primary-source-only articles. Defer numeric independence checks to the
  // primary-source eligibility evaluator when recommendation is publish-ready.
  if (isEvReg110Audit(audit.specificationVersion)) {
    if (audit.publicationRecommendation === "publish-ready") {
      const eligibility = evaluateEvReg11PublicationEligibility({
        auditId: typeof audit.id === "string" ? audit.id : null,
        specificationVersion: audit.specificationVersion,
        consensusScore: audit.consensusScore,
        sourceQualityScore: audit.sourceQualityScore,
        averageVerificationScore: audit.averageVerificationScore,
        publicationRecommendation: audit.publicationRecommendation,
        facts: audit.facts,
      });
      if (!eligibility.ready) return eligibility.reason;
      return null;
    }
    return null;
  }
  if (audit.averageVerificationScore < PUBLISH_READY_CONSENSUS_SCORE) {
    return "Versioned audit average verification is below the publication threshold.";
  }
  return null;
}
