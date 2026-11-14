import { describe, expect, it } from "vitest";
import { evaluateVersionedClaim } from "../../lib/research/versioned-evidence";
import {
  createDispute,
  disputeBlocksEvidence,
  disputeIdFor,
  disputeResolutionExpired,
  passageChecksum,
  resolveDispute,
  sourceSetFingerprint,
} from "../../lib/research/versioned-disputes";
import {
  disputeIdFor as specificationDisputeId,
  FIXTURE_TEXT,
  FIXTURE_URLS,
  passageChecksum as specificationChecksum,
  T_NEW_SPAN_CONTRACT,
  T_RESOLVED_CONTRACT,
} from "./ev-reg-spec-1.0.0-future-contract.specification";

const sourceUrls = [FIXTURE_URLS.learn, FIXTURE_URLS.support];

function resolvedRecord() {
  const created = createDispute({
    claim: FIXTURE_TEXT.resolvedClaim,
    clause: FIXTURE_TEXT.resolvedClause,
    contradicting: [{ url: FIXTURE_URLS.support, passage: FIXTURE_TEXT.resolvedNarrow }],
    sourceUrls,
  });
  const resolved = resolveDispute(created, "not-a-contradiction");
  if (!resolved.ok) throw new Error(resolved.error);
  return resolved.dispute;
}

function newSpanRecord() {
  return createDispute({
    claim: FIXTURE_TEXT.resolvedClaim,
    clause: FIXTURE_TEXT.resolvedClause,
    contradicting: [{ url: FIXTURE_URLS.learn, passage: FIXTURE_TEXT.newSpan }],
    sourceUrls,
  });
}

describe("versioned dispute lifecycle", () => {
  it("matches the specification checksum and dispute id", () => {
    expect(passageChecksum(FIXTURE_TEXT.resolvedNarrow)).toBe(
      specificationChecksum(FIXTURE_TEXT.resolvedNarrow),
    );
    const input = {
      claim: FIXTURE_TEXT.resolvedClaim,
      clause: FIXTURE_TEXT.resolvedClause,
      contradicting: [{ url: FIXTURE_URLS.support, passage: FIXTURE_TEXT.resolvedNarrow }],
    };
    expect(disputeIdFor(input)).toBe(specificationDisputeId(input));
    expect(disputeIdFor(input)).toBe(T_RESOLVED_CONTRACT.disputeIds[0]);
  });

  it("keeps a resolved dispute visible without leaving the claim disputed", () => {
    const dispute = resolvedRecord();
    const fingerprint = sourceSetFingerprint(sourceUrls);
    expect(disputeBlocksEvidence(dispute, fingerprint)).toBe(false);
    const result = evaluateVersionedClaim({
      claim: T_RESOLVED_CONTRACT.claim,
      passages: T_RESOLVED_CONTRACT.passages.map((passage) => ({
        url: passage.url,
        passage: passage.passage,
        polarity: passage.polarity as "supports" | "does-not-address",
      })),
      unresolvedDisputes: 0,
    });
    expect(result.evidenceState).toBe("primary-source supported");
    expect(result.verificationMethod).toBe("single-source-supported");
    expect(result.publication).toBe("not publish-ready");
    expect(dispute.disputeId).toBe(T_RESOLVED_CONTRACT.disputeIds[0]);
    expect(dispute.resolution).toBe("not-a-contradiction");
  });

  it("does not let one resolution clear a newly discovered contradictory span", () => {
    const first = resolvedRecord();
    const second = newSpanRecord();
    const fingerprint = sourceSetFingerprint(sourceUrls);
    expect(second.disputeId).toBe(T_NEW_SPAN_CONTRACT.disputeIds[1]);
    expect(second.disputeId).not.toBe(first.disputeId);
    expect(disputeBlocksEvidence(first, fingerprint)).toBe(false);
    expect(disputeBlocksEvidence(second, fingerprint)).toBe(true);
    const result = evaluateVersionedClaim({
      claim: T_NEW_SPAN_CONTRACT.claim,
      passages: T_NEW_SPAN_CONTRACT.passages.map((passage) => ({
        url: passage.url,
        passage: passage.passage,
        polarity: passage.polarity as "supports" | "does-not-address" | "contradicts",
      })),
      unresolvedDisputes: [first, second].filter((dispute) =>
        disputeBlocksEvidence(dispute, fingerprint),
      ).length,
    });
    expect(result.evidenceState).toBe("disputed");
    expect(result.verificationScore).toBe(0);
    expect(result.verificationStatus).toBe("unverified");
    expect(result.verificationMethod).toBe("disputed");
    expect(result.verificationCount).toBe(1);
    expect(result.publication).toBe("not publish-ready");
  });

  it("expires a resolution when the source-set fingerprint or passage checksum changes", () => {
    const dispute = resolvedRecord();
    const changedFingerprint = sourceSetFingerprint([...sourceUrls, FIXTURE_URLS.nist]);
    expect(disputeResolutionExpired(dispute, changedFingerprint)).toBe(true);
    expect(disputeBlocksEvidence(dispute, changedFingerprint)).toBe(true);
    const changedPassage = {
      ...dispute,
      contradicting: [{ url: FIXTURE_URLS.support, passage: FIXTURE_TEXT.newSpan }],
    };
    expect(disputeResolutionExpired(changedPassage, dispute.sourceSetFingerprint)).toBe(true);
  });

  it("refuses to let a machine candidate clear itself", () => {
    const candidate = createDispute({
      claim: FIXTURE_TEXT.resolvedClaim,
      clause: FIXTURE_TEXT.resolvedClause,
      contradicting: [{ url: FIXTURE_URLS.learn, passage: FIXTURE_TEXT.newSpan }],
      sourceUrls,
      detectionMethod: "machine-candidate",
    });
    const attempt = resolveDispute(candidate, "not-a-contradiction");
    expect(attempt.ok).toBe(false);
    expect(disputeBlocksEvidence(candidate, sourceSetFingerprint(sourceUrls))).toBe(true);
  });
});
