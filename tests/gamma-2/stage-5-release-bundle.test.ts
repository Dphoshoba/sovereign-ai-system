import { describe, expect, it } from "vitest";
import { GET } from "../../app/api/gamma/stage-5/release-bundle/route";
import { PRODUCTION_APP_URL } from "../../src/lib/site-config";
import { buildGammaStage5ReleaseBundle } from "../../src/lib/gamma-2/stage-5-release-bundle";

describe("Gamma 2 Stage 5 release bundle", () => {
  it("builds an archive-ready release bundle from indexed evidence", () => {
    const bundle = buildGammaStage5ReleaseBundle();

    expect(bundle.id).toBe("gamma_2_stage_5_release_bundle");
    expect(bundle.status).toBe("ready-for-release-archive");
    expect(bundle.branch).toBe("gamma");
    expect(bundle.productionUrl).toBe(PRODUCTION_APP_URL);
    expect(bundle.digestFingerprint).toMatch(/^[a-f0-9]{64}$/);
    expect(bundle.apiSurfaceCount).toBe(40);
    expect(bundle.indexedArtifactCount).toBe(40);
    expect(bundle.operatorApprovalArtifactCount).toBe(5);
  });

  it("archives the required Stage 5 release artifacts in order", () => {
    const bundle = buildGammaStage5ReleaseBundle();

    expect(bundle.artifacts).toEqual([
      { order: 1, path: "/api/gamma/stage-5/evidence-index", role: "overview" },
      { order: 2, path: "/api/gamma/stage-5/operator-signoff", role: "approval" },
      { order: 3, path: "/api/gamma/stage-5/release-attestation", role: "audit" },
      { order: 4, path: "/api/gamma/stage-5/contract-digest", role: "contract" },
      { order: 5, path: "/api/gamma/stage-5/operator-handoff", role: "approval" },
    ]);
    expect(bundle.bundleRule).toBe(
      "release-bundle-must-archive-index-signoff-attestation-and-digest"
    );
  });

  it("is deterministic for repeated calls", () => {
    expect(buildGammaStage5ReleaseBundle()).toEqual(buildGammaStage5ReleaseBundle());
  });

  it("serves the bundle through the Stage 5 release bundle route", async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.id).toBe("gamma_2_stage_5_release_bundle");
    expect(body.apiSurfaceCount).toBe(40);
    expect(body.artifacts).toHaveLength(5);
  });
});
