import { describe, expect, it } from "vitest";
import { GET } from "../../app/api/gamma/stage-5/release-retention-policy/route";
import { PRODUCTION_APP_URL } from "../../src/lib/site-config";
import { buildGammaStage5ReleaseRetentionPolicy } from "../../src/lib/gamma-2/stage-5-release-retention-policy";

describe("Gamma 2 Stage 5 release retention policy", () => {
  it("builds retention enforcement policy from archive and rollback evidence", () => {
    const policy = buildGammaStage5ReleaseRetentionPolicy();

    expect(policy.id).toBe("gamma_2_stage_5_release_retention_policy");
    expect(policy.status).toBe("ready-for-retention-enforcement");
    expect(policy.branch).toBe("gamma");
    expect(policy.productionUrl).toBe(PRODUCTION_APP_URL);
    expect(policy.protectedTag).toBe("gamma-2-roadmap-complete");
    expect(policy.archiveItemCount).toBe(5);
    expect(policy.apiSurfaceCount).toBe(35);
  });

  it("declares retention rules for release records", () => {
    const policy = buildGammaStage5ReleaseRetentionPolicy();

    expect(policy.retentionRules.map((rule) => rule.id)).toEqual([
      "retain-release-archive",
      "retain-protected-tag",
      "retain-digest",
      "retain-rollback-procedure",
    ]);
    expect(policy.retentionRules[2].evidence).toMatch(/^[a-f0-9]{64}$/);
    expect(policy.retentionRules.every((rule) => rule.owner === "operator")).toBe(false);
    expect(policy.retentionRule).toBe(
      "stage-5-release-records-retained-until-next-attested-promotion"
    );
  });

  it("is deterministic for repeated calls", () => {
    expect(buildGammaStage5ReleaseRetentionPolicy()).toEqual(
      buildGammaStage5ReleaseRetentionPolicy()
    );
  });

  it("serves the policy through the Stage 5 release retention policy route", async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.id).toBe("gamma_2_stage_5_release_retention_policy");
    expect(body.apiSurfaceCount).toBe(35);
    expect(body.retentionRules).toHaveLength(4);
  });
});
