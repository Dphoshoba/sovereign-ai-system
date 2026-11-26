import { PRODUCTION_APP_URL } from "../site-config";
import { PHASE_XXIV_REQUIRED_SDKS } from "./developer-platform";
import { buildGammaStage5ApiManifest } from "./stage-5-api-manifest";

export interface GammaStage5SdkEndpoint {
  path: string;
  method: "GET";
  operationId: string;
  audience: "operator" | "monitor" | "release-client";
}

export interface GammaStage5SdkDescriptor {
  id: "gamma_2_stage_5_sdk";
  status: "ready-for-sdk-generation";
  generatedAt: Date;
  packageName: "@gamma/stage-5-client";
  version: "1.0.0";
  baseUrl: typeof PRODUCTION_APP_URL;
  requiredEnv: Array<"NEXT_PUBLIC_APP_URL" | "NEXT_PUBLIC_BASE_URL">;
  requiredPlatformSdks: typeof PHASE_XXIV_REQUIRED_SDKS;
  endpointCount: number;
  endpoints: GammaStage5SdkEndpoint[];
  sdkGovernance: {
    semver: true;
    docsRequired: true;
    sandboxRequired: true;
    governanceReviewRequired: true;
  };
  sdkRule: "generated-client-must-use-stage-5-manifest-and-openapi";
}

function toOperationId(path: string) {
  return path
    .replace(/^\/api\/gamma\/stage-5\//, "get-stage-5-")
    .split("-")
    .map((part, index) => (index === 0 ? part : `${part[0]?.toUpperCase()}${part.slice(1)}`))
    .join("");
}

export function buildGammaStage5SdkDescriptor(): GammaStage5SdkDescriptor {
  const manifest = buildGammaStage5ApiManifest();
  const endpoints = manifest.endpoints.map((endpoint) => ({
    path: endpoint.path,
    method: endpoint.method,
    operationId: toOperationId(endpoint.path),
    audience: endpoint.audience,
  }));

  return {
    id: "gamma_2_stage_5_sdk",
    status: "ready-for-sdk-generation",
    generatedAt: new Date(manifest.generatedAt),
    packageName: "@gamma/stage-5-client",
    version: "1.0.0",
    baseUrl: PRODUCTION_APP_URL,
    requiredEnv: ["NEXT_PUBLIC_APP_URL", "NEXT_PUBLIC_BASE_URL"],
    requiredPlatformSdks: [...PHASE_XXIV_REQUIRED_SDKS],
    endpointCount: endpoints.length,
    endpoints,
    sdkGovernance: {
      semver: true,
      docsRequired: true,
      sandboxRequired: true,
      governanceReviewRequired: true,
    },
    sdkRule: "generated-client-must-use-stage-5-manifest-and-openapi",
  };
}
