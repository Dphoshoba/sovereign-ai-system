import { PRODUCTION_APP_URL } from "../site-config";
import { buildGammaStage5OperatorHandoff } from "./stage-5-operator-handoff";
import { buildGammaStage5OperatorSignoff } from "./stage-5-operator-signoff";
import { buildGammaStage5ReleaseAttestation } from "./stage-5-release-attestation";
import { buildGammaStage5ReleaseDecisionRecord } from "./stage-5-release-decision-record";
import { buildGammaStage5ReleaseGovernanceMap } from "./stage-5-release-governance-map";

export interface GammaStage5ReleaseApprovalArtifact {
  id: string;
  path: string;
  evidence: string;
  required: true;
}

export interface GammaStage5ReleaseApprovalPacket {
  id: "gamma_2_stage_5_release_approval_packet";
  status: "pending-operator-signoff";
  generatedAt: Date;
  branch: "gamma";
  productionUrl: typeof PRODUCTION_APP_URL;
  apiSurfaceCount: number;
  digestFingerprint: string;
  operatorRequiredCount: number;
  approvalArtifactCount: number;
  approvalArtifacts: GammaStage5ReleaseApprovalArtifact[];
  approvalRule: "stage-5-release-approval-packet-requires-human-signoff-before-promotion";
}

export function buildGammaStage5ReleaseApprovalPacket(): GammaStage5ReleaseApprovalPacket {
  const decisionRecord = buildGammaStage5ReleaseDecisionRecord();
  const signoff = buildGammaStage5OperatorSignoff();
  const handoff = buildGammaStage5OperatorHandoff();
  const governanceMap = buildGammaStage5ReleaseGovernanceMap();
  const attestation = buildGammaStage5ReleaseAttestation();

  const approvalArtifacts: GammaStage5ReleaseApprovalArtifact[] = [
    {
      id: "release-decision",
      path: "/api/gamma/stage-5/release-decision-record",
      evidence: decisionRecord.decisionRule,
      required: true,
    },
    {
      id: "operator-signoff",
      path: "/api/gamma/stage-5/operator-signoff",
      evidence: signoff.signoffRule,
      required: true,
    },
    {
      id: "operator-handoff",
      path: "/api/gamma/stage-5/operator-handoff",
      evidence: handoff.handoffRule,
      required: true,
    },
    {
      id: "governance-review",
      path: "/api/gamma/stage-5/release-governance-map",
      evidence: governanceMap.governanceRule,
      required: true,
    },
    {
      id: "release-attestation",
      path: "/api/gamma/stage-5/release-attestation",
      evidence: attestation.attestationRule,
      required: true,
    },
  ];

  return {
    id: "gamma_2_stage_5_release_approval_packet",
    status: "pending-operator-signoff",
    generatedAt: new Date(decisionRecord.generatedAt),
    branch: decisionRecord.branch,
    productionUrl: PRODUCTION_APP_URL,
    apiSurfaceCount: decisionRecord.apiSurfaceCount,
    digestFingerprint: decisionRecord.digestFingerprint,
    operatorRequiredCount: decisionRecord.operatorRequiredCount,
    approvalArtifactCount: approvalArtifacts.length,
    approvalArtifacts,
    approvalRule: "stage-5-release-approval-packet-requires-human-signoff-before-promotion",
  };
}
