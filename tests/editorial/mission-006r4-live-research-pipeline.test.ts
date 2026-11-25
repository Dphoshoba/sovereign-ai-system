/**
 * Mission 006R4 live research pipeline (network) — composition model optional.
 *
 * Behaviour under test: real source collection + teaching-aware evidence
 * selection must surface Exodus 5/8/10 movement text and pass evidence
 * completeness before any model call.
 *
 * Modules: sourceCollector, evidenceRegistry, biblical-teaching-completeness,
 * factExtractor.
 * Existing related: mission-006r4-composition-reliability.test.ts (unit only;
 * no live fetch coverage).
 *
 * Director: "Identify the actual root cause using reproducible evidence" /
 * "controlled end-to-end article-generation acceptance" / "If a real model
 * run is unavailable, report that limitation explicitly."
 */
import { describe, expect, it } from "vitest";
import {
  MISSION_006_TEACHING_BRIEF,
  assessEvidenceTeachingCoverage,
  buildScriptureTeachingPlan,
  isTeachingCompositionFact,
  teachingEvidenceRelevancePatterns,
} from "../../lib/research/biblical-teaching-completeness";
import { evidenceRegistry } from "../../lib/research/evidence-registry";
import { factExtractor } from "../../lib/research/fact-extractor";
import { factVerificationEngine } from "../../lib/research/fact-verification-engine";
import { sourceCollector } from "../../lib/research/source-collector";

describe("Mission 006R4 live research pipeline", () => {
  it(
    "fetches real scripture and retains all five Exodus movement texts",
    async () => {
      const plan = buildScriptureTeachingPlan(
        MISSION_006_TEACHING_BRIEF,
        "bible-stories",
      );
      expect(plan).not.toBeNull();

      const sources = await sourceCollector(
        MISSION_006_TEACHING_BRIEF,
        [],
        "bible-stories",
      );
      expect(sources.sourceCount).toBeGreaterThan(8);

      const evidence = await evidenceRegistry(
        MISSION_006_TEACHING_BRIEF,
        sources.collectedSources,
        {
          teachingRelevancePatterns: teachingEvidenceRelevancePatterns(plan!),
          teachingRequiredRefs: plan!.requiredRefs,
        },
      );
      expect(evidence.evidenceCount).toBeGreaterThan(0);

      const coverage = assessEvidenceTeachingCoverage(evidence.evidence, plan!);
      expect(coverage.missingMovements).toEqual([]);
      expect(coverage.ok).toBe(true);

      const blob = evidence.evidence
        .map((row) => row.extractedText)
        .join("\n");
      expect(blob).toMatch(/straw|brick|more work/i);
      expect(blob).toMatch(/in the land/i);
      expect(blob).toMatch(/not (?:go )?very far/i);
      expect(blob).toMatch(
        /little ones|who are they that shall go|sons and (with )?our daughters/i,
      );
      expect(blob).toMatch(
        /flocks? and (your )?herds?|herds be stayed|leave their flocks/i,
      );

      const extracted = factExtractor(
        MISSION_006_TEACHING_BRIEF,
        evidence.evidence,
        "bible-stories",
      );
      const verified = factVerificationEngine(extracted.facts);
      const publishable = verified.verifiedFacts.filter((fact) =>
        isTeachingCompositionFact(fact),
      );
      expect(publishable.length).toBeGreaterThan(5);
      const claimBlob = publishable.map((fact) => fact.claim).join("\n");
      expect(claimBlob).toMatch(
        /exodus 8|in the land|not (?:go )?very far|compromise that Israel serve/i,
      );
      expect(claimBlob).toMatch(
        /exodus 10|children|little ones|sons and|daughters|flock|herd|stayed|possessions behind/i,
      );
      expect(
        publishable.every(
          (fact) => !/david and goliath|\bgoliath\b/i.test(fact.claim),
        ),
      ).toBe(true);
    },
    120_000,
  );
});
