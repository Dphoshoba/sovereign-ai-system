import { buildGammaStage5ReleaseCutoverChecklist } from "./stage-5-release-cutover-checklist";
import { buildGammaStage5ReleaseMonitoringPlan } from "./stage-5-release-monitoring-plan";
import { buildGammaStage5ReleaseProductionAuthorizationLedger } from "./stage-5-release-production-authorization-ledger";
import { buildGammaStage5ReleaseTrafficShiftPlan } from "./stage-5-release-traffic-shift-plan";
import { buildGammaStage5RollbackPlan } from "./stage-5-rollback-plan";

export interface GammaStage5ReleaseEvidenceContext {
  generatedAt: Date;
  authorizationLedger: ReturnType<typeof buildGammaStage5ReleaseProductionAuthorizationLedger>;
  cutoverChecklist: ReturnType<typeof buildGammaStage5ReleaseCutoverChecklist>;
  trafficShiftPlan: ReturnType<typeof buildGammaStage5ReleaseTrafficShiftPlan>;
  rollbackPlan: ReturnType<typeof buildGammaStage5RollbackPlan>;
  monitoringPlan: ReturnType<typeof buildGammaStage5ReleaseMonitoringPlan>;
  sourceBuilderCount: 5;
  contextRule: "stage-5-release-evidence-context-composes-late-release-artifacts-once-per-call";
}

export function buildGammaStage5ReleaseEvidenceContext(): GammaStage5ReleaseEvidenceContext {
  const authorizationLedger = buildGammaStage5ReleaseProductionAuthorizationLedger();
  const cutoverChecklist = buildGammaStage5ReleaseCutoverChecklist();
  const trafficShiftPlan = buildGammaStage5ReleaseTrafficShiftPlan();
  const rollbackPlan = buildGammaStage5RollbackPlan();
  const monitoringPlan = buildGammaStage5ReleaseMonitoringPlan();

  return {
    generatedAt: new Date(authorizationLedger.generatedAt),
    authorizationLedger,
    cutoverChecklist,
    trafficShiftPlan,
    rollbackPlan,
    monitoringPlan,
    sourceBuilderCount: 5,
    contextRule: "stage-5-release-evidence-context-composes-late-release-artifacts-once-per-call",
  };
}
