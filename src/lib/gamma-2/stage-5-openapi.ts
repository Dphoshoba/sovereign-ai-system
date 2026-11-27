import { PRODUCTION_APP_URL } from "../site-config";
import { buildGammaStage5ApiManifest } from "./stage-5-api-manifest";

export interface GammaStage5OpenApiDocument {
  openapi: "3.1.0";
  info: {
    title: "Gamma 2 Stage 5 API";
    version: "1.0.0";
    description: string;
  };
  servers: Array<{
    url: typeof PRODUCTION_APP_URL;
  }>;
  paths: Record<
    string,
    {
      get: {
        operationId: string;
        summary: string;
        tags: string[];
        responses: {
          "200": {
            description: string;
          };
        };
      };
    }
  >;
  "x-gamma-stage": "stage-5";
  "x-gamma-rule": "openapi-derived-from-stage-5-api-manifest";
}

function toOperationId(path: string) {
  return path
    .replace(/^\/api\/gamma\/stage-5\//, "get-stage-5-")
    .split("-")
    .map((part, index) => (index === 0 ? part : `${part[0]?.toUpperCase()}${part.slice(1)}`))
    .join("");
}

function toSummary(path: string) {
  return path
    .replace(/^\/api\/gamma\/stage-5\//, "Stage 5 ")
    .split("-")
    .map((part) => `${part[0]?.toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

export function buildGammaStage5OpenApiDocument(): GammaStage5OpenApiDocument {
  const manifest = buildGammaStage5ApiManifest();
  const paths = Object.fromEntries(
    manifest.endpoints.map((endpoint) => [
      endpoint.path,
      {
        get: {
          operationId: toOperationId(endpoint.path),
          summary: toSummary(endpoint.path),
          tags: ["Gamma Stage 5", endpoint.audience],
          responses: {
            "200": {
              description: `${endpoint.sourceContract} response`,
            },
          },
        },
      },
    ])
  );

  return {
    openapi: "3.1.0",
    info: {
      title: "Gamma 2 Stage 5 API",
      version: "1.0.0",
      description: "Deterministic Stage 5 release, readiness, evidence, and adapter API surface.",
    },
    servers: [{ url: PRODUCTION_APP_URL }],
    paths,
    "x-gamma-stage": "stage-5",
    "x-gamma-rule": "openapi-derived-from-stage-5-api-manifest",
  };
}
