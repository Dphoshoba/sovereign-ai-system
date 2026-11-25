import { buildGammaStage5DeploymentSummary } from "./stage-5-deployment-summary";
import { getGammaStage5ManifestSurfaces } from "./stage-5-surface-registry";

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

export function buildGammaStage5ApiManifest(): GammaStage5ApiManifest {
  const deploymentSummary = buildGammaStage5DeploymentSummary();
  const endpoints = getGammaStage5ManifestSurfaces().map((surface) => ({
    path: surface.path,
    method: surface.method,
    audience: surface.audience,
    sourceContract: surface.sourceContract,
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
