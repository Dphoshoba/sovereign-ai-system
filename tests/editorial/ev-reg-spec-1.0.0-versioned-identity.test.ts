import { describe, expect, it } from "vitest";
import {
  evidenceCorroborationKey,
  publishersForSource,
} from "../../lib/research/claim-source-attribution";
import {
  PUBLISH_READY_CONSENSUS_SCORE,
  PUBLISH_READY_SOURCE_QUALITY_SCORE,
} from "../../lib/research/consensus-engine";
import { researchPublicationBlockReason } from "../../lib/publishing/publication-guard";
import {
  evaluateVersionedClaim,
  versionedCanonicalIdentity,
  versionedPassageSubstantiates,
} from "../../lib/research/versioned-evidence";
import {
  FIXTURE_TEXT,
  FIXTURE_URLS,
  FUTURE_CONTRACT_CASES,
} from "./ev-reg-spec-1.0.0-future-contract.specification";

const ACTIVATED = ["T-SAME-ORG", "T-NARROW", "T-JOINT", "T-JOINT-PLUS-SECOND-WORK", "T-TWO-WORKS"];

describe("versioned publisher identity and evidence states", () => {
  it.each(ACTIVATED)("matches the adopted contract for %s", (id) => {
    const fixture = FUTURE_CONTRACT_CASES.find((entry) => entry.id === id);
    expect(fixture).toBeDefined();
    const result = evaluateVersionedClaim({
      claim: fixture!.claim,
      passages: fixture!.passages.map((passage) => ({
        url: passage.url,
        passage: passage.passage,
        polarity: passage.polarity as "supports" | "does-not-address" | "contradicts",
      })),
    });

    expect(result.evidenceState).toBe(fixture!.evidenceState);
    expect(result.verificationCount).toBe(fixture!.identityCount);
    expect(result.identities).toEqual(fixture!.identities);
    expect(result.verificationMethod).toBe(fixture!.verificationMethod);
    expect(result.compatibilityStatus).toBe(fixture!.compatibilityStatus);
    expect(result.publication).toBe(fixture!.publication);
  });

  it("keeps baseline hostname keys distinct while the versioned identity collapses them", () => {
    expect(
      evidenceCorroborationKey(FIXTURE_TEXT.sameOrgClaim, { url: FIXTURE_URLS.learn }),
    ).not.toBe(
      evidenceCorroborationKey(FIXTURE_TEXT.sameOrgClaim, { url: FIXTURE_URLS.support }),
    );
    expect(versionedCanonicalIdentity({ url: FIXTURE_URLS.learn })).toBe("publisher:microsoft");
    expect(versionedCanonicalIdentity({ url: FIXTURE_URLS.support })).toBe("publisher:microsoft");
  });

  it("rejects a publisher name in a title or path on an unregistered host", () => {
    const source = {
      url: "https://evil.example/library/microsoft",
      title: "Microsoft documentation",
    };
    expect(publishersForSource(source)).toContain("microsoft");
    expect(versionedCanonicalIdentity(source)).toBe("evil.example");
  });

  it("keeps unknown subdomains distinct and ignores a .gov path segment", () => {
    const claim = "The archived brochure states that the pilot remained limited to one office.";
    const result = evaluateVersionedClaim({
      claim,
      passages: [
        { url: "https://a.example.com/report", passage: claim, polarity: "supports" },
        { url: "https://b.example.com/report", passage: claim, polarity: "supports" },
      ],
    });
    expect(result.identities).toEqual(["a.example.com", "b.example.com"]);
    expect(result.evidenceState).toBe("independently corroborated");
    const pathGov = evaluateVersionedClaim({
      claim,
      passages: [
        { url: "https://example.com/files/.gov/report", passage: claim, polarity: "supports" },
      ],
    });
    expect(pathGov.identities).toEqual(["example.com"]);
    expect(pathGov.verificationScore).toBe(53);
  });

  it("does not let a different actor substantiate an overlapping sentence", () => {
    expect(
      versionedPassageSubstantiates(FIXTURE_TEXT.actorClaim, FIXTURE_TEXT.actorPassage),
    ).toBe(false);
    const result = evaluateVersionedClaim({
      claim: FIXTURE_TEXT.actorClaim,
      passages: [{ url: FIXTURE_URLS.gmail, passage: FIXTURE_TEXT.actorPassage }],
    });
    expect(result.evidenceState).toBe("unsupported");
    expect(result.verificationCount).toBe(0);
    expect(result.verificationScore).toBe(0);
  });

  it("treats a Power Platform availability claim as exclusive Microsoft documentation", () => {
    const result = evaluateVersionedClaim({
      claim: FIXTURE_TEXT.powerPlatformClaim,
      passages: [
        {
          url: FIXTURE_URLS.learn,
          passage: FIXTURE_TEXT.powerPlatformClaim,
          polarity: "supports",
        },
      ],
    });
    expect(result.identities).toEqual(["publisher:microsoft"]);
    expect(result.verificationCount).toBe(1);
    expect(result.evidenceState).toBe("primary-source supported");
    expect(result.verificationMethod).toBe("single-source-supported");
    expect(result.publication).toBe("not publish-ready");
  });

  it("does not let one registry publisher satisfy versioned corroboration", () => {
    const sameOrg = FUTURE_CONTRACT_CASES.find((entry) => entry.id === "T-SAME-ORG")!;
    const result = evaluateVersionedClaim({
      claim: sameOrg.claim,
      passages: sameOrg.passages.map((passage) => ({
        url: passage.url,
        passage: passage.passage,
        polarity: passage.polarity as "supports",
      })),
      unresolvedDisputes: 1,
    });
    expect(result.evidenceState).toBe("disputed");
    expect(result.verificationScore).toBe(0);
    expect(result.verificationMethod).toBe("disputed");
    expect(result.verificationCount).toBe(1);
    expect(PUBLISH_READY_CONSENSUS_SCORE).toBe(80);
    expect(PUBLISH_READY_SOURCE_QUALITY_SCORE).toBe(70);
    expect(researchPublicationBlockReason({
      consensusScore: 90,
      sourceQualityScore: 90,
      publicationRecommendation: "publish-ready",
      unverifiedCount: 0,
      facts: [
        {
          claim: FIXTURE_TEXT.powerPlatformClaim,
          verificationStatus: "partially verified",
          verificationMethod: "single-source-supported",
          verificationCount: 1,
          supportingSources: [{ sourceUrl: FIXTURE_URLS.learn }],
        },
      ],
    })).toContain("Human review is required");
  });
});
