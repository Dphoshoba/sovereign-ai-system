import { PRODUCTION_APP_URL } from "../site-config";
import { buildGammaStage5PromotionChecklist } from "./stage-5-promotion-checklist";
import { buildGammaStage5ReleaseAttestation } from "./stage-5-release-attestation";
import { buildGammaStage5ReleaseExceptionRegister } from "./stage-5-release-exception-register";
import { buildGammaStage5ReleaseGate } from "./stage-5-release-gate";
import { buildGammaStage5ReleaseGovernanceMap } from "./stage-5-release-governance-map";

export interface GammaStage5ReleaseDecisionEvidence {
  id: string;
  source: string;
  evidence: string;
  required: true;
}

export interface GammaStage5ReleaseDecisionRecord {
  id: "gamma_2_stage_5_release_decision_record";
  status: "pending-operator-approval";
  generatedAt: Date;
  branch: "gamma";
  productionUrl: typeof PRODUCTION_APP_URL;
  apiSurfaceCount: number;
  digestFingerprint: string;
  passCheckCount: number;
  operatorRequiredCount: number;
  openExceptionCount: 0;
  decisionEvidence: GammaStage5ReleaseDecisionEvidence[];
  decisionRule: "stage-5-production-promotion-remains-pending-until-operator-approval";
}

export function buildGammaStage5ReleaseDecisionRecord(): GammaStage5ReleaseDecisionRecord {
  const attestation = buildGammaStage5ReleaseAttestation();
  const exceptionRegister = buildGammaStage5ReleaseExceptionRegister();
  const governanceMap = buildGammaStage5ReleaseGovernanceMap();
  const checklist = buildGammaStage5PromotionChecklist();
  const releaseGate = buildGammaStage5ReleaseGate();

  return {
    id: "gamma_2_stage_5_release_decision_record",
    status: "pending-operator-approval",
    generatedAt: new Date(governanceMap.generatedAt),
    branch: governanceMap.branch,
    productionUrl: PRODUCTION_APP_URL,
    apiSurfaceCount: governanceMap.apiSurfaceCount,
    digestFingerprint: attestation.digest.fingerprint,
    passCheckCount: attestation.releaseChecks.pass,
    operatorRequiredCount: governanceMap.operatorRequiredCount,
    openExceptionCount: exceptionRegister.openExceptionCount,
    decisionEvidence: [
      {
        id: "attested-contract-digest",
        source: "/api/gamma/stage-5/release-attestation",
        evidence: attestation.attestationRule,
        required: true,
      },
      {
        id: "operator-promotion-gate",
        source: "/api/gamma/stage-5/release-gate",
        evidence: releaseGate.releaseRule,
        required: true,
      },
      {
        id: "ordered-promotion-checklist",
        source: "/api/gamma/stage-5/promotion-checklist",
        evidence: checklist.checklistRule,
        required: true,
      },
      {
        id: "mapped-governance-review",
        source: "/api/gamma/stage-5/release-governance-map",
        evidence: governanceMap.governanceRule,
        required: true,
      },
      {
        id: "closed-exception-register",
        source: "/api/gamma/stage-5/release-exception-register",
        evidence: exceptionRegister.exceptionRule,
        required: true,
      },
    ],
    decisionRule: "stage-5-production-promotion-remains-pending-until-operator-approval",
  };
}
