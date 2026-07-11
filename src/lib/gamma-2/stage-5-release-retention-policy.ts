import { PRODUCTION_APP_URL } from "../site-config";
import { buildGammaStage5ReleaseArchiveManifest } from "./stage-5-release-archive-manifest";
import { buildGammaStage5RollbackPlan } from "./stage-5-rollback-plan";

export interface GammaStage5ReleaseRetentionPolicyRule {
  id: string;
  requirement: string;
  evidence: string;
  owner: "operator" | "release-client";
}

export interface GammaStage5ReleaseRetentionPolicy {
  id: "gamma_2_stage_5_release_retention_policy";
  status: "ready-for-retention-enforcement";
  generatedAt: Date;
  branch: "gamma";
  productionUrl: typeof PRODUCTION_APP_URL;
  protectedTag: "gamma-2-roadmap-complete";
  archiveItemCount: number;
  apiSurfaceCount: number;
  retentionRules: GammaStage5ReleaseRetentionPolicyRule[];
  retentionRule: "stage-5-release-records-retained-until-next-attested-promotion";
}

export function buildGammaStage5ReleaseRetentionPolicy(): GammaStage5ReleaseRetentionPolicy {
  const archiveManifest = buildGammaStage5ReleaseArchiveManifest();
  const rollbackPlan = buildGammaStage5RollbackPlan();

  return {
    id: "gamma_2_stage_5_release_retention_policy",
    status: "ready-for-retention-enforcement",
    generatedAt: new Date(archiveManifest.generatedAt),
    branch: archiveManifest.branch,
    productionUrl: PRODUCTION_APP_URL,
    protectedTag: archiveManifest.retention.protectedTag,
    archiveItemCount: archiveManifest.archiveItems.length,
    apiSurfaceCount: archiveManifest.apiSurfaceCount,
    retentionRules: [
      {
        id: "retain-release-archive",
        requirement: "Preserve the release archive manifest and bundle together",
        evidence: archiveManifest.archiveRule,
        owner: "operator",
      },
      {
        id: "retain-protected-tag",
        requirement: "Keep the protected Stage 5 tag available for rollback",
        evidence: rollbackPlan.protectedTag,
        owner: "operator",
      },
      {
        id: "retain-digest",
        requirement: "Preserve the digest fingerprint used for promotion comparison",
        evidence: rollbackPlan.digestFingerprint,
        owner: "release-client",
      },
      {
        id: "retain-rollback-procedure",
        requirement: "Keep rollback steps available until the next attested promotion",
        evidence: rollbackPlan.rollbackRule,
        owner: "operator",
      },
    ],
    retentionRule: "stage-5-release-records-retained-until-next-attested-promotion",
  };
}
