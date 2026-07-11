import { PRODUCTION_APP_URL } from "../site-config";
import { buildGammaStage5EvidenceIndex } from "./stage-5-evidence-index";
import { buildGammaStage5OperatorSignoff } from "./stage-5-operator-signoff";
import { buildGammaStage5ReleaseRetentionPolicy } from "./stage-5-release-retention-policy";

export interface GammaStage5ReleaseComplianceControl {
  id: string;
  category: "approval" | "archive" | "governance" | "rollback";
  evidence: string;
  status: "mapped";
}

export interface GammaStage5ReleaseComplianceMatrix {
  id: "gamma_2_stage_5_release_compliance_matrix";
  status: "ready-for-compliance-review";
  generatedAt: Date;
  branch: "gamma";
  productionUrl: typeof PRODUCTION_APP_URL;
  apiSurfaceCount: number;
  mappedControlCount: number;
  operatorApprovalArtifactCount: number;
  controls: GammaStage5ReleaseComplianceControl[];
  matrixRule: "stage-5-compliance-controls-map-to-signoff-retention-and-evidence";
}

export function buildGammaStage5ReleaseComplianceMatrix(): GammaStage5ReleaseComplianceMatrix {
  const evidenceIndex = buildGammaStage5EvidenceIndex();
  const signoff = buildGammaStage5OperatorSignoff();
  const retentionPolicy = buildGammaStage5ReleaseRetentionPolicy();

  const controls: GammaStage5ReleaseComplianceControl[] = [
    {
      id: "human-approval-boundary",
      category: "approval",
      evidence: signoff.signoffRule,
      status: "mapped",
    },
    {
      id: "release-record-retention",
      category: "archive",
      evidence: retentionPolicy.retentionRule,
      status: "mapped",
    },
    {
      id: "indexed-evidence-surface",
      category: "governance",
      evidence: evidenceIndex.indexRule,
      status: "mapped",
    },
    {
      id: "protected-rollback-tag",
      category: "rollback",
      evidence: retentionPolicy.protectedTag,
      status: "mapped",
    },
  ];

  return {
    id: "gamma_2_stage_5_release_compliance_matrix",
    status: "ready-for-compliance-review",
    generatedAt: new Date(evidenceIndex.generatedAt),
    branch: evidenceIndex.branch,
    productionUrl: PRODUCTION_APP_URL,
    apiSurfaceCount: evidenceIndex.apiSurfaceCount,
    mappedControlCount: controls.length,
    operatorApprovalArtifactCount: evidenceIndex.operatorApprovalArtifactCount,
    controls,
    matrixRule: "stage-5-compliance-controls-map-to-signoff-retention-and-evidence",
  };
}
