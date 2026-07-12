import { PRODUCTION_APP_URL } from "../site-config";
import { buildGammaStage5OperatorSignoffSource } from "./stage-5-operator-signoff";
import { buildGammaStage5ReleaseDashboard } from "./stage-5-release-dashboard";
import { buildGammaStage5ReleaseFinalizationIndexSource } from "./stage-5-release-finalization-index";
import { buildGammaStage5ReleaseProjectionContext } from "./stage-5-release-projection-context";
import { projectGammaStage5ReleaseOperatorRegistry } from "./stage-5-release-projection-registry";

export interface GammaStage5ReleaseOperatorRegistryRecord {
  order: number;
  id: string;
  label: string;
  source: string;
  status: "ready" | "operator-required";
  owner: "operator";
  evidence: string;
}

export interface GammaStage5ReleaseOperatorRegistry {
  id: "gamma_2_stage_5_release_operator_registry";
  status: "ready-for-operator-review";
  generatedAt: Date;
  branch: "gamma";
  productionUrl: typeof PRODUCTION_APP_URL;
  apiSurfaceCount: number;
  registryRecordCount: number;
  finalizationEntryCount: number;
  dashboardCardCount: number;
  signoffRequirementCount: number;
  operatorActionCount: number;
  smoke: string;
  records: GammaStage5ReleaseOperatorRegistryRecord[];
  registryRule: "stage-5-release-operator-registry-groups-dashboard-finalization-certificate-signoff-and-closeout-records";
}

export function buildGammaStage5ReleaseOperatorRegistrySource(): GammaStage5ReleaseOperatorRegistry {
  const dashboard = buildGammaStage5ReleaseDashboard();
  const finalizationIndex = buildGammaStage5ReleaseFinalizationIndexSource();
  const operatorSignoff = buildGammaStage5OperatorSignoffSource();

  const records: GammaStage5ReleaseOperatorRegistryRecord[] = [
    {
      order: 1,
      id: "release-dashboard",
      label: "Release dashboard",
      source: "/api/gamma/stage-5/release-dashboard",
      status: "ready",
      owner: "operator",
      evidence: dashboard.dashboardRule,
    },
    {
      order: 2,
      id: "release-finalization-index",
      label: "Release finalization index",
      source: "/api/gamma/stage-5/release-finalization-index",
      status: "operator-required",
      owner: "operator",
      evidence: finalizationIndex.finalizationRule,
    },
    {
      order: 3,
      id: "release-completion-certificate",
      label: "Release completion certificate",
      source: "/api/gamma/stage-5/release-completion-certificate",
      status: "operator-required",
      owner: "operator",
      evidence:
        "stage-5-release-completion-certificate-requires-readiness-closure-closeout-retention-and-attestation",
    },
    {
      order: 4,
      id: "operator-signoff",
      label: "Operator signoff",
      source: "/api/gamma/stage-5/operator-signoff",
      status: "operator-required",
      owner: "operator",
      evidence: operatorSignoff.signoffRule,
    },
    {
      order: 5,
      id: "release-closeout-packet",
      label: "Release closeout packet",
      source: "/api/gamma/stage-5/release-closeout-packet",
      status: "operator-required",
      owner: "operator",
      evidence:
        "stage-5-release-closeout-requires-operations-review-bundle-archive-retention-and-rollback-evidence",
    },
  ];

  return {
    id: "gamma_2_stage_5_release_operator_registry",
    status: "ready-for-operator-review",
    generatedAt: new Date(finalizationIndex.generatedAt),
    branch: finalizationIndex.branch,
    productionUrl: PRODUCTION_APP_URL,
    apiSurfaceCount: finalizationIndex.apiSurfaceCount,
    registryRecordCount: records.length,
    finalizationEntryCount: finalizationIndex.finalizationEntryCount,
    dashboardCardCount: dashboard.dashboardCards.length,
    signoffRequirementCount: operatorSignoff.requirements.length,
    operatorActionCount: dashboard.operatorActions.length,
    smoke: finalizationIndex.smoke,
    records,
    registryRule:
      "stage-5-release-operator-registry-groups-dashboard-finalization-certificate-signoff-and-closeout-records",
  };
}

export function buildGammaStage5ReleaseOperatorRegistry(): GammaStage5ReleaseOperatorRegistry {
  return projectGammaStage5ReleaseOperatorRegistry(buildGammaStage5ReleaseProjectionContext());
}
