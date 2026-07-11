import { describe, expect, it } from "vitest";
import { GET } from "../../app/api/gamma/stage-5/sdk/route";
import { PRODUCTION_APP_URL } from "../../src/lib/site-config";
import { PHASE_XXIV_REQUIRED_SDKS } from "../../src/lib/gamma-2/developer-platform";
import { buildGammaStage5SdkDescriptor } from "../../src/lib/gamma-2/stage-5-sdk";

describe("Gamma 2 Stage 5 SDK descriptor", () => {
  it("builds a governed SDK descriptor from the Stage 5 API manifest", () => {
    const sdk = buildGammaStage5SdkDescriptor();

    expect(sdk.id).toBe("gamma_2_stage_5_sdk");
    expect(sdk.status).toBe("ready-for-sdk-generation");
    expect(sdk.packageName).toBe("@gamma/stage-5-client");
    expect(sdk.version).toBe("1.0.0");
    expect(sdk.baseUrl).toBe(PRODUCTION_APP_URL);
    expect(sdk.requiredEnv).toEqual(["NEXT_PUBLIC_APP_URL", "NEXT_PUBLIC_BASE_URL"]);
    expect(sdk.requiredPlatformSdks).toEqual(PHASE_XXIV_REQUIRED_SDKS);
    expect(sdk.endpointCount).toBe(14);
  });

  it("keeps generated clients behind the manifest and OpenAPI boundary", () => {
    const sdk = buildGammaStage5SdkDescriptor();

    expect(sdk.endpoints).toContainEqual({
      path: "/api/gamma/stage-5/sdk",
      method: "GET",
      operationId: "getStage5Sdk",
      audience: "release-client",
    });
    expect(sdk.endpoints).toContainEqual({
      path: "/api/gamma/stage-5/contract-digest",
      method: "GET",
      operationId: "getStage5ContractDigest",
      audience: "release-client",
    });
    expect(sdk.endpoints).toContainEqual({
      path: "/api/gamma/stage-5/release-attestation",
      method: "GET",
      operationId: "getStage5ReleaseAttestation",
      audience: "release-client",
    });
    expect(sdk.endpoints).toContainEqual({
      path: "/api/gamma/stage-5/rollback-plan",
      method: "GET",
      operationId: "getStage5RollbackPlan",
      audience: "operator",
    });
    expect(sdk.sdkGovernance).toEqual({
      semver: true,
      docsRequired: true,
      sandboxRequired: true,
      governanceReviewRequired: true,
    });
    expect(sdk.sdkRule).toBe("generated-client-must-use-stage-5-manifest-and-openapi");
  });

  it("is deterministic for repeated calls", () => {
    expect(buildGammaStage5SdkDescriptor()).toEqual(buildGammaStage5SdkDescriptor());
  });

  it("serves the descriptor through the Stage 5 SDK route", async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.id).toBe("gamma_2_stage_5_sdk");
    expect(body.endpointCount).toBe(14);
    expect(body.sdkRule).toBe("generated-client-must-use-stage-5-manifest-and-openapi");
  });
});
