import { buildGammaStage5ApiManifest } from "./stage-5-api-manifest";
import { buildGammaStage5DeploymentSummary } from "./stage-5-deployment-summary";
import { buildGammaStage5OperatorSignoffSource } from "./stage-5-operator-signoff";
import { buildGammaStage5ReadinessSnapshot } from "./stage-5-readiness";

export interface GammaStage5EvidenceIndexEntry {
  order: number;
  path: string;
  audience: "operator" | "monitor" | "release-client";
  sourceContract: string;
  operatorApprovalArtifact: boolean;
}

export interface GammaStage5EvidenceIndex {
  id: "gamma_2_stage_5_evidence_index";
  status: "indexed-for-release-review";
  generatedAt: Date;
  branch: "gamma";
  apiSurfaceCount: number;
  smoke: string;
  operatorApprovalArtifactCount: number;
  entries: GammaStage5EvidenceIndexEntry[];
  indexRule: "stage-5-evidence-index-derived-from-manifest-and-signoff";
}

export function buildGammaStage5EvidenceIndex(): GammaStage5EvidenceIndex {
  const readiness = buildGammaStage5ReadinessSnapshot();
  const deploymentSummary = buildGammaStage5DeploymentSummary();
  const manifest = buildGammaStage5ApiManifest();
  const signoff = buildGammaStage5OperatorSignoffSource();
  const operatorArtifacts = new Set(signoff.signoffArtifacts);
  const entries = manifest.endpoints.map((endpoint, index) => ({
    order: index + 1,
    path: endpoint.path,
    audience: endpoint.audience,
    sourceContract: endpoint.sourceContract,
    operatorApprovalArtifact: operatorArtifacts.has(endpoint.path),
  }));

  return {
    id: "gamma_2_stage_5_evidence_index",
    status: "indexed-for-release-review",
    generatedAt: new Date(readiness.generatedAt),
    branch: readiness.branch,
    apiSurfaceCount: deploymentSummary.apiSurface.length,
    smoke: readiness.verification.smoke,
    operatorApprovalArtifactCount: entries.filter((entry) => entry.operatorApprovalArtifact).length,
    entries,
    indexRule: "stage-5-evidence-index-derived-from-manifest-and-signoff",
  };
}
