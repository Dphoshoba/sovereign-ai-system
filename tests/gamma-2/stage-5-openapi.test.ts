import { describe, expect, it } from "vitest";
import { GET } from "../../app/api/gamma/stage-5/openapi/route";
import { PRODUCTION_APP_URL } from "../../src/lib/site-config";
import { buildGammaStage5OpenApiDocument } from "../../src/lib/gamma-2/stage-5-openapi";

describe("Gamma 2 Stage 5 OpenAPI document", () => {
  it("builds an OpenAPI document from the Stage 5 API manifest", () => {
    const openapi = buildGammaStage5OpenApiDocument();

    expect(openapi.openapi).toBe("3.1.0");
    expect(openapi.info.title).toBe("Gamma 2 Stage 5 API");
    expect(openapi.servers).toEqual([{ url: PRODUCTION_APP_URL }]);
    expect(Object.keys(openapi.paths)).toHaveLength(21);
    expect(openapi.paths["/api/gamma/stage-5/openapi"].get.operationId).toBe(
      "getStage5Openapi"
    );
    expect(openapi.paths["/api/gamma/stage-5/sdk"].get.operationId).toBe("getStage5Sdk");
    expect(openapi.paths["/api/gamma/stage-5/contract-digest"].get.operationId).toBe(
      "getStage5ContractDigest"
    );
    expect(openapi.paths["/api/gamma/stage-5/release-attestation"].get.operationId).toBe(
      "getStage5ReleaseAttestation"
    );
    expect(openapi.paths["/api/gamma/stage-5/rollback-plan"].get.operationId).toBe(
      "getStage5RollbackPlan"
    );
    expect(openapi.paths["/api/gamma/stage-5/operator-handoff"].get.operationId).toBe(
      "getStage5OperatorHandoff"
    );
    expect(openapi.paths["/api/gamma/stage-5/audit-ledger"].get.operationId).toBe(
      "getStage5AuditLedger"
    );
    expect(openapi.paths["/api/gamma/stage-5/deployment-receipt"].get.operationId).toBe(
      "getStage5DeploymentReceipt"
    );
    expect(openapi.paths["/api/gamma/stage-5/promotion-journal"].get.operationId).toBe(
      "getStage5PromotionJournal"
    );
    expect(openapi.paths["/api/gamma/stage-5/operator-signoff"].get.operationId).toBe(
      "getStage5OperatorSignoff"
    );
    expect(openapi.paths["/api/gamma/stage-5/evidence-index"].get.operationId).toBe(
      "getStage5EvidenceIndex"
    );
    expect(openapi.paths["/api/gamma/stage-5/release-bundle"].get.operationId).toBe(
      "getStage5ReleaseBundle"
    );
  });

  it("keeps operation metadata tied to source contracts", () => {
    const openapi = buildGammaStage5OpenApiDocument();

    expect(
      openapi.paths["/api/gamma/stage-5/api-manifest"].get.responses["200"].description
    ).toBe("src/lib/gamma-2/stage-5-api-manifest.ts response");
    expect(openapi.paths["/api/gamma/stage-5/health"].get.tags).toContain("monitor");
  });

  it("is deterministic for repeated calls", () => {
    expect(buildGammaStage5OpenApiDocument()).toEqual(buildGammaStage5OpenApiDocument());
  });

  it("serves the document through the Stage 5 OpenAPI route", async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.openapi).toBe("3.1.0");
    expect(body["x-gamma-rule"]).toBe("openapi-derived-from-stage-5-api-manifest");
  });
});
