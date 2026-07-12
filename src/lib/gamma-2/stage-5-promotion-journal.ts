import { PRODUCTION_APP_URL } from "../site-config";
import { buildGammaStage5AuditLedger } from "./stage-5-audit-ledger";
import { buildGammaStage5DeploymentReceipt } from "./stage-5-deployment-receipt";
import { buildGammaStage5DeploymentSummary } from "./stage-5-deployment-summary";
import { buildGammaStage5ReleaseAttestation } from "./stage-5-release-attestation";
import { buildGammaStage5RollbackPlanSource } from "./stage-5-rollback-plan";

export interface GammaStage5PromotionJournalEntry {
  order: number;
  checkpoint: string;
  evidence: string;
  source: string;
}

export interface GammaStage5PromotionJournal {
  id: "gamma_2_stage_5_promotion_journal";
  status: "ready-for-operator-signoff";
  generatedAt: Date;
  branch: "gamma";
  productionUrl: typeof PRODUCTION_APP_URL;
  digestFingerprint: string;
  apiSurfaceCount: number;
  receiptStatus: "ready-for-post-promotion-record";
  auditEntryCount: number;
  rollbackTag: "gamma-2-roadmap-complete";
  entries: GammaStage5PromotionJournalEntry[];
  journalArtifacts: string[];
  journalRule: "promotion-journal-must-bind-receipt-attestation-audit-and-rollback";
}

export function buildGammaStage5PromotionJournal(): GammaStage5PromotionJournal {
  const deploymentSummary = buildGammaStage5DeploymentSummary();
  const receipt = buildGammaStage5DeploymentReceipt();
  const attestation = buildGammaStage5ReleaseAttestation();
  const auditLedger = buildGammaStage5AuditLedger();
  const rollbackPlan = buildGammaStage5RollbackPlanSource();

  return {
    id: "gamma_2_stage_5_promotion_journal",
    status: "ready-for-operator-signoff",
    generatedAt: new Date(deploymentSummary.generatedAt),
    branch: attestation.branch,
    productionUrl: PRODUCTION_APP_URL,
    digestFingerprint: attestation.digest.fingerprint,
    apiSurfaceCount: deploymentSummary.apiSurface.length,
    receiptStatus: receipt.status,
    auditEntryCount: auditLedger.entries.length,
    rollbackTag: rollbackPlan.protectedTag,
    entries: [
      {
        order: 1,
        checkpoint: "Deployment receipt prepared",
        evidence: receipt.receiptRule,
        source: "/api/gamma/stage-5/deployment-receipt",
      },
      {
        order: 2,
        checkpoint: "Release digest attested",
        evidence: attestation.digest.fingerprint,
        source: "/api/gamma/stage-5/release-attestation",
      },
      {
        order: 3,
        checkpoint: "Audit sequence captured",
        evidence: auditLedger.auditRule,
        source: "/api/gamma/stage-5/audit-ledger",
      },
      {
        order: 4,
        checkpoint: "Rollback authority bound",
        evidence: rollbackPlan.rollbackRule,
        source: "/api/gamma/stage-5/rollback-plan",
      },
      {
        order: 5,
        checkpoint: "Promotion surface verified",
        evidence: deploymentSummary.verification.smoke,
        source: "/api/gamma/stage-5/deployment-summary",
      },
    ],
    journalArtifacts: [
      "/api/gamma/stage-5/deployment-receipt",
      "/api/gamma/stage-5/release-attestation",
      "/api/gamma/stage-5/audit-ledger",
      "/api/gamma/stage-5/rollback-plan",
      "/api/gamma/stage-5/deployment-summary",
    ],
    journalRule: "promotion-journal-must-bind-receipt-attestation-audit-and-rollback",
  };
}
