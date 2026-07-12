import { describe, expect, it } from "vitest";
import { GET } from "../../app/api/gamma/stage-5/release-archive-manifest/route";
import { PRODUCTION_APP_URL } from "../../src/lib/site-config";
import { buildGammaStage5ReleaseArchiveManifest } from "../../src/lib/gamma-2/stage-5-release-archive-manifest";

describe("Gamma 2 Stage 5 release archive manifest", () => {
  it("builds an archive retention manifest for the release bundle", () => {
    const manifest = buildGammaStage5ReleaseArchiveManifest();

    expect(manifest.id).toBe("gamma_2_stage_5_release_archive_manifest");
    expect(manifest.status).toBe("ready-for-archive-retention");
    expect(manifest.branch).toBe("gamma");
    expect(manifest.productionUrl).toBe(PRODUCTION_APP_URL);
    expect(manifest.digestFingerprint).toMatch(/^[a-f0-9]{64}$/);
    expect(manifest.apiSurfaceCount).toBe(43);
    expect(manifest.bundleArtifactCount).toBe(5);
    expect(manifest.indexedArtifactCount).toBe(43);
  });

  it("declares retention boundaries and archived items", () => {
    const manifest = buildGammaStage5ReleaseArchiveManifest();

    expect(manifest.retention).toEqual({
      protectedBranch: "gamma",
      protectedTag: "gamma-2-roadmap-complete",
      archiveOwner: "operator",
    });
    expect(manifest.archiveItems).toEqual([
      { order: 1, path: "/api/gamma/stage-5/release-bundle", archived: true },
      { order: 2, path: "/api/gamma/stage-5/evidence-index", archived: true },
      { order: 3, path: "/api/gamma/stage-5/operator-signoff", archived: true },
      { order: 4, path: "/api/gamma/stage-5/release-attestation", archived: true },
      { order: 5, path: "/api/gamma/stage-5/contract-digest", archived: true },
    ]);
    expect(manifest.archiveRule).toBe(
      "archive-manifest-must-preserve-release-bundle-and-evidence-index"
    );
  });

  it("is deterministic for repeated calls", () => {
    expect(buildGammaStage5ReleaseArchiveManifest()).toEqual(
      buildGammaStage5ReleaseArchiveManifest()
    );
  });

  it("serves the manifest through the Stage 5 release archive manifest route", async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.id).toBe("gamma_2_stage_5_release_archive_manifest");
    expect(body.apiSurfaceCount).toBe(43);
    expect(body.archiveItems).toHaveLength(5);
  });
});
