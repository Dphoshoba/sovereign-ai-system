/**
 * Multi-passage biblical teaching completeness for Mission 006R3/R4.
 *
 * Callers:
 * - app/api/ai/generate-article/route.ts (pre-composition evidence gate + prompt plan
 *   + post-draft article coverage check + completeness revision)
 * - lib/research/claim-evidence-selector.ts (teaching-aware passage selection)
 * - tests/editorial/mission-006r3-*.test.ts, mission-006r4-*.test.ts
 *
 * Schemas: reads topic/category strings and EvidenceRecord sourceUrl/title/text;
 * returns TeachingCoverageResult / ScriptureTeachingPlan. No database writes.
 *
 * Director: "All mandatory Scripture passages are represented in research
 * evidence" / "Missing mandatory evidence produces a clear diagnostic rather
 * than a misleadingly complete article." / Mission 006R4 composition reliability.
 */
import type { EvidenceRecord } from "./evidence-registry";
import {
  MAX_SCRIPTURE_CHAPTERS,
  normalizeBookAlias,
  parseScriptureRefs,
  scriptureDocumentKey,
  type ScriptureRef,
} from "./scripture-ref";

/** Aligned with scriptureSourcesFromTopic chapter collection cap. */
export const MAX_SCRIPTURE_TEACHING_CHAPTERS = MAX_SCRIPTURE_CHAPTERS;

export type TeachingMovement = {
  id: string;
  label: string;
  chapterKey: string;
  /** Patterns that must co-occur in one article section. */
  articlePatterns: RegExp[];
  /** Any one pattern marks evidence text as relevant to this movement. */
  evidencePatterns: RegExp[];
};

export type ScriptureTeachingPlan = {
  requiredRefs: ScriptureRef[];
  requiredChapterKeys: string[];
  movements: TeachingMovement[];
  supportingChapterKeys: string[];
  /** Chapters cited in the brief beyond the collectable teaching cap. */
  truncatedChapterKeys: string[];
  oversizedBrief: boolean;
  oversizedReason: string;
};

export type TeachingCoverageResult = {
  ok: boolean;
  missingChapterKeys: string[];
  coveredChapterKeys: string[];
  missingMovements: string[];
  reason: string;
};

/** Fixed Mission 006 regression fixture (Director brief). */
export const MISSION_006_TEACHING_BRIEF =
  "Exodus 5:1-9, Exodus 8:25-27, Exodus 8:28, Exodus 10:8-11, Exodus 10:24-26, " +
  "John 10:10, 2 Corinthians 2:11, Mark 8:34, Joshua 24:15, Romans 12:1-2, " +
  "Colossians 3:1-4, Ephesians 6:11, 1 Peter 5:8, James 4:7. " +
  "The Devil's Tactics to Hold Us in Bondage. " +
  "Five movements: Pharaoh increases Israel's suffering; worship within Egypt; " +
  "departure but not very far; leave children behind; leave livestock behind. " +
  "Distinguish biblical narrative from theological interpretation. Use ESV. " +
  "Do not claim Exodus explicitly labels these as five satanic tactics.";

const EXODUS_MOVEMENTS: TeachingMovement[] = [
  {
    id: "exodus-5-suffering",
    label: "Pharaoh increases Israel's suffering (Exodus 5:1-9)",
    chapterKey: "exodus-5",
    articlePatterns: [
      /exodus\s*5/i,
      /more work|straw|brick|heavier|taskmaster|suffer|bondage|let my people go/i,
    ],
    evidencePatterns: [
      /exodus\s*5/i,
      /more work|straw|brick|heavier|taskmaster|let my people go|who is the lord/i,
    ],
  },
  {
    id: "exodus-8-in-land",
    label: "Worship within Egypt (Exodus 8:25-27)",
    chapterKey: "exodus-8",
    articlePatterns: [
      /exodus\s*8:2[5-7]|exodus\s*8(?!\s*:?\s*28)/i,
      /in the land|within egypt|sacrifice.*land|serve.*in the land/i,
    ],
    evidencePatterns: [
      /exodus\s*8:2[5-7]/i,
      /sacrifice to your god in the land|go ye, sacrifice|in the land/i,
    ],
  },
  {
    id: "exodus-8-not-far",
    label: "Departure but not very far (Exodus 8:28)",
    chapterKey: "exodus-8",
    articlePatterns: [/exodus\s*8:28|not (?:go )?very far/i],
    evidencePatterns: [/exodus\s*8:28|not (?:go )?very far/i],
  },
  {
    id: "exodus-10-children",
    label: "Leaving children behind (Exodus 10:8-11)",
    chapterKey: "exodus-10",
    articlePatterns: [
      /exodus\s*10:8|exodus\s*10:9|exodus\s*10:10|exodus\s*10:11|little ones|children/i,
    ],
    evidencePatterns: [
      /exodus\s*10:(?:8|9|10|11)\b/i,
      /little ones|who are they that shall go|go now ye that are men|sons and (with )?our daughters|young and with our old/i,
    ],
  },
  {
    id: "exodus-10-livestock",
    label: "Leaving livestock behind (Exodus 10:24-26)",
    chapterKey: "exodus-10",
    articlePatterns: [
      /exodus\s*10:2[4-6]|flocks? and (your )?herds?|livestock|cattle/i,
    ],
    evidencePatterns: [
      /exodus\s*10:2[4-6]/i,
      /flocks? and (your )?herds?|herds be stayed|livestock|cattle|leave their flocks/i,
    ],
  },
];

export function chapterKeyFromSourceMeta(
  url: string,
  title = "",
): string | null {
  let decoded = url;
  try {
    decoded = decodeURIComponent(url);
  } catch {
    decoded = url;
  }
  const hub = decoded.match(/biblehub\.com\/([a-z0-9_]+)\/(\d+)\.htm/i);
  if (hub) {
    const book = normalizeBookAlias(hub[1].replace(/_/g, " "));
    if (book) return `${book.slug}-${Number(hub[2])}`;
  }
  const gateway = decoded.match(/[?&]search=([^&]+)/i);
  if (gateway) {
    const refs = parseScriptureRefs(gateway[1].replace(/\+/g, " "));
    if (refs[0]) return scriptureDocumentKey(refs[0]);
  }
  const refs = parseScriptureRefs(
    `${title} ${decoded.replace(/[_+%/]/g, " ")}`,
  );
  if (refs[0]) return scriptureDocumentKey(refs[0]);
  return null;
}

export function evidenceChapterKeys(
  evidence: readonly EvidenceRecord[],
): Set<string> {
  const keys = new Set<string>();
  for (const record of evidence) {
    const key = chapterKeyFromSourceMeta(record.sourceUrl, record.sourceTitle);
    if (key) keys.add(key);
  }
  return keys;
}

function uniqueChapterKeys(refs: ScriptureRef[]): string[] {
  const keys: string[] = [];
  const seen = new Set<string>();
  for (const ref of refs) {
    const key = scriptureDocumentKey(ref);
    if (seen.has(key)) continue;
    seen.add(key);
    keys.push(key);
  }
  return keys;
}

export function buildScriptureTeachingPlan(
  topic: string,
  category = "",
): ScriptureTeachingPlan | null {
  if (!category.toLowerCase().includes("bible")) return null;
  const requiredRefs = parseScriptureRefs(topic);
  if (requiredRefs.length === 0) return null;

  const allChapterKeys = uniqueChapterKeys(requiredRefs);
  const requiredChapterKeys = allChapterKeys.slice(
    0,
    MAX_SCRIPTURE_TEACHING_CHAPTERS,
  );
  const truncatedChapterKeys = allChapterKeys.slice(
    MAX_SCRIPTURE_TEACHING_CHAPTERS,
  );
  const oversizedBrief = truncatedChapterKeys.length > 0;
  const hasExodusDeliverance =
    requiredChapterKeys.includes("exodus-5") &&
    requiredChapterKeys.includes("exodus-8") &&
    requiredChapterKeys.includes("exodus-10");

  const movements = hasExodusDeliverance ? EXODUS_MOVEMENTS : [];
  const supportingChapterKeys = requiredChapterKeys.filter(
    (key) => !key.startsWith("exodus-"),
  );

  return {
    requiredRefs: requiredRefs.filter((ref) =>
      requiredChapterKeys.includes(scriptureDocumentKey(ref)),
    ),
    requiredChapterKeys,
    movements,
    supportingChapterKeys,
    truncatedChapterKeys,
    oversizedBrief,
    oversizedReason: oversizedBrief
      ? `Teaching brief cites ${allChapterKeys.length} unique chapters; platform collects at most ${MAX_SCRIPTURE_TEACHING_CHAPTERS}. Truncated: ${truncatedChapterKeys.join(", ")}.`
      : "",
  };
}

function evidenceTextBlob(evidence: readonly EvidenceRecord[]): string {
  return evidence.map((record) => record.extractedText ?? "").join("\n");
}

export function movementHasEvidenceText(
  evidence: readonly EvidenceRecord[],
  movement: TeachingMovement,
): boolean {
  const blob = evidenceTextBlob(evidence);
  if (!blob.trim()) return false;
  return movement.evidencePatterns.some((pattern) => pattern.test(blob));
}

export function assessEvidenceTeachingCoverage(
  evidence: readonly EvidenceRecord[],
  plan: ScriptureTeachingPlan,
): TeachingCoverageResult {
  const covered = evidenceChapterKeys(evidence);
  const missingChapterKeys = plan.requiredChapterKeys.filter(
    (key) => !covered.has(key),
  );
  const missingMovements =
    plan.movements.length > 0
      ? plan.movements
          .filter((movement) => !movementHasEvidenceText(evidence, movement))
          .map((movement) => movement.id)
      : [];
  const ok = missingChapterKeys.length === 0 && missingMovements.length === 0;
  const missingLabels = [
    ...missingChapterKeys,
    ...missingMovements,
  ];
  return {
    ok,
    missingChapterKeys: [
      ...new Set([
        ...missingChapterKeys,
        ...plan.movements
          .filter((movement) => missingMovements.includes(movement.id))
          .map((movement) => movement.chapterKey),
      ]),
    ],
    coveredChapterKeys: plan.requiredChapterKeys.filter((key) =>
      covered.has(key),
    ),
    missingMovements,
    reason: ok
      ? ""
      : `Research incomplete: missing evidence for required passages: ${missingLabels.join(", ")}.`,
  };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function chapterKeyMentionedInContent(content: string, key: string): boolean {
  const match = key.match(/^(.+)-(\d+)$/);
  if (!match) return false;
  const bookLabel = match[1].replace(/-/g, " ");
  return new RegExp(
    `${escapeRegExp(bookLabel)}\\s*${escapeRegExp(match[2])}`,
    "i",
  ).test(content);
}

/** Prefer verse-qualified citations when the brief supplied verses. */
export function scriptureRefCoveredInContent(
  content: string,
  ref: ScriptureRef,
): boolean {
  const book = escapeRegExp(ref.bookDisplay);
  if (ref.verseStart != null) {
    const verse =
      ref.verseEnd != null && ref.verseEnd !== ref.verseStart
        ? `${ref.chapter}\\s*:\\s*${ref.verseStart}\\s*[–-]\\s*${ref.verseEnd}`
        : `${ref.chapter}\\s*:\\s*${ref.verseStart}`;
    return new RegExp(`${book}\\s+${verse}`, "i").test(content);
  }
  return chapterKeyMentionedInContent(content, scriptureDocumentKey(ref));
}

function splitArticleSections(content: string): string[] {
  const parts = content
    .split(/\n(?=#{1,3}\s)/)
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : [content];
}

function movementCoveredInDedicatedSection(
  content: string,
  movement: TeachingMovement,
): boolean {
  return splitArticleSections(content).some((section) =>
    movement.articlePatterns.every((pattern) => pattern.test(section)),
  );
}

function refsForChapterKey(
  plan: ScriptureTeachingPlan,
  chapterKey: string,
): ScriptureRef[] {
  return plan.requiredRefs.filter(
    (ref) => scriptureDocumentKey(ref) === chapterKey,
  );
}

function chapterCoveredInArticle(
  content: string,
  plan: ScriptureTeachingPlan,
  chapterKey: string,
): boolean {
  const refs = refsForChapterKey(plan, chapterKey);
  if (refs.length === 0) return chapterKeyMentionedInContent(content, chapterKey);
  // Every cited verse range for the chapter must appear; chapter-only refs
  // still require the book+chapter mention.
  return refs.every((ref) => scriptureRefCoveredInContent(content, ref));
}

export function assessArticleTeachingCoverage(
  content: string,
  plan: ScriptureTeachingPlan,
): TeachingCoverageResult {
  if (plan.movements.length === 0) {
    const missingChapterKeys = plan.requiredChapterKeys.filter(
      (key) => !chapterCoveredInArticle(content, plan, key),
    );
    const ok = missingChapterKeys.length === 0;
    return {
      ok,
      missingChapterKeys,
      coveredChapterKeys: plan.requiredChapterKeys.filter(
        (key) => !missingChapterKeys.includes(key),
      ),
      missingMovements: [],
      reason: ok
        ? ""
        : `Article incomplete: missing required passage coverage: ${missingChapterKeys.join(", ")}.`,
    };
  }

  const missingMovements = plan.movements
    .filter(
      (movement) => !movementCoveredInDedicatedSection(content, movement),
    )
    .map((movement) => movement.id);

  const missingSupport = plan.supportingChapterKeys.filter(
    (key) => !chapterCoveredInArticle(content, plan, key),
  );

  const ok = missingMovements.length === 0 && missingSupport.length === 0;
  const missingChapterKeys = [
    ...new Set([
      ...plan.movements
        .filter((movement) => missingMovements.includes(movement.id))
        .map((movement) => movement.chapterKey),
      ...missingSupport,
    ]),
  ];

  return {
    ok,
    missingChapterKeys,
    coveredChapterKeys: plan.requiredChapterKeys.filter(
      (key) => !missingChapterKeys.includes(key),
    ),
    missingMovements,
    reason: ok
      ? ""
      : `Article incomplete: missing required teaching coverage (${[
          ...missingMovements,
          ...missingSupport,
        ].join(", ")}).`,
  };
}

export function formatTeachingPlanForPrompt(
  plan: ScriptureTeachingPlan,
): string {
  const lines: string[] = [
    "REQUIRED SCRIPTURE COVERAGE (do not omit any item):",
    "Build the article as a structured teaching with a dedicated H2 section for each required movement or supporting passage below.",
  ];
  if (plan.movements.length > 0) {
    for (const [index, movement] of plan.movements.entries()) {
      lines.push(
        `${index + 1}. SECTION: ${movement.label} — include the cited Exodus reference, biblical narrative, theological interpretation, and pastoral application in this section.`,
      );
    }
    if (plan.supportingChapterKeys.length > 0) {
      lines.push(
        "Supporting passages that must appear with accurate verse-qualified KJV citation in their own section or clearly marked subsection:",
      );
      for (const key of plan.supportingChapterKeys) {
        const refs = refsForChapterKey(plan, key);
        if (refs.length > 0) {
          for (const ref of refs) {
            const verse =
              ref.verseStart != null
                ? `:${ref.verseStart}${
                    ref.verseEnd != null && ref.verseEnd !== ref.verseStart
                      ? `-${ref.verseEnd}`
                      : ""
                  }`
                : "";
            lines.push(`- ${ref.bookDisplay} ${ref.chapter}${verse}`);
          }
        } else {
          lines.push(`- ${key.replace(/-/g, " ")}`);
        }
      }
    }
    lines.push(
      "Distinguish biblical narrative from theological interpretation and practical application.",
    );
    lines.push(
      "Do not claim that Exodus itself labels Pharaoh's negotiations as five satanic tactics.",
    );
    lines.push(
      "Do not stop after the first Exodus movement. Every listed movement and supporting passage is mandatory.",
    );
  } else {
    for (const key of plan.requiredChapterKeys) {
      lines.push(
        `- Cover ${key.replace(/-/g, " ")} with text-tethered teaching.`,
      );
    }
  }
  return lines.join("\n");
}

/** Brief used by the bounded completeness revision pass. */
export function formatMissingCoverageRevisionBrief(
  plan: ScriptureTeachingPlan,
  coverage: TeachingCoverageResult,
): string {
  const lines = [
    "The previous draft is incomplete. Expand it so every missing item below has substantive coverage grounded only in the supplied evidence-supported facts.",
    "Preserve existing accurate sections. Do not invent quotations or unsupported history.",
    "Missing required coverage:",
  ];
  for (const movementId of coverage.missingMovements) {
    const movement = plan.movements.find((item) => item.id === movementId);
    lines.push(`- Movement: ${movement?.label ?? movementId}`);
  }
  for (const key of coverage.missingChapterKeys) {
    if (plan.movements.some((movement) => movement.chapterKey === key)) {
      continue;
    }
    const refs = refsForChapterKey(plan, key);
    if (refs.length > 0) {
      for (const ref of refs) {
        const verse =
          ref.verseStart != null
            ? `:${ref.verseStart}${
                ref.verseEnd != null && ref.verseEnd !== ref.verseStart
                  ? `-${ref.verseEnd}`
                  : ""
              }`
            : "";
        lines.push(`- Supporting passage: ${ref.bookDisplay} ${ref.chapter}${verse}`);
      }
    } else {
      lines.push(`- Passage: ${key.replace(/-/g, " ")}`);
    }
  }
  return lines.join("\n");
}

/**
 * Composition-only fact eligibility for multi-passage bible teachings.
 * Does not change Prepare/publication verification thresholds.
 */
export function isTeachingCompositionFact(fact: {
  verificationStatus: string;
  verificationMethod?: string;
  sourceUrl?: string;
  supportingSources?: { sourceUrl?: string }[];
}): boolean {
  if (
    fact.verificationStatus === "verified" ||
    fact.verificationStatus === "partially verified"
  ) {
    return true;
  }
  if (fact.verificationMethod !== "single-source-supported") return false;
  const url = fact.supportingSources?.[0]?.sourceUrl || fact.sourceUrl || "";
  return /biblegateway\.com|biblehub\.com|blueletterbible\.org|kingjamesbibleonline\.org/i.test(
    url,
  );
}

/** Patterns used to prefer teaching-relevant evidence chunks. */
export function teachingEvidenceRelevancePatterns(
  plan: ScriptureTeachingPlan,
): RegExp[] {
  const patterns: RegExp[] = [];
  for (const movement of plan.movements) {
    patterns.push(...movement.evidencePatterns);
  }
  for (const ref of plan.requiredRefs) {
    const book = escapeRegExp(ref.bookDisplay);
    if (ref.verseStart != null) {
      patterns.push(
        new RegExp(
          `${book}\\s+${ref.chapter}\\s*:\\s*${ref.verseStart}`,
          "i",
        ),
      );
    }
  }
  return patterns;
}
