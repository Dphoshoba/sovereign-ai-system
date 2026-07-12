import { describe, expect, it } from "vitest";
import { GAMMA_STAGE_5_SMOKE_SUMMARY, GAMMA_STAGE_5_SURFACE_COUNTS } from "../../src/lib/gamma-2/stage-5-surface-registry";
import { GET } from "../../app/api/gamma/stage-5/evidence-index/route";
import { buildGammaStage5EvidenceIndex } from "../../src/lib/gamma-2/stage-5-evidence-index";

describe("Gamma 2 Stage 5 evidence index", () => {
  it("builds an indexed catalog of Stage 5 evidence artifacts", () => {
    const index = buildGammaStage5EvidenceIndex();

    expect(index.id).toBe("gamma_2_stage_5_evidence_index");
    expect(index.status).toBe("indexed-for-release-review");
    expect(index.branch).toBe("gamma");
    expect(index.apiSurfaceCount).toBe(GAMMA_STAGE_5_SURFACE_COUNTS.totalEndpoints);
    expect(index.smoke).toBe(GAMMA_STAGE_5_SMOKE_SUMMARY);
    expect(index.entries).toHaveLength(GAMMA_STAGE_5_SURFACE_COUNTS.totalEndpoints);
    expect(index.operatorApprovalArtifactCount).toBe(5);
  });

  it("marks operator approval artifacts from the signoff packet", () => {
    const index = buildGammaStage5EvidenceIndex();

    expect(
      index.entries
        .filter((entry) => entry.operatorApprovalArtifact)
        .map((entry) => entry.path)
    ).toEqual([
      "/api/gamma/stage-5/release-gate",
      "/api/gamma/stage-5/promotion-checklist",
      "/api/gamma/stage-5/deployment-summary",
      "/api/gamma/stage-5/operator-handoff",
      "/api/gamma/stage-5/promotion-journal",
    ]);
    expect(index.entries.find((entry) => entry.path.endsWith("/health"))).toMatchObject({
      audience: "monitor",
      operatorApprovalArtifact: false,
    });
    expect(index.indexRule).toBe("stage-5-evidence-index-derived-from-manifest-and-signoff");
  });

  it("is deterministic for repeated calls", () => {
    expect(buildGammaStage5EvidenceIndex()).toEqual(buildGammaStage5EvidenceIndex());
  });

  it("serves the index through the Stage 5 evidence index route", async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.id).toBe("gamma_2_stage_5_evidence_index");
    expect(body.apiSurfaceCount).toBe(GAMMA_STAGE_5_SURFACE_COUNTS.totalEndpoints);
    expect(body.entries).toHaveLength(GAMMA_STAGE_5_SURFACE_COUNTS.totalEndpoints);
  });
});
