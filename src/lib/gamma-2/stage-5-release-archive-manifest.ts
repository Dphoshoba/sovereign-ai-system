import { PRODUCTION_APP_URL } from "../site-config";
import { buildGammaStage5EvidenceIndex } from "./stage-5-evidence-index";
import { buildGammaStage5ReleaseBundle } from "./stage-5-release-bundle";

export interface GammaStage5ReleaseArchiveManifestItem {
  order: number;
  path: string;
  archived: true;
}

export interface GammaStage5ReleaseArchiveManifest {
  id: "gamma_2_stage_5_release_archive_manifest";
  status: "ready-for-archive-retention";
  generatedAt: Date;
  branch: "gamma";
  productionUrl: typeof PRODUCTION_APP_URL;
  digestFingerprint: string;
  apiSurfaceCount: number;
  bundleArtifactCount: number;
  indexedArtifactCount: number;
  retention: {
    protectedBranch: "gamma";
    protectedTag: "gamma-2-roadmap-complete";
    archiveOwner: "operator";
  };
  archiveItems: GammaStage5ReleaseArchiveManifestItem[];
  archiveRule: "archive-manifest-must-preserve-release-bundle-and-evidence-index";
}

export function buildGammaStage5ReleaseArchiveManifest(): GammaStage5ReleaseArchiveManifest {
  const evidenceIndex = buildGammaStage5EvidenceIndex();
  const releaseBundle = buildGammaStage5ReleaseBundle();

  return {
    id: "gamma_2_stage_5_release_archive_manifest",
    status: "ready-for-archive-retention",
    generatedAt: new Date(releaseBundle.generatedAt),
    branch: releaseBundle.branch,
    productionUrl: PRODUCTION_APP_URL,
    digestFingerprint: releaseBundle.digestFingerprint,
    apiSurfaceCount: evidenceIndex.apiSurfaceCount,
    bundleArtifactCount: releaseBundle.artifacts.length,
    indexedArtifactCount: evidenceIndex.entries.length,
    retention: {
      protectedBranch: "gamma",
      protectedTag: "gamma-2-roadmap-complete",
      archiveOwner: "operator",
    },
    archiveItems: [
      {
        order: 1,
        path: "/api/gamma/stage-5/release-bundle",
        archived: true,
      },
      {
        order: 2,
        path: "/api/gamma/stage-5/evidence-index",
        archived: true,
      },
      {
        order: 3,
        path: "/api/gamma/stage-5/operator-signoff",
        archived: true,
      },
      {
        order: 4,
        path: "/api/gamma/stage-5/release-attestation",
        archived: true,
      },
      {
        order: 5,
        path: "/api/gamma/stage-5/contract-digest",
        archived: true,
      },
    ],
    archiveRule: "archive-manifest-must-preserve-release-bundle-and-evidence-index",
  };
}
