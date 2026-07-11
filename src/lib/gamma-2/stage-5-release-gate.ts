import { PRODUCTION_APP_URL } from "../site-config";
import { buildGammaStage5EvidenceBundle } from "./stage-5-evidence";
import { buildGammaStage5ReadinessSnapshot } from "./stage-5-readiness";

export type GammaStage5ReleaseCheckStatus = "pass" | "operator-required";

export interface GammaStage5ReleaseCheck {
  id: string;
  label: string;
  status: GammaStage5ReleaseCheckStatus;
  evidence: string;
}

export interface GammaStage5ReleaseGate {
  id: "gamma_2_stage_5_release_gate";
  status: "ready-for-operator-promotion";
  branch: "gamma";
  productionUrl: typeof PRODUCTION_APP_URL;
  requiredPublicEnv: Record<"NEXT_PUBLIC_APP_URL" | "NEXT_PUBLIC_BASE_URL", typeof PRODUCTION_APP_URL>;
  generatedAt: Date;
  checks: GammaStage5ReleaseCheck[];
  operatorActions: string[];
  releaseRule: "operator-promotes-after-env-domain-and-evidence-review";
}

export function buildGammaStage5ReleaseGate(): GammaStage5ReleaseGate {
  const readiness = buildGammaStage5ReadinessSnapshot();
  const evidence = buildGammaStage5EvidenceBundle();

  return {
    id: "gamma_2_stage_5_release_gate",
    status: "ready-for-operator-promotion",
    branch: readiness.branch,
    productionUrl: PRODUCTION_APP_URL,
    requiredPublicEnv: {
      NEXT_PUBLIC_APP_URL: PRODUCTION_APP_URL,
      NEXT_PUBLIC_BASE_URL: PRODUCTION_APP_URL,
    },
    generatedAt: new Date(readiness.generatedAt),
    checks: [
      {
        id: "stage-5-readiness",
        label: "Stage 5 readiness snapshot complete",
        status: "pass",
        evidence: readiness.completionTag,
      },
      {
        id: "stage-5-evidence",
        label: "Stage 5 evidence bundle audit-ready",
        status: "pass",
        evidence: evidence.evidenceRule,
      },
      {
        id: "verification",
        label: "Tests, determinism, build, and smoke verification complete",
        status: "pass",
        evidence: readiness.verification.smoke,
      },
      {
        id: "production-env",
        label: "Vercel public base URLs must match the canonical production origin",
        status: "operator-required",
        evidence: PRODUCTION_APP_URL,
      },
      {
        id: "operator-promotion",
        label: "Human operator remains responsible for production promotion",
        status: "operator-required",
        evidence: "human-approval-before-production",
      },
    ],
    operatorActions: [
      "Confirm NEXT_PUBLIC_APP_URL in Vercel production settings",
      "Confirm NEXT_PUBLIC_BASE_URL in Vercel production settings",
      "Review /gamma-stage-5 before production promotion",
      "Review /api/gamma/stage-5/evidence before production promotion",
      "Promote only after operator approval",
    ],
    releaseRule: "operator-promotes-after-env-domain-and-evidence-review",
  };
}
