import { buildGammaStage5DeploymentSummary } from "./stage-5-deployment-summary";

export interface GammaStage5ApiManifestEndpoint {
  path: string;
  method: "GET";
  audience: "operator" | "monitor" | "release-client";
  sourceContract: string;
}

export interface GammaStage5ApiManifest {
  id: "gamma_2_stage_5_api_manifest";
  status: "ready-for-client-adapters";
  generatedAt: Date;
  endpointCount: number;
  endpoints: GammaStage5ApiManifestEndpoint[];
  adapterRule: "single-discovery-manifest-for-stage-5-api-clients";
}

const API_ENDPOINT_METADATA: Record<
  string,
  Omit<GammaStage5ApiManifestEndpoint, "path" | "method">
> = {
  "/api/gamma/stage-5/readiness": {
    audience: "operator",
    sourceContract: "src/lib/gamma-2/stage-5-readiness.ts",
  },
  "/api/gamma/stage-5/evidence": {
    audience: "operator",
    sourceContract: "src/lib/gamma-2/stage-5-evidence.ts",
  },
  "/api/gamma/stage-5/release-gate": {
    audience: "release-client",
    sourceContract: "src/lib/gamma-2/stage-5-release-gate.ts",
  },
  "/api/gamma/stage-5/promotion-checklist": {
    audience: "operator",
    sourceContract: "src/lib/gamma-2/stage-5-promotion-checklist.ts",
  },
  "/api/gamma/stage-5/deployment-summary": {
    audience: "release-client",
    sourceContract: "src/lib/gamma-2/stage-5-deployment-summary.ts",
  },
  "/api/gamma/stage-5/operator-brief": {
    audience: "operator",
    sourceContract: "src/lib/gamma-2/stage-5-operator-brief.ts",
  },
  "/api/gamma/stage-5/health": {
    audience: "monitor",
    sourceContract: "src/lib/gamma-2/stage-5-health.ts",
  },
  "/api/gamma/stage-5/release-dashboard": {
    audience: "release-client",
    sourceContract: "src/lib/gamma-2/stage-5-release-dashboard.ts",
  },
  "/api/gamma/stage-5/api-manifest": {
    audience: "release-client",
    sourceContract: "src/lib/gamma-2/stage-5-api-manifest.ts",
  },
  "/api/gamma/stage-5/openapi": {
    audience: "release-client",
    sourceContract: "src/lib/gamma-2/stage-5-openapi.ts",
  },
  "/api/gamma/stage-5/sdk": {
    audience: "release-client",
    sourceContract: "src/lib/gamma-2/stage-5-sdk.ts",
  },
  "/api/gamma/stage-5/contract-digest": {
    audience: "release-client",
    sourceContract: "src/lib/gamma-2/stage-5-contract-digest.ts",
  },
  "/api/gamma/stage-5/release-attestation": {
    audience: "release-client",
    sourceContract: "src/lib/gamma-2/stage-5-release-attestation.ts",
  },
  "/api/gamma/stage-5/rollback-plan": {
    audience: "operator",
    sourceContract: "src/lib/gamma-2/stage-5-rollback-plan.ts",
  },
  "/api/gamma/stage-5/operator-handoff": {
    audience: "operator",
    sourceContract: "src/lib/gamma-2/stage-5-operator-handoff.ts",
  },
  "/api/gamma/stage-5/audit-ledger": {
    audience: "operator",
    sourceContract: "src/lib/gamma-2/stage-5-audit-ledger.ts",
  },
  "/api/gamma/stage-5/deployment-receipt": {
    audience: "operator",
    sourceContract: "src/lib/gamma-2/stage-5-deployment-receipt.ts",
  },
  "/api/gamma/stage-5/promotion-journal": {
    audience: "operator",
    sourceContract: "src/lib/gamma-2/stage-5-promotion-journal.ts",
  },
  "/api/gamma/stage-5/operator-signoff": {
    audience: "operator",
    sourceContract: "src/lib/gamma-2/stage-5-operator-signoff.ts",
  },
  "/api/gamma/stage-5/evidence-index": {
    audience: "release-client",
    sourceContract: "src/lib/gamma-2/stage-5-evidence-index.ts",
  },
  "/api/gamma/stage-5/release-bundle": {
    audience: "release-client",
    sourceContract: "src/lib/gamma-2/stage-5-release-bundle.ts",
  },
  "/api/gamma/stage-5/release-archive-manifest": {
    audience: "release-client",
    sourceContract: "src/lib/gamma-2/stage-5-release-archive-manifest.ts",
  },
  "/api/gamma/stage-5/release-retention-policy": {
    audience: "release-client",
    sourceContract: "src/lib/gamma-2/stage-5-release-retention-policy.ts",
  },
  "/api/gamma/stage-5/release-compliance-matrix": {
    audience: "release-client",
    sourceContract: "src/lib/gamma-2/stage-5-release-compliance-matrix.ts",
  },
  "/api/gamma/stage-5/release-exception-register": {
    audience: "release-client",
    sourceContract: "src/lib/gamma-2/stage-5-release-exception-register.ts",
  },
  "/api/gamma/stage-5/release-governance-map": {
    audience: "operator",
    sourceContract: "src/lib/gamma-2/stage-5-release-governance-map.ts",
  },
  "/api/gamma/stage-5/release-decision-record": {
    audience: "operator",
    sourceContract: "src/lib/gamma-2/stage-5-release-decision-record.ts",
  },
  "/api/gamma/stage-5/release-approval-packet": {
    audience: "operator",
    sourceContract: "src/lib/gamma-2/stage-5-release-approval-packet.ts",
  },
  "/api/gamma/stage-5/release-promotion-plan": {
    audience: "operator",
    sourceContract: "src/lib/gamma-2/stage-5-release-promotion-plan.ts",
  },
};

export function buildGammaStage5ApiManifest(): GammaStage5ApiManifest {
  const deploymentSummary = buildGammaStage5DeploymentSummary();
  const endpoints = deploymentSummary.apiSurface.map((path) => ({
    path,
    method: "GET" as const,
    ...API_ENDPOINT_METADATA[path],
  }));

  return {
    id: "gamma_2_stage_5_api_manifest",
    status: "ready-for-client-adapters",
    generatedAt: new Date(deploymentSummary.generatedAt),
    endpointCount: endpoints.length,
    endpoints,
    adapterRule: "single-discovery-manifest-for-stage-5-api-clients",
  };
}
