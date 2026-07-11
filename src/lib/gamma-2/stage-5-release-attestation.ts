import { PRODUCTION_APP_URL } from "../site-config";
import { buildGammaStage5ContractDigest } from "./stage-5-contract-digest";
import { buildGammaStage5DeploymentSummary } from "./stage-5-deployment-summary";
import { buildGammaStage5EvidenceBundle } from "./stage-5-evidence";
import { buildGammaStage5ReleaseGate } from "./stage-5-release-gate";

export interface GammaStage5ReleaseAttestation {
  id: "gamma_2_stage_5_release_attestation";
  status: "ready-for-attested-promotion";
  generatedAt: Date;
  branch: "gamma";
  productionUrl: typeof PRODUCTION_APP_URL;
  digest: {
    algorithm: "sha256";
    fingerprint: string;
    endpointCount: number;
  };
  verification: {
    tests: string;
    determinism: string;
    build: string;
    smoke: string;
  };
  evidenceTags: string[];
  releaseChecks: {
    pass: number;
    operatorRequired: number;
    total: number;
  };
  operatorRule: "human-approval-before-production";
  attestationRule: "digest-verification-and-release-gate-required-for-promotion";
}

export function buildGammaStage5ReleaseAttestation(): GammaStage5ReleaseAttestation {
  const digest = buildGammaStage5ContractDigest();
  const deploymentSummary = buildGammaStage5DeploymentSummary();
  const evidence = buildGammaStage5EvidenceBundle();
  const releaseGate = buildGammaStage5ReleaseGate();
  const pass = releaseGate.checks.filter((check) => check.status === "pass").length;
  const operatorRequired = releaseGate.checks.filter(
    (check) => check.status === "operator-required"
  ).length;

  return {
    id: "gamma_2_stage_5_release_attestation",
    status: "ready-for-attested-promotion",
    generatedAt: new Date(deploymentSummary.generatedAt),
    branch: releaseGate.branch,
    productionUrl: PRODUCTION_APP_URL,
    digest: {
      algorithm: digest.algorithm,
      fingerprint: digest.fingerprint,
      endpointCount: digest.endpointCount,
    },
    verification: { ...deploymentSummary.verification },
    evidenceTags: [...evidence.tags],
    releaseChecks: {
      pass,
      operatorRequired,
      total: releaseGate.checks.length,
    },
    operatorRule: "human-approval-before-production",
    attestationRule: "digest-verification-and-release-gate-required-for-promotion",
  };
}
