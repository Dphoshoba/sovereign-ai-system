import { describe, expect, it } from "vitest";
import {
  extractArticleClaims,
  FACTUAL_CLAIM_CEILING,
  passageSupportsClaim,
  type ArticleClaim,
} from "../../lib/research/article-claim-extractor";
import { groundedFactVerification } from "../../lib/research/claim-evidence-matcher";
import { selectClaimAwareEvidence } from "../../lib/research/claim-evidence-selector";
import { publishersNamedInClaim } from "../../lib/research/claim-source-attribution";
import { recommendationWithEvidenceCompleteness } from "../../lib/research/evidence-completeness";
import type { EvidenceChunk } from "../../lib/research/evidence-chunker";
import type { EvidenceRecord } from "../../lib/research/evidence-registry";
import { namedProductFeatures } from "../../lib/research/product-identity";
import { CURRENT_RESEARCH_AUDIT_ENGINE_REVISION } from "../../lib/research/research-audit-engine-revision";
import {
  AI_INBOX_CLAIM,
  AI_INBOX_TITLE,
  AI_INBOX_URL,
  HELP_ME_WRITE_CLAIM,
  HELP_ME_WRITE_PASSAGES,
  HELP_ME_WRITE_TITLE,
  HELP_ME_WRITE_URL,
} from "../fixtures/research-audit/article-2-gmail-ai-inbox";
import {
  AI_INBOX_SCOPE,
  GUEST_LIMIT,
  SCHEDULE_ANTECEDENT,
  section,
  SMART_FEATURES,
} from "../fixtures/research-audit/continuation-claims";
import {
  GUEST_LIMIT_PASSAGE,
  OWNERSHIP_ANTECEDENT,
  OWNERSHIP_SENTENCE,
  PRIVACY_HUB_TITLE,
  PRIVACY_HUB_URL,
  PROMPT_ANTECEDENT,
  PROMPT_RETENTION,
  SCHEDULE_PLAN_PASSAGE,
  SCHEDULE_TITLE,
  SCHEDULE_URL,
  UNRELATED_SCHEDULE_PASSAGE,
} from "../fixtures/research-audit/continuation-evidence-support";

const NIST_COMPOUND =
  "NIST says this is a natural result of models that predict likely next words, and that people may act on false content because it sounds confident.";
const NIST_NEXT_WORDS =
  "NIST says this is a natural result of models that predict likely next words in generated text.";
const NIST_ACT_ON_FALSE =
  "NIST says that people may act on false content because it sounds confident to a reader.";
const NIST_PDF = "https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf";
const MICROSOFT_URL =
  "https://support.microsoft.com/en-us/outlook/copilot-pages/draft-an-email-message-with-copilot-in-outlook";
const MICROSOFT_TITLE =
  "Draft an email message with Copilot in Outlook | Microsoft Support";

type LocalPassage = {
  id: string;
  text: string;
};

function extracted(content: string) {
  return extractArticleClaims({
    content,
    factualClaimLimit: FACTUAL_CLAIM_CEILING,
  });
}

function chunks(passages: readonly LocalPassage[]): EvidenceChunk[] {
  return passages.map((passage) => ({
    id: passage.id,
    text: passage.text,
    wordCount: passage.text.split(/\s+/).filter(Boolean).length,
  }));
}

function records(
  url: string,
  title: string,
  passages: readonly LocalPassage[],
): EvidenceRecord[] {
  return passages.map((passage) => ({
    id: passage.id,
    sourceTitle: title,
    sourceUrl: url,
    sourceType: "html",
    extractedText: passage.text,
    confidence: 80,
    requiresHumanReview: true,
  }));
}

function factualClaim(claim: string): ArticleClaim {
  return {
    claim,
    articleExcerpt: claim,
    section: "body",
    blockType: "paragraph",
    kind: "factual",
  };
}

function continuationFor(content: string, excerpt: string): ArticleClaim {
  const claim = extracted(content).claims.find(
    (item) => item.articleExcerpt === excerpt,
  );
  if (!claim) {
    throw new Error(`Continuation excerpt was not extracted: ${excerpt}`);
  }
  return claim;
}

function antecedentSpan(claim: ArticleClaim): string {
  if (!claim.claim.endsWith(claim.articleExcerpt) || claim.claim === claim.articleExcerpt) {
    return "";
  }
  return claim.claim.slice(0, claim.claim.length - claim.articleExcerpt.length).trim();
}

function outcome(input: {
  content: string;
  excerpt: string;
  url: string;
  title: string;
  passages: readonly LocalPassage[];
}) {
  const result = extracted(input.content);
  const continuation = continuationFor(input.content, input.excerpt);
  const antecedent = antecedentSpan(continuation);
  const listed = [{ url: input.url, title: input.title }];
  const selection = selectClaimAwareEvidence({
    claims: [continuation.claim],
    documents: [
      {
        url: input.url,
        title: input.title,
        sourceType: "html",
        extractedText: input.passages.map((passage) => passage.text).join("\n\n"),
        chunks: chunks(input.passages),
      },
    ],
    listedSources: listed,
  });
  const verification = groundedFactVerification(
    [continuation],
    records(input.url, input.title, input.passages),
    result.normalizedArticleText,
    listed,
  );
  const fact = verification.facts[0];
  return {
    excerpt: continuation.articleExcerpt,
    antecedent,
    fullClaim: continuation.claim,
    excerptIsFullClaim: continuation.articleExcerpt === continuation.claim,
    publishers: publishersNamedInClaim(continuation.claim),
    features: namedProductFeatures(continuation.claim),
    passageEvidence: input.passages.map((passage) => ({
      id: passage.id,
      supportsAntecedent: passageSupportsClaim(antecedent, passage.text),
      supportsExcerpt: passageSupportsClaim(continuation.articleExcerpt, passage.text),
    })),
    status: fact?.verificationStatus ?? "missing",
    urls: [
      ...new Set(fact?.supportingSources.map((source) => source.sourceUrl) ?? []),
    ],
    verificationPassageIds: [
      ...(fact?.supportingSources.map((source) => source.evidenceId) ?? []),
    ].sort(),
    selectedPassageIds: input.passages
      .filter((passage) =>
        selection.evidence.some((record) => record.extractedText === passage.text),
      )
      .map((passage) => passage.id)
      .sort(),
    completeness: recommendationWithEvidenceCompleteness(
      "publish-ready",
      fact ? [fact] : [],
      [],
    ),
  };
}

describe("continuation evidence must support the continuation sentence", () => {
  it("leaves the 20-guest limit unverified when only the plan sentence is present", () => {
    expect(
      outcome({
        content: section("Scheduling", [`${SCHEDULE_ANTECEDENT} ${GUEST_LIMIT}`]),
        excerpt: GUEST_LIMIT,
        url: SCHEDULE_URL,
        title: SCHEDULE_TITLE,
        passages: [{ id: "schedule-plan", text: SCHEDULE_PLAN_PASSAGE }],
      }),
    ).toEqual({
      excerpt: GUEST_LIMIT,
      antecedent: SCHEDULE_ANTECEDENT,
      fullClaim: `${SCHEDULE_ANTECEDENT} ${GUEST_LIMIT}`,
      excerptIsFullClaim: false,
      publishers: ["google"],
      features: ["Help me schedule"],
      passageEvidence: [
        {
          id: "schedule-plan",
          supportsAntecedent: true,
          supportsExcerpt: false,
        },
      ],
      status: "unverified",
      urls: [],
      verificationPassageIds: [],
      selectedPassageIds: [],
      completeness: "review-required",
    });
  });

  it("partially verifies the guest limit when the passage states that limit", () => {
    expect(
      outcome({
        content: section("Scheduling", [`${SCHEDULE_ANTECEDENT} ${GUEST_LIMIT}`]),
        excerpt: GUEST_LIMIT,
        url: SCHEDULE_URL,
        title: SCHEDULE_TITLE,
        passages: [{ id: "schedule-limit", text: GUEST_LIMIT_PASSAGE }],
      }),
    ).toEqual({
      excerpt: GUEST_LIMIT,
      antecedent: SCHEDULE_ANTECEDENT,
      fullClaim: `${SCHEDULE_ANTECEDENT} ${GUEST_LIMIT}`,
      excerptIsFullClaim: false,
      publishers: ["google"],
      features: ["Help me schedule"],
      passageEvidence: [
        {
          id: "schedule-limit",
          supportsAntecedent: false,
          supportsExcerpt: true,
        },
      ],
      status: "partially verified",
      urls: [SCHEDULE_URL],
      verificationPassageIds: ["schedule-limit"],
      selectedPassageIds: ["schedule-limit"],
      completeness: "publish-ready",
    });
  });

  it("verifies the guest limit only when the passage that states it is present", () => {
    const content = section("Scheduling", [`${SCHEDULE_ANTECEDENT} ${GUEST_LIMIT}`]);
    const plan = { id: "schedule-plan", text: SCHEDULE_PLAN_PASSAGE };
    const limit = { id: "schedule-limit", text: GUEST_LIMIT_PASSAGE };
    const antecedentOnly = outcome({
      content,
      excerpt: GUEST_LIMIT,
      url: SCHEDULE_URL,
      title: SCHEDULE_TITLE,
      passages: [plan],
    });
    const bothPassages = outcome({
      content,
      excerpt: GUEST_LIMIT,
      url: SCHEDULE_URL,
      title: SCHEDULE_TITLE,
      passages: [plan, limit],
    });

    expect({
      antecedentOnly: {
        status: antecedentOnly.status,
        verificationPassageIds: antecedentOnly.verificationPassageIds,
        selectedPassageIds: antecedentOnly.selectedPassageIds,
        excerptSupported: antecedentOnly.passageEvidence.map((passage) => ({
          id: passage.id,
          supportsExcerpt: passage.supportsExcerpt,
        })),
      },
      bothPassages: {
        status: bothPassages.status,
        verificationPassageIds: bothPassages.verificationPassageIds,
        selectedPassageIds: bothPassages.selectedPassageIds,
        urls: bothPassages.urls,
        excerptSupported: bothPassages.passageEvidence.map((passage) => ({
          id: passage.id,
          supportsExcerpt: passage.supportsExcerpt,
        })),
      },
    }).toEqual({
      antecedentOnly: {
        status: "unverified",
        verificationPassageIds: [],
        selectedPassageIds: [],
        excerptSupported: [{ id: "schedule-plan", supportsExcerpt: false }],
      },
      bothPassages: {
        status: "partially verified",
        verificationPassageIds: ["schedule-limit"],
        selectedPassageIds: ["schedule-limit"],
        urls: [SCHEDULE_URL],
        excerptSupported: [
          { id: "schedule-plan", supportsExcerpt: false },
          { id: "schedule-limit", supportsExcerpt: true },
        ],
      },
    });
  });

  it("rejects a Help me write page for the Help me schedule guest limit", () => {
    const content = section("Scheduling", [`${SCHEDULE_ANTECEDENT} ${GUEST_LIMIT}`]);
    const continuation = continuationFor(content, GUEST_LIMIT);
    const passages = HELP_ME_WRITE_PASSAGES.map((passage) => ({
      id: passage.id,
      text: passage.extractedText,
    }));
    const listed = [
      { url: HELP_ME_WRITE_URL, title: HELP_ME_WRITE_TITLE },
      { url: SCHEDULE_URL, title: SCHEDULE_TITLE },
    ];
    const verification = groundedFactVerification(
      [continuation],
      passages.map((passage) => ({
        id: passage.id,
        sourceTitle: HELP_ME_WRITE_TITLE,
        sourceUrl: HELP_ME_WRITE_URL,
        sourceType: "html",
        extractedText: passage.text,
        confidence: 80,
        requiresHumanReview: true,
      })),
      extracted(content).normalizedArticleText,
      listed,
    );
    const selection = selectClaimAwareEvidence({
      claims: [continuation.claim],
      documents: [
        {
          url: HELP_ME_WRITE_URL,
          title: HELP_ME_WRITE_TITLE,
          sourceType: "html",
          extractedText: passages.map((passage) => passage.text).join("\n\n"),
          chunks: chunks(passages),
        },
      ],
      listedSources: listed,
    });
    const fact = verification.facts[0];

    expect({
      excerpt: continuation.articleExcerpt,
      fullClaim: continuation.claim,
      publishers: publishersNamedInClaim(continuation.claim),
      features: namedProductFeatures(continuation.claim),
      status: fact?.verificationStatus,
      urls: fact?.supportingSources.map((source) => source.sourceUrl) ?? [],
      selectedPassageIds: selection.evidence.map((record) => record.id),
    }).toEqual({
      excerpt: GUEST_LIMIT,
      fullClaim: `${SCHEDULE_ANTECEDENT} ${GUEST_LIMIT}`,
      publishers: ["google"],
      features: ["Help me schedule"],
      status: "unverified",
      urls: [],
      selectedPassageIds: [],
    });
  });

  it("leaves the guest limit unverified when the page states a different limitation", () => {
    expect(
      outcome({
        content: section("Scheduling", [`${SCHEDULE_ANTECEDENT} ${GUEST_LIMIT}`]),
        excerpt: GUEST_LIMIT,
        url: SCHEDULE_URL,
        title: SCHEDULE_TITLE,
        passages: [{ id: "schedule-other", text: UNRELATED_SCHEDULE_PASSAGE }],
      }),
    ).toEqual({
      excerpt: GUEST_LIMIT,
      antecedent: SCHEDULE_ANTECEDENT,
      fullClaim: `${SCHEDULE_ANTECEDENT} ${GUEST_LIMIT}`,
      excerptIsFullClaim: false,
      publishers: ["google"],
      features: ["Help me schedule"],
      passageEvidence: [
        {
          id: "schedule-other",
          supportsAntecedent: true,
          supportsExcerpt: false,
        },
      ],
      status: "unverified",
      urls: [],
      verificationPassageIds: [],
      selectedPassageIds: [],
      completeness: "review-required",
    });
  });

  it("leaves Smart features unverified against the AI Inbox beta sentence", () => {
    expect(
      outcome({
        content: section("Enquiry triage", [`${AI_INBOX_CLAIM} ${SMART_FEATURES}`]),
        excerpt: SMART_FEATURES,
        url: AI_INBOX_URL,
        title: AI_INBOX_TITLE,
        passages: [{ id: "inbox-beta", text: AI_INBOX_CLAIM }],
      }),
    ).toEqual({
      excerpt: SMART_FEATURES,
      antecedent: AI_INBOX_CLAIM,
      fullClaim: `${AI_INBOX_CLAIM} ${SMART_FEATURES}`,
      excerptIsFullClaim: false,
      publishers: ["google"],
      features: ["Gmail AI Inbox"],
      passageEvidence: [
        {
          id: "inbox-beta",
          supportsAntecedent: true,
          supportsExcerpt: false,
        },
      ],
      status: "unverified",
      urls: [],
      verificationPassageIds: [],
      selectedPassageIds: [],
      completeness: "review-required",
    });
  });

  it("leaves the complaint-classification scope unverified against the beta sentence", () => {
    expect(
      outcome({
        content: section("Enquiry triage", [`${AI_INBOX_CLAIM} ${AI_INBOX_SCOPE}`]),
        excerpt: AI_INBOX_SCOPE,
        url: AI_INBOX_URL,
        title: AI_INBOX_TITLE,
        passages: [{ id: "inbox-beta", text: AI_INBOX_CLAIM }],
      }),
    ).toEqual({
      excerpt: AI_INBOX_SCOPE,
      antecedent: AI_INBOX_CLAIM,
      fullClaim: `${AI_INBOX_CLAIM} ${AI_INBOX_SCOPE}`,
      excerptIsFullClaim: false,
      publishers: ["google"],
      features: ["Gmail AI Inbox"],
      passageEvidence: [
        {
          id: "inbox-beta",
          supportsAntecedent: true,
          supportsExcerpt: false,
        },
      ],
      status: "unverified",
      urls: [],
      verificationPassageIds: [],
      selectedPassageIds: [],
      completeness: "review-required",
    });
  });

  it("leaves prompt retention unverified against the privacy-hub sentence", () => {
    expect(
      outcome({
        content: section("Privacy", [`${PROMPT_ANTECEDENT} ${PROMPT_RETENTION}`]),
        excerpt: PROMPT_RETENTION,
        url: PRIVACY_HUB_URL,
        title: PRIVACY_HUB_TITLE,
        passages: [{ id: "privacy-antecedent", text: PROMPT_ANTECEDENT }],
      }),
    ).toEqual({
      excerpt: PROMPT_RETENTION,
      antecedent: PROMPT_ANTECEDENT,
      fullClaim: `${PROMPT_ANTECEDENT} ${PROMPT_RETENTION}`,
      excerptIsFullClaim: false,
      publishers: ["google"],
      features: [],
      passageEvidence: [
        {
          id: "privacy-antecedent",
          supportsAntecedent: true,
          supportsExcerpt: false,
        },
      ],
      status: "unverified",
      urls: [],
      verificationPassageIds: [],
      selectedPassageIds: [],
      completeness: "review-required",
    });
  });

  it("does not treat meeting ownership as supported by the booking sentence", () => {
    expect(
      outcome({
        content: section("Scheduling", [
          `${OWNERSHIP_ANTECEDENT} ${OWNERSHIP_SENTENCE}`,
        ]),
        excerpt: OWNERSHIP_SENTENCE,
        url: SCHEDULE_URL,
        title: SCHEDULE_TITLE,
        passages: [{ id: "booking-antecedent", text: OWNERSHIP_ANTECEDENT }],
      }),
    ).toEqual({
      excerpt: OWNERSHIP_SENTENCE,
      antecedent: OWNERSHIP_ANTECEDENT,
      fullClaim: `${OWNERSHIP_ANTECEDENT} ${OWNERSHIP_SENTENCE}`,
      excerptIsFullClaim: false,
      publishers: ["google"],
      features: [],
      passageEvidence: [
        {
          id: "booking-antecedent",
          supportsAntecedent: true,
          supportsExcerpt: false,
        },
      ],
      status: "unverified",
      urls: [],
      verificationPassageIds: [],
      selectedPassageIds: [],
      completeness: "review-required",
    });
  });

  it("does not select an antecedent-only passage as support for a continuation", () => {
    const content = section("Scheduling", [`${SCHEDULE_ANTECEDENT} ${GUEST_LIMIT}`]);
    const plan = { id: "schedule-plan", text: SCHEDULE_PLAN_PASSAGE };
    const limit = { id: "schedule-limit", text: GUEST_LIMIT_PASSAGE };
    const onlyAntecedent = outcome({
      content,
      excerpt: GUEST_LIMIT,
      url: SCHEDULE_URL,
      title: SCHEDULE_TITLE,
      passages: [plan],
    });
    const bothPassages = outcome({
      content,
      excerpt: GUEST_LIMIT,
      url: SCHEDULE_URL,
      title: SCHEDULE_TITLE,
      passages: [plan, limit],
    });

    expect({
      onlyAntecedent: onlyAntecedent.selectedPassageIds,
      bothPassages: bothPassages.selectedPassageIds,
      retainedAntecedentText: [onlyAntecedent, bothPassages].some((result) =>
        result.selectedPassageIds.includes("schedule-plan"),
      ),
    }).toEqual({
      onlyAntecedent: [],
      bothPassages: ["schedule-limit"],
      retainedAntecedentText: false,
    });
  });
});

describe("continuation evidence controls that already hold", () => {
  it("keeps the current engine at article-grounded-v13", () => {
    expect(CURRENT_RESEARCH_AUDIT_ENGINE_REVISION).toBe("article-grounded-v13");
  });

  it("still accepts the official Help me write passage for its own claim", () => {
    const verification = groundedFactVerification(
      [factualClaim(HELP_ME_WRITE_CLAIM)],
      HELP_ME_WRITE_PASSAGES.map((passage) => ({
        id: passage.id,
        sourceTitle: HELP_ME_WRITE_TITLE,
        sourceUrl: HELP_ME_WRITE_URL,
        sourceType: "html",
        extractedText: passage.extractedText,
        confidence: 80,
        requiresHumanReview: true,
      })),
      HELP_ME_WRITE_CLAIM,
      [{ url: HELP_ME_WRITE_URL, title: HELP_ME_WRITE_TITLE }],
    );
    expect(namedProductFeatures(HELP_ME_WRITE_CLAIM)).toEqual(["Help me write"]);
    expect(publishersNamedInClaim(HELP_ME_WRITE_CLAIM)).toEqual(["google"]);
    expect(verification.facts[0]?.verificationStatus).toBe("partially verified");
    expect([
      ...new Set(
        verification.facts[0]?.supportingSources.map((source) => source.sourceUrl) ?? [],
      ),
    ]).toEqual([HELP_ME_WRITE_URL]);
  });

  it("still verifies a NIST compound claim from one document", () => {
    const verification = groundedFactVerification(
      [factualClaim(NIST_COMPOUND)],
      [
        {
          id: "next-words",
          sourceTitle: "NIST",
          sourceUrl: NIST_PDF,
          sourceType: "government",
          extractedText: NIST_NEXT_WORDS,
          confidence: 90,
          requiresHumanReview: true,
        },
        {
          id: "act-on-false",
          sourceTitle: "NIST",
          sourceUrl: NIST_PDF,
          sourceType: "government",
          extractedText: NIST_ACT_ON_FALSE,
          confidence: 90,
          requiresHumanReview: true,
        },
      ],
      NIST_COMPOUND,
    );
    expect(verification.facts[0]?.verificationStatus).toBe("verified");
    expect(verification.facts[0]?.verificationCount).toBe(1);
    expect(
      new Set(verification.facts[0]?.supportingSources.map((source) => source.sourceUrl)),
    ).toEqual(new Set([NIST_PDF]));
  });

  it("still rejects a publisher mismatch", () => {
    const verification = groundedFactVerification(
      [factualClaim(AI_INBOX_CLAIM)],
      [
        {
          id: "microsoft-copy",
          sourceTitle: MICROSOFT_TITLE,
          sourceUrl: MICROSOFT_URL,
          sourceType: "html",
          extractedText: AI_INBOX_CLAIM,
          confidence: 80,
          requiresHumanReview: true,
        },
      ],
      AI_INBOX_CLAIM,
    );
    expect(verification.facts[0]?.verificationStatus).toBe("unverified");
    expect(verification.facts[0]?.supportingSources).toEqual([]);
    expect(verification.facts[0]?.matchDiagnostics?.[0]?.failureReason).toBe(
      "publisher-mismatch",
    );
  });
});
