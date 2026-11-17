import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  EV_REG_PROVENANCE_NOTE_ACTIONS,
  EV_REG_SOCIAL_OPERATIONAL_EVENT_TYPES,
  EV_REG_SPEC_CONTRACT_ID,
  EV_REG_SPEC_CONTRACT_VERSION,
  EV_REG_SPEC_FULL_ID,
  EV_REG_SPEC_REQUIREMENTS,
  EV_REG_SPEC_TRACEABILITY,
  getEvRegSpecInventory,
  implementedEvRegRequirementIds,
} from "../../lib/publishing/ev-reg-spec-1-1-0";
import { RESEARCH_AUDIT_FINGERPRINT_ACTION } from "../../lib/research/article-audit-association";
import { FEATURED_IMAGE_PROMPT_APPROVED_ACTION } from "../../lib/ai/featured-image-prompt";
import { CORRECTED_AND_UNPUBLISHED_ACTION } from "../../lib/publishing/correct-and-withdraw";
import {
  PUBLISH_READY_CONSENSUS_SCORE,
  PUBLISH_READY_RECOMMENDATION,
  PUBLISH_READY_SOURCE_QUALITY_SCORE,
} from "../../lib/research/consensus-engine";
import { EV_BIBLE_AUTHORITY_CONTRACT_ID } from "../../lib/research/claim-source-attribution";
import { CURRENT_RESEARCH_AUDIT_ENGINE_REVISION } from "../../lib/research/research-audit-engine-revision";

function read(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("EV-REG-SPEC-1.1.0 specification artifact", () => {
  it("is version-controlled and matches machine identifiers", () => {
    const doc = read("docs/editorial/EV-REG-SPEC-1.1.0.md");
    expect(doc).toContain(EV_REG_SPEC_FULL_ID);
    expect(doc).toContain(`Version:** \`${EV_REG_SPEC_CONTRACT_VERSION}\``);
    expect(doc).toContain(EV_REG_SPEC_CONTRACT_ID);
    expect(doc).toMatch(/not\*\* a new registry engine/i);
    for (const requirement of EV_REG_SPEC_REQUIREMENTS) {
      expect(doc).toContain(requirement);
    }
    expect(doc).toContain("Proposed Director decisions");
    expect(doc).toContain(EV_BIBLE_AUTHORITY_CONTRACT_ID);
  });

  it("preserves Biblical Authority as a separate contract boundary", () => {
    const bibleDoc = read("docs/editorial/EV-BIBLE-AUTHORITY-001.md");
    expect(bibleDoc).toContain("Proposed Director decisions");
    expect(bibleDoc).toContain(EV_REG_SPEC_FULL_ID);
    expect(bibleDoc).toMatch(/Deferred biblical decisions/i);
    const inventory = getEvRegSpecInventory();
    expect(inventory.relatedBibleAuthorityContract).toBe(
      EV_BIBLE_AUTHORITY_CONTRACT_ID,
    );
    expect(inventory.createsRegistryEngine).toBe(false);
  });
});

describe("EV-REG-SPEC-1.1.0 verified provenance bindings", () => {
  it("binds provenance note actions to existing code constants", () => {
    expect(EV_REG_PROVENANCE_NOTE_ACTIONS).toEqual([
      RESEARCH_AUDIT_FINGERPRINT_ACTION,
      "prepared-for-review",
      "approved",
      "rejected",
      "archived",
      CORRECTED_AND_UNPUBLISHED_ACTION,
      FEATURED_IMAGE_PROMPT_APPROVED_ACTION,
    ]);
    expect(RESEARCH_AUDIT_FINGERPRINT_ACTION).toBe("research-audit-fingerprint");
    expect(FEATURED_IMAGE_PROMPT_APPROVED_ACTION).toBe(
      "featured-image-prompt-approved",
    );
    expect(CORRECTED_AND_UNPUBLISHED_ACTION).toBe("corrected-and-unpublished");
  });

  it("keeps publish-ready thresholds and engine revision unchanged", () => {
    const inventory = getEvRegSpecInventory();
    expect(inventory.publishReady).toEqual({
      consensusScore: PUBLISH_READY_CONSENSUS_SCORE,
      sourceQualityScore: PUBLISH_READY_SOURCE_QUALITY_SCORE,
      recommendation: PUBLISH_READY_RECOMMENDATION,
    });
    expect(inventory.publishReady.consensusScore).toBe(80);
    expect(inventory.publishReady.sourceQualityScore).toBe(70);
    expect(inventory.publishReady.recommendation).toBe("publish-ready");
    expect(inventory.currentResearchAuditEngineRevision).toBe(
      CURRENT_RESEARCH_AUDIT_ENGINE_REVISION,
    );
  });

  it("lists social operational event types without inventing new ones", () => {
    expect(EV_REG_SOCIAL_OPERATIONAL_EVENT_TYPES).toEqual([
      "social_publish_claimed",
      "social_publish",
      "social_publish_failed",
      "social_publish_uncertain",
    ]);
    const twitter = read("lib/social/publish-twitter-post.ts");
    for (const type of EV_REG_SOCIAL_OPERATIONAL_EVENT_TYPES) {
      expect(twitter).toContain(type);
    }
  });

  it("marks all REG-R* rows implemented_tested and includes full requirement set", () => {
    expect(EV_REG_SPEC_TRACEABILITY.map((row) => row.id)).toEqual([
      ...EV_REG_SPEC_REQUIREMENTS,
    ]);
    expect(
      EV_REG_SPEC_TRACEABILITY.every((row) => row.status === "implemented_tested"),
    ).toBe(true);
    expect(implementedEvRegRequirementIds()).toEqual([...EV_REG_SPEC_REQUIREMENTS]);
  });

  it("does not introduce a registry engine or privileged mutation surface", () => {
    const moduleSource = read("lib/publishing/ev-reg-spec-1-1-0.ts");
    expect(moduleSource).toContain("createsRegistryEngine: false");
    expect(moduleSource).not.toMatch(/prisma\.(article|socialPost)\.(create|update|delete)/);
    expect(moduleSource).not.toMatch(/transitionArticleLifecycle|publishApprovedTwitterPost/);
    expect(read("prisma/schema.prisma")).not.toMatch(/model\s+EvReg|model\s+RegistryEntry/);
  });
});
