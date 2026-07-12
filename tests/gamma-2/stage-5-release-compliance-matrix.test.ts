import { describe, expect, it } from "vitest";
import { GET } from "../../app/api/gamma/stage-5/release-compliance-matrix/route";
import { PRODUCTION_APP_URL } from "../../src/lib/site-config";
import { buildGammaStage5ReleaseComplianceMatrix } from "../../src/lib/gamma-2/stage-5-release-compliance-matrix";

describe("Gamma 2 Stage 5 release compliance matrix", () => {
  it("builds a mapped compliance matrix from signoff, retention, and evidence contracts", () => {
    const matrix = buildGammaStage5ReleaseComplianceMatrix();

    expect(matrix.id).toBe("gamma_2_stage_5_release_compliance_matrix");
    expect(matrix.status).toBe("ready-for-compliance-review");
    expect(matrix.branch).toBe("gamma");
    expect(matrix.productionUrl).toBe(PRODUCTION_APP_URL);
    expect(matrix.apiSurfaceCount).toBe(44);
    expect(matrix.mappedControlCount).toBe(4);
    expect(matrix.operatorApprovalArtifactCount).toBe(5);
  });

  it("maps required compliance controls to evidence", () => {
    const matrix = buildGammaStage5ReleaseComplianceMatrix();

    expect(matrix.controls).toEqual([
      {
        id: "human-approval-boundary",
        category: "approval",
        evidence: "operator-signoff-required-before-production-promotion",
        status: "mapped",
      },
      {
        id: "release-record-retention",
        category: "archive",
        evidence: "stage-5-release-records-retained-until-next-attested-promotion",
        status: "mapped",
      },
      {
        id: "indexed-evidence-surface",
        category: "governance",
        evidence: "stage-5-evidence-index-derived-from-manifest-and-signoff",
        status: "mapped",
      },
      {
        id: "protected-rollback-tag",
        category: "rollback",
        evidence: "gamma-2-roadmap-complete",
        status: "mapped",
      },
    ]);
    expect(matrix.matrixRule).toBe(
      "stage-5-compliance-controls-map-to-signoff-retention-and-evidence"
    );
  });

  it("is deterministic for repeated calls", () => {
    expect(buildGammaStage5ReleaseComplianceMatrix()).toEqual(
      buildGammaStage5ReleaseComplianceMatrix()
    );
  });

  it("serves the matrix through the Stage 5 release compliance matrix route", async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.id).toBe("gamma_2_stage_5_release_compliance_matrix");
    expect(body.apiSurfaceCount).toBe(44);
    expect(body.controls).toHaveLength(4);
  });
});
