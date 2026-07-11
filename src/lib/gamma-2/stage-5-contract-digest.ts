import { createHash } from "node:crypto";
import { buildGammaStage5ApiManifest } from "./stage-5-api-manifest";
import { buildGammaStage5OpenApiDocument } from "./stage-5-openapi";
import { buildGammaStage5SdkDescriptor } from "./stage-5-sdk";

export interface GammaStage5ContractDigest {
  id: "gamma_2_stage_5_contract_digest";
  status: "stable-contract-fingerprint";
  generatedAt: Date;
  algorithm: "sha256";
  endpointCount: number;
  fingerprint: string;
  sources: string[];
  digestRule: "fingerprint-manifest-openapi-and-sdk-descriptor";
}

function fingerprintPayload() {
  const manifest = buildGammaStage5ApiManifest();
  const openapi = buildGammaStage5OpenApiDocument();
  const sdk = buildGammaStage5SdkDescriptor();

  return {
    manifest: {
      endpointCount: manifest.endpointCount,
      endpoints: manifest.endpoints,
      rule: manifest.adapterRule,
    },
    openapi: {
      version: openapi.openapi,
      pathCount: Object.keys(openapi.paths).length,
      paths: Object.keys(openapi.paths).sort(),
      rule: openapi["x-gamma-rule"],
    },
    sdk: {
      packageName: sdk.packageName,
      version: sdk.version,
      endpointCount: sdk.endpointCount,
      rule: sdk.sdkRule,
    },
  };
}

export function buildGammaStage5ContractDigest(): GammaStage5ContractDigest {
  const manifest = buildGammaStage5ApiManifest();
  const payload = fingerprintPayload();
  const fingerprint = createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex");

  return {
    id: "gamma_2_stage_5_contract_digest",
    status: "stable-contract-fingerprint",
    generatedAt: new Date(manifest.generatedAt),
    algorithm: "sha256",
    endpointCount: manifest.endpointCount,
    fingerprint,
    sources: [
      "src/lib/gamma-2/stage-5-api-manifest.ts",
      "src/lib/gamma-2/stage-5-openapi.ts",
      "src/lib/gamma-2/stage-5-sdk.ts",
    ],
    digestRule: "fingerprint-manifest-openapi-and-sdk-descriptor",
  };
}
