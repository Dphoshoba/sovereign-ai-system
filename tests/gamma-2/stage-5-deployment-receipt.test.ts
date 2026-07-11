import { describe, expect, it } from "vitest";
import { GET } from "../../app/api/gamma/stage-5/deployment-receipt/route";
import { PRODUCTION_APP_URL } from "../../src/lib/site-config";
import { buildGammaStage5DeploymentReceipt } from "../../src/lib/gamma-2/stage-5-deployment-receipt";

describe("Gamma 2 Stage 5 deployment receipt", () => {
  it("builds a post-promotion receipt from attestation and audit evidence", () => {
    const receipt = buildGammaStage5DeploymentReceipt();

    expect(receipt.id).toBe("gamma_2_stage_5_deployment_receipt");
    expect(receipt.status).toBe("ready-for-post-promotion-record");
    expect(receipt.branch).toBe("gamma");
    expect(receipt.productionUrl).toBe(PRODUCTION_APP_URL);
    expect(receipt.digestFingerprint).toMatch(/^[a-f0-9]{64}$/);
    expect(receipt.apiSurfaceCount).toBe(24);
    expect(receipt.auditEntryCount).toBe(4);
    expect(receipt.verification).toEqual({ build: "passed", smoke: "47 routes passed, 0 failed" });
  });

  it("requires attestation and audit artifacts", () => {
    const receipt = buildGammaStage5DeploymentReceipt();

    expect(receipt.receiptArtifacts).toEqual([
      "/api/gamma/stage-5/release-attestation",
      "/api/gamma/stage-5/audit-ledger",
      "/api/gamma/stage-5/deployment-summary",
      "/api/gamma/stage-5/contract-digest",
    ]);
    expect(receipt.receiptRule).toBe(
      "post-promotion-record-must-reference-attestation-and-audit-ledger"
    );
  });

  it("is deterministic for repeated calls", () => {
    expect(buildGammaStage5DeploymentReceipt()).toEqual(buildGammaStage5DeploymentReceipt());
  });

  it("serves the receipt through the Stage 5 deployment receipt route", async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.id).toBe("gamma_2_stage_5_deployment_receipt");
    expect(body.apiSurfaceCount).toBe(24);
    expect(body.receiptRule).toBe(
      "post-promotion-record-must-reference-attestation-and-audit-ledger"
    );
  });
});
