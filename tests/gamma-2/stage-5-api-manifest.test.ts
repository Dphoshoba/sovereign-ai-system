import { describe, expect, it } from "vitest";
import { GET } from "../../app/api/gamma/stage-5/api-manifest/route";
import { buildGammaStage5ApiManifest } from "../../src/lib/gamma-2/stage-5-api-manifest";

describe("Gamma 2 Stage 5 API manifest", () => {
  it("builds a discovery manifest for Stage 5 API clients", () => {
    const manifest = buildGammaStage5ApiManifest();

    expect(manifest.id).toBe("gamma_2_stage_5_api_manifest");
    expect(manifest.status).toBe("ready-for-client-adapters");
    expect(manifest.endpointCount).toBe(26);
    expect(manifest.endpoints.every((endpoint) => endpoint.method === "GET")).toBe(true);
    expect(manifest.endpoints).toContainEqual({
      path: "/api/gamma/stage-5/api-manifest",
      method: "GET",
      audience: "release-client",
      sourceContract: "src/lib/gamma-2/stage-5-api-manifest.ts",
    });
    expect(manifest.endpoints).toContainEqual({
      path: "/api/gamma/stage-5/openapi",
      method: "GET",
      audience: "release-client",
      sourceContract: "src/lib/gamma-2/stage-5-openapi.ts",
    });
    expect(manifest.endpoints).toContainEqual({
      path: "/api/gamma/stage-5/sdk",
      method: "GET",
      audience: "release-client",
      sourceContract: "src/lib/gamma-2/stage-5-sdk.ts",
    });
    expect(manifest.endpoints).toContainEqual({
      path: "/api/gamma/stage-5/contract-digest",
      method: "GET",
      audience: "release-client",
      sourceContract: "src/lib/gamma-2/stage-5-contract-digest.ts",
    });
    expect(manifest.endpoints).toContainEqual({
      path: "/api/gamma/stage-5/release-attestation",
      method: "GET",
      audience: "release-client",
      sourceContract: "src/lib/gamma-2/stage-5-release-attestation.ts",
    });
    expect(manifest.endpoints).toContainEqual({
      path: "/api/gamma/stage-5/rollback-plan",
      method: "GET",
      audience: "operator",
      sourceContract: "src/lib/gamma-2/stage-5-rollback-plan.ts",
    });
    expect(manifest.endpoints).toContainEqual({
      path: "/api/gamma/stage-5/operator-handoff",
      method: "GET",
      audience: "operator",
      sourceContract: "src/lib/gamma-2/stage-5-operator-handoff.ts",
    });
    expect(manifest.endpoints).toContainEqual({
      path: "/api/gamma/stage-5/audit-ledger",
      method: "GET",
      audience: "operator",
      sourceContract: "src/lib/gamma-2/stage-5-audit-ledger.ts",
    });
    expect(manifest.endpoints).toContainEqual({
      path: "/api/gamma/stage-5/deployment-receipt",
      method: "GET",
      audience: "operator",
      sourceContract: "src/lib/gamma-2/stage-5-deployment-receipt.ts",
    });
    expect(manifest.endpoints).toContainEqual({
      path: "/api/gamma/stage-5/promotion-journal",
      method: "GET",
      audience: "operator",
      sourceContract: "src/lib/gamma-2/stage-5-promotion-journal.ts",
    });
    expect(manifest.endpoints).toContainEqual({
      path: "/api/gamma/stage-5/operator-signoff",
      method: "GET",
      audience: "operator",
      sourceContract: "src/lib/gamma-2/stage-5-operator-signoff.ts",
    });
    expect(manifest.endpoints).toContainEqual({
      path: "/api/gamma/stage-5/evidence-index",
      method: "GET",
      audience: "release-client",
      sourceContract: "src/lib/gamma-2/stage-5-evidence-index.ts",
    });
    expect(manifest.endpoints).toContainEqual({
      path: "/api/gamma/stage-5/release-bundle",
      method: "GET",
      audience: "release-client",
      sourceContract: "src/lib/gamma-2/stage-5-release-bundle.ts",
    });
    expect(manifest.endpoints).toContainEqual({
      path: "/api/gamma/stage-5/release-archive-manifest",
      method: "GET",
      audience: "release-client",
      sourceContract: "src/lib/gamma-2/stage-5-release-archive-manifest.ts",
    });
    expect(manifest.endpoints).toContainEqual({
      path: "/api/gamma/stage-5/release-retention-policy",
      method: "GET",
      audience: "release-client",
      sourceContract: "src/lib/gamma-2/stage-5-release-retention-policy.ts",
    });
    expect(manifest.endpoints).toContainEqual({
      path: "/api/gamma/stage-5/release-compliance-matrix",
      method: "GET",
      audience: "release-client",
      sourceContract: "src/lib/gamma-2/stage-5-release-compliance-matrix.ts",
    });
    expect(manifest.endpoints).toContainEqual({
      path: "/api/gamma/stage-5/release-exception-register",
      method: "GET",
      audience: "release-client",
      sourceContract: "src/lib/gamma-2/stage-5-release-exception-register.ts",
    });
    expect(manifest.endpoints).toContainEqual({
      path: "/api/gamma/stage-5/release-governance-map",
      method: "GET",
      audience: "operator",
      sourceContract: "src/lib/gamma-2/stage-5-release-governance-map.ts",
    });
  });

  it("assigns monitoring to the compact health endpoint", () => {
    const manifest = buildGammaStage5ApiManifest();

    expect(manifest.endpoints.find((endpoint) => endpoint.path.endsWith("/health"))).toMatchObject({
      audience: "monitor",
      sourceContract: "src/lib/gamma-2/stage-5-health.ts",
    });
  });

  it("is deterministic for repeated calls", () => {
    expect(buildGammaStage5ApiManifest()).toEqual(buildGammaStage5ApiManifest());
  });

  it("serves the manifest through the Stage 5 API manifest route", async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.id).toBe("gamma_2_stage_5_api_manifest");
    expect(body.endpointCount).toBe(26);
    expect(body.adapterRule).toBe("single-discovery-manifest-for-stage-5-api-clients");
  });
});
