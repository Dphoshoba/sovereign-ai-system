import { PRODUCTION_APP_URL } from "../site-config";
import { buildGammaStage5OperatorSignoff } from "./stage-5-operator-signoff";
import { buildGammaStage5ReleaseComplianceMatrix } from "./stage-5-release-compliance-matrix";
import { buildGammaStage5ReleaseExceptionRegister } from "./stage-5-release-exception-register";
import { buildGammaStage5ReleaseRetentionPolicy } from "./stage-5-release-retention-policy";
import { buildGammaStage5RollbackPlanSource } from "./stage-5-rollback-plan";

export interface GammaStage5ReleaseGovernanceLane {
  id: string;
  owner: "operator" | "release-client";
  source: string;
  evidence: string;
  status: "mapped";
}

export interface GammaStage5ReleaseGovernanceMap {
  id: "gamma_2_stage_5_release_governance_map";
  status: "ready-for-governance-review";
  generatedAt: Date;
  branch: "gamma";
  productionUrl: typeof PRODUCTION_APP_URL;
  apiSurfaceCount: number;
  governanceLaneCount: number;
  openExceptionCount: 0;
  operatorRequiredCount: number;
  lanes: GammaStage5ReleaseGovernanceLane[];
  governanceRule: "stage-5-release-governance-map-links-approval-compliance-exceptions-retention-and-rollback";
}

export function buildGammaStage5ReleaseGovernanceMap(): GammaStage5ReleaseGovernanceMap {
  const signoff = buildGammaStage5OperatorSignoff();
  const complianceMatrix = buildGammaStage5ReleaseComplianceMatrix();
  const exceptionRegister = buildGammaStage5ReleaseExceptionRegister();
  const retentionPolicy = buildGammaStage5ReleaseRetentionPolicy();
  const rollbackPlan = buildGammaStage5RollbackPlanSource();

  const lanes: GammaStage5ReleaseGovernanceLane[] = [
    {
      id: "operator-approval",
      owner: "operator",
      source: "/api/gamma/stage-5/operator-signoff",
      evidence: signoff.signoffRule,
      status: "mapped",
    },
    {
      id: "compliance-controls",
      owner: "release-client",
      source: "/api/gamma/stage-5/release-compliance-matrix",
      evidence: complianceMatrix.matrixRule,
      status: "mapped",
    },
    {
      id: "exception-review",
      owner: "operator",
      source: "/api/gamma/stage-5/release-exception-register",
      evidence: exceptionRegister.exceptionRule,
      status: "mapped",
    },
    {
      id: "record-retention",
      owner: "operator",
      source: "/api/gamma/stage-5/release-retention-policy",
      evidence: retentionPolicy.retentionRule,
      status: "mapped",
    },
    {
      id: "rollback-readiness",
      owner: "operator",
      source: "/api/gamma/stage-5/rollback-plan",
      evidence: rollbackPlan.rollbackRule,
      status: "mapped",
    },
  ];

  return {
    id: "gamma_2_stage_5_release_governance_map",
    status: "ready-for-governance-review",
    generatedAt: new Date(exceptionRegister.generatedAt),
    branch: exceptionRegister.branch,
    productionUrl: PRODUCTION_APP_URL,
    apiSurfaceCount: exceptionRegister.apiSurfaceCount,
    governanceLaneCount: lanes.length,
    openExceptionCount: exceptionRegister.openExceptionCount,
    operatorRequiredCount: signoff.operatorRequiredCount,
    lanes,
    governanceRule:
      "stage-5-release-governance-map-links-approval-compliance-exceptions-retention-and-rollback",
  };
}
