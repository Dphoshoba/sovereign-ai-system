import { createHash } from "node:crypto";
import { canonicalizeSourceUrl } from "./article-audit-fingerprint";

export type DisputeResolution = "unresolved" | "not-a-contradiction" | "source-withdrawn";

export type DisputeDetectionMethod = "human-recorded" | "machine-candidate";

export type ContradictingPassage = {
  url: string;
  passage: string;
};

export type VersionedDispute = {
  disputeId: string;
  claim: string;
  clause: string;
  contradicting: ContradictingPassage[];
  sourceSetFingerprint: string;
  detectionMethod: DisputeDetectionMethod;
  resolution: DisputeResolution;
  resolvedDisputeId: string | null;
  resolutionSourceSetFingerprint: string | null;
  resolutionPassageChecksums: string[] | null;
};

function canonicalDisputeText(value: string): string {
  return value.normalize("NFC").trim().replace(/\s+/g, " ");
}

export function passageChecksum(passage: string): string {
  return createHash("sha256").update(canonicalDisputeText(passage), "utf8").digest("hex");
}

export function disputeIdFor(input: {
  claim: string;
  clause: string;
  contradicting: ContradictingPassage[];
}): string {
  const passages = input.contradicting
    .map((entry) => `${entry.url} ${passageChecksum(entry.passage)}`)
    .sort()
    .join("|");
  const text = [
    `claim:${canonicalDisputeText(input.claim)}`,
    `clause:${canonicalDisputeText(input.clause)}`,
    `passages:${passages}`,
  ].join("\n");
  return createHash("sha256").update(text, "utf8").digest("hex");
}

export function sourceSetFingerprint(urls: string[]): string {
  const canonical = [...new Set(urls.map((url) => {
    try {
      return canonicalizeSourceUrl(url);
    } catch {
      return url.trim();
    }
  }))].sort();
  return createHash("sha256").update(canonical.join("\n"), "utf8").digest("hex");
}

export function createDispute(input: {
  claim: string;
  clause: string;
  contradicting: ContradictingPassage[];
  sourceUrls: string[];
  detectionMethod?: DisputeDetectionMethod;
}): VersionedDispute {
  return {
    disputeId: disputeIdFor(input),
    claim: input.claim,
    clause: input.clause,
    contradicting: input.contradicting,
    sourceSetFingerprint: sourceSetFingerprint(input.sourceUrls),
    detectionMethod: input.detectionMethod ?? "human-recorded",
    resolution: "unresolved",
    resolvedDisputeId: null,
    resolutionSourceSetFingerprint: null,
    resolutionPassageChecksums: null,
  };
}

export function resolveDispute(
  dispute: VersionedDispute,
  resolution: Exclude<DisputeResolution, "unresolved">,
): { ok: true; dispute: VersionedDispute } | { ok: false; error: string } {
  if (dispute.detectionMethod === "machine-candidate") {
    return {
      ok: false,
      error: "A machine candidate cannot be cleared by the detector.",
    };
  }
  return {
    ok: true,
    dispute: {
      ...dispute,
      resolution,
      resolvedDisputeId: dispute.disputeId,
      resolutionSourceSetFingerprint: dispute.sourceSetFingerprint,
      resolutionPassageChecksums: dispute.contradicting.map((entry) => passageChecksum(entry.passage)).sort(),
    },
  };
}

export function disputeResolutionExpired(
  dispute: VersionedDispute,
  currentSourceSetFingerprint: string,
): boolean {
  if (dispute.resolution === "unresolved") return false;
  if (dispute.resolvedDisputeId !== dispute.disputeId) return true;
  if (dispute.resolutionSourceSetFingerprint !== currentSourceSetFingerprint) return true;
  const currentChecksums = dispute.contradicting
    .map((entry) => passageChecksum(entry.passage))
    .sort();
  const covered = dispute.resolutionPassageChecksums ?? [];
  return currentChecksums.join("|") !== [...covered].sort().join("|");
}

export function disputeBlocksEvidence(
  dispute: VersionedDispute,
  currentSourceSetFingerprint: string,
): boolean {
  return dispute.resolution === "unresolved" || disputeResolutionExpired(dispute, currentSourceSetFingerprint);
}
