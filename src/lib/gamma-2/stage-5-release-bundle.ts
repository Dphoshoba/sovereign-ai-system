import { PRODUCTION_APP_URL } from "../site-config";
import { buildGammaStage5EvidenceIndex } from "./stage-5-evidence-index";
import { buildGammaStage5OperatorSignoffSource } from "./stage-5-operator-signoff";
import { buildGammaStage5ReleaseAttestation } from "./stage-5-release-attestation";

export interface GammaStage5ReleaseBundleArtifact {
  order: number;
  path: string;
  role: "approval" | "audit" | "contract" | "overview";
}

export interface GammaStage5ReleaseBundle {
  id: "gamma_2_stage_5_release_bundle";
  status: "ready-for-release-archive";
  generatedAt: Date;
  branch: "gamma";
  productionUrl: typeof PRODUCTION_APP_URL;
  digestFingerprint: string;
  apiSurfaceCount: number;
  indexedArtifactCount: number;
  operatorApprovalArtifactCount: number;
  artifacts: GammaStage5ReleaseBundleArtifact[];
  bundleRule: "release-bundle-must-archive-index-signoff-attestation-and-digest";
}

export function buildGammaStage5ReleaseBundle(): GammaStage5ReleaseBundle {
  const evidenceIndex = buildGammaStage5EvidenceIndex();
  const signoff = buildGammaStage5OperatorSignoffSource();
  const attestation = buildGammaStage5ReleaseAttestation();

  return {
    id: "gamma_2_stage_5_release_bundle",
    status: "ready-for-release-archive",
    generatedAt: new Date(evidenceIndex.generatedAt),
    branch: evidenceIndex.branch,
    productionUrl: PRODUCTION_APP_URL,
    digestFingerprint: attestation.digest.fingerprint,
    apiSurfaceCount: evidenceIndex.apiSurfaceCount,
    indexedArtifactCount: evidenceIndex.entries.length,
    operatorApprovalArtifactCount: evidenceIndex.operatorApprovalArtifactCount,
    artifacts: [
      {
        order: 1,
        path: "/api/gamma/stage-5/evidence-index",
        role: "overview",
      },
      {
        order: 2,
        path: "/api/gamma/stage-5/operator-signoff",
        role: "approval",
      },
      {
        order: 3,
        path: "/api/gamma/stage-5/release-attestation",
        role: "audit",
      },
      {
        order: 4,
        path: "/api/gamma/stage-5/contract-digest",
        role: "contract",
      },
      {
        order: 5,
        path: signoff.signoffArtifacts[0],
        role: "approval",
      },
    ],
    bundleRule: "release-bundle-must-archive-index-signoff-attestation-and-digest",
  };
}
