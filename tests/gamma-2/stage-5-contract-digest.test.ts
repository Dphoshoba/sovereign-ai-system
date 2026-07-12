import { describe, expect, it } from "vitest";
import { GAMMA_STAGE_5_SMOKE_SUMMARY, GAMMA_STAGE_5_SURFACE_COUNTS } from "../../src/lib/gamma-2/stage-5-surface-registry";
import { GET } from "../../app/api/gamma/stage-5/contract-digest/route";
import { buildGammaStage5ContractDigest } from "../../src/lib/gamma-2/stage-5-contract-digest";

describe("Gamma 2 Stage 5 contract digest", () => {
  it("builds a stable SHA-256 fingerprint for the Stage 5 contract surface", () => {
    const digest = buildGammaStage5ContractDigest();

    expect(digest.id).toBe("gamma_2_stage_5_contract_digest");
    expect(digest.status).toBe("stable-contract-fingerprint");
    expect(digest.algorithm).toBe("sha256");
    expect(digest.endpointCount).toBe(GAMMA_STAGE_5_SURFACE_COUNTS.totalEndpoints);
    expect(digest.fingerprint).toMatch(/^[a-f0-9]{64}$/);
    expect(digest.sources).toEqual([
      "src/lib/gamma-2/stage-5-api-manifest.ts",
      "src/lib/gamma-2/stage-5-openapi.ts",
      "src/lib/gamma-2/stage-5-sdk.ts",
    ]);
  });

  it("is deterministic for repeated calls", () => {
    expect(buildGammaStage5ContractDigest()).toEqual(buildGammaStage5ContractDigest());
  });

  it("serves the digest through the Stage 5 contract digest route", async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.id).toBe("gamma_2_stage_5_contract_digest");
    expect(body.endpointCount).toBe(GAMMA_STAGE_5_SURFACE_COUNTS.totalEndpoints);
    expect(body.digestRule).toBe("fingerprint-manifest-openapi-and-sdk-descriptor");
  });
});
