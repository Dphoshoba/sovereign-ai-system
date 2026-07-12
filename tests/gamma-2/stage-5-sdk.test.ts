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
    expect(sdk.endpointCount).toBe(34);
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
    expect(sdk.endpoints).toContainEqual({
      path: "/api/gamma/stage-5/operator-handoff",
      method: "GET",
      operationId: "getStage5OperatorHandoff",
      audience: "operator",
    });
    expect(sdk.endpoints).toContainEqual({
      path: "/api/gamma/stage-5/audit-ledger",
      method: "GET",
      operationId: "getStage5AuditLedger",
      audience: "operator",
    });
    expect(sdk.endpoints).toContainEqual({
      path: "/api/gamma/stage-5/deployment-receipt",
      method: "GET",
      operationId: "getStage5DeploymentReceipt",
      audience: "operator",
    });
    expect(sdk.endpoints).toContainEqual({
      path: "/api/gamma/stage-5/promotion-journal",
      method: "GET",
      operationId: "getStage5PromotionJournal",
      audience: "operator",
    });
    expect(sdk.endpoints).toContainEqual({
      path: "/api/gamma/stage-5/operator-signoff",
      method: "GET",
      operationId: "getStage5OperatorSignoff",
      audience: "operator",
    });
    expect(sdk.endpoints).toContainEqual({
      path: "/api/gamma/stage-5/evidence-index",
      method: "GET",
      operationId: "getStage5EvidenceIndex",
      audience: "release-client",
    });
    expect(sdk.endpoints).toContainEqual({
      path: "/api/gamma/stage-5/release-bundle",
      method: "GET",
      operationId: "getStage5ReleaseBundle",
      audience: "release-client",
    });
    expect(sdk.endpoints).toContainEqual({
      path: "/api/gamma/stage-5/release-archive-manifest",
      method: "GET",
      operationId: "getStage5ReleaseArchiveManifest",
      audience: "release-client",
    });
    expect(sdk.endpoints).toContainEqual({
      path: "/api/gamma/stage-5/release-retention-policy",
      method: "GET",
      operationId: "getStage5ReleaseRetentionPolicy",
      audience: "release-client",
    });
    expect(sdk.endpoints).toContainEqual({
      path: "/api/gamma/stage-5/release-compliance-matrix",
      method: "GET",
      operationId: "getStage5ReleaseComplianceMatrix",
      audience: "release-client",
    });
    expect(sdk.endpoints).toContainEqual({
      path: "/api/gamma/stage-5/release-exception-register",
      method: "GET",
      operationId: "getStage5ReleaseExceptionRegister",
      audience: "release-client",
    });
    expect(sdk.endpoints).toContainEqual({
      path: "/api/gamma/stage-5/release-governance-map",
      method: "GET",
      operationId: "getStage5ReleaseGovernanceMap",
      audience: "operator",
    });
    expect(sdk.endpoints).toContainEqual({
      path: "/api/gamma/stage-5/release-decision-record",
      method: "GET",
      operationId: "getStage5ReleaseDecisionRecord",
      audience: "operator",
    });
    expect(sdk.endpoints).toContainEqual({
      path: "/api/gamma/stage-5/release-approval-packet",
      method: "GET",
      operationId: "getStage5ReleaseApprovalPacket",
      audience: "operator",
    });
    expect(sdk.endpoints).toContainEqual({
      path: "/api/gamma/stage-5/release-promotion-plan",
      method: "GET",
      operationId: "getStage5ReleasePromotionPlan",
      audience: "operator",
    });
    expect(sdk.endpoints).toContainEqual({
      path: "/api/gamma/stage-5/release-cutover-checklist",
      method: "GET",
      operationId: "getStage5ReleaseCutoverChecklist",
      audience: "operator",
    });
    expect(sdk.endpoints).toContainEqual({
      path: "/api/gamma/stage-5/release-traffic-shift-plan",
      method: "GET",
      operationId: "getStage5ReleaseTrafficShiftPlan",
      audience: "operator",
    });
    expect(sdk.endpoints).toContainEqual({
      path: "/api/gamma/stage-5/release-monitoring-plan",
      method: "GET",
      operationId: "getStage5ReleaseMonitoringPlan",
      audience: "monitor",
    });
    expect(sdk.endpoints).toContainEqual({
      path: "/api/gamma/stage-5/release-post-promotion-review",
      method: "GET",
      operationId: "getStage5ReleasePostPromotionReview",
      audience: "operator",
    });
    expect(sdk.endpoints).toContainEqual({
      path: "/api/gamma/stage-5/release-operations-index",
      method: "GET",
      operationId: "getStage5ReleaseOperationsIndex",
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
    expect(body.endpointCount).toBe(34);
    expect(body.sdkRule).toBe("generated-client-must-use-stage-5-manifest-and-openapi");
  });
});
