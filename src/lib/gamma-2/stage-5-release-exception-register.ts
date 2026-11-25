import { PRODUCTION_APP_URL } from "../site-config";
import { buildGammaStage5ReleaseComplianceMatrix } from "./stage-5-release-compliance-matrix";
import { buildGammaStage5ReleaseGate } from "./stage-5-release-gate";
import { buildGammaStage5ReleaseRetentionPolicy } from "./stage-5-release-retention-policy";

export interface GammaStage5ReleaseExceptionRecord {
  id: string;
  category: "approval" | "archive" | "governance" | "rollback";
  status: "closed";
  evidence: string;
}

export interface GammaStage5ReleaseExceptionRegister {
  id: "gamma_2_stage_5_release_exception_register";
  status: "ready-for-exception-review";
  generatedAt: Date;
  branch: "gamma";
  productionUrl: typeof PRODUCTION_APP_URL;
  apiSurfaceCount: number;
  mappedControlCount: number;
  openExceptionCount: 0;
  closedExceptionCount: number;
  operatorRequiredCount: number;
  exceptions: GammaStage5ReleaseExceptionRecord[];
  exceptionRule: "stage-5-release-exceptions-require-operator-approval-before-promotion";
}

export function buildGammaStage5ReleaseExceptionRegister(): GammaStage5ReleaseExceptionRegister {
  const complianceMatrix = buildGammaStage5ReleaseComplianceMatrix();
  const releaseGate = buildGammaStage5ReleaseGate();
  const retentionPolicy = buildGammaStage5ReleaseRetentionPolicy();

  const exceptions: GammaStage5ReleaseExceptionRecord[] = [
    {
      id: "no-unmapped-compliance-controls",
      category: "governance",
      status: "closed",
      evidence: complianceMatrix.matrixRule,
    },
    {
      id: "no-unretained-release-records",
      category: "archive",
      status: "closed",
      evidence: retentionPolicy.retentionRule,
    },
    {
      id: "operator-approval-required-for-promotion-exceptions",
      category: "approval",
      status: "closed",
      evidence: releaseGate.releaseRule,
    },
    {
      id: "protected-rollback-tag-available",
      category: "rollback",
      status: "closed",
      evidence: retentionPolicy.protectedTag,
    },
  ];

  return {
    id: "gamma_2_stage_5_release_exception_register",
    status: "ready-for-exception-review",
    generatedAt: new Date(complianceMatrix.generatedAt),
    branch: complianceMatrix.branch,
    productionUrl: PRODUCTION_APP_URL,
    apiSurfaceCount: complianceMatrix.apiSurfaceCount,
    mappedControlCount: complianceMatrix.mappedControlCount,
    openExceptionCount: 0,
    closedExceptionCount: exceptions.length,
    operatorRequiredCount: releaseGate.checks.filter((check) => check.status === "operator-required")
      .length,
    exceptions,
    exceptionRule: "stage-5-release-exceptions-require-operator-approval-before-promotion",
  };
}
