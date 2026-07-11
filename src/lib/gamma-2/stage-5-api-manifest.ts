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
