import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOpenAI } from "@/lib/ai/openai";
import { DAVID_WRITING_DNA } from "@/lib/ai/writing-dna";
import { getMemoryContext } from "@/lib/ai/memory-context";

import {
  sourceCollector,
  type SourceRecord,
} from "../../../../lib/research/source-collector";
import { evidenceRegistry } from "../../../../lib/research/evidence-registry";
import { factExtractor } from "../../../../lib/research/fact-extractor";
import {
  detectBibleSubject,
  isDavidGoliathNarrativeClaim,
} from "../../../../lib/research/bible-extractor";
import { factVerificationEngine } from "../../../../lib/research/fact-verification-engine";
import { consensusEngine } from "../../../../lib/research/consensus-engine";
import { recommendationWithEvidenceCompleteness } from "../../../../lib/research/evidence-completeness";
import { publicationGate } from "../../../../lib/research/publication-gate";
import { authorizeEditorOrCron } from "../../../../lib/publishing/require-editor-auth";

import { encodingNormalizer } from "../../../../lib/research/encoding-normalizer";
import { contentSafeNormalizer } from "../../../../lib/research/content-safe-normalizer";
import { calculateEditorialQualityScore } from "../../../../lib/editorial/quality-score";
import { generateAndPersistFeaturedImage } from "../../../../lib/ai/persist-featured-image";
import { articleQualityScorer } from "../../../../lib/editorial/article-quality-scorer";
import { seoScorer } from "../../../../lib/editorial/seo-scorer";
import { lockArticleForGovernance } from "../../../../lib/publishing/article-lifecycle";
import { computeArticleAuditFingerprint } from "../../../../lib/research/article-audit-fingerprint";
import {
  RESEARCH_AUDIT_FINGERPRINT_ACTION,
  serializeArticleAuditAssociation,
} from "../../../../lib/research/article-audit-association";
import { applyArticleSourceMutationInTransaction } from "../../../../lib/research/article-source-mutation";
import {
  unsupportedClaimsRevisionBrief,
  verifyGeneratedArticleAgainstEvidence,
} from "../../../../lib/research/ground-generated-article";
import {
  assessArticleTeachingCoverage,
  assessEvidenceTeachingCoverage,
  buildScriptureTeachingPlan,
  formatMissingCoverageRevisionBrief,
  formatTeachingPlanForPrompt,
  isTeachingCompositionFact,
  teachingEvidenceRelevancePatterns,
} from "../../../../lib/research/biblical-teaching-completeness";
import {
  isVersionedEditorialVerifierEnabled,
  revisionWrittenByEditorialPrepare,
} from "../../../../lib/research/versioned-publication";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function createUniqueSlug(baseSlug: string, category: string) {
  let slug = baseSlug;
  let counter = 2;

  while (true) {
    const existing = await prisma.article.findFirst({
      where: { slug, category },
      select: { id: true },
    });

    if (!existing) return slug;

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

function finalTextCleanup(value: string): string {
  const bad = String.fromCharCode(226);

  return value
    .replace(new RegExp(`([A-Za-z])${bad}s\\b`, "g"), "$1's")
    .replace(new RegExp(`([A-Za-z])${bad}t\\b`, "g"), "$1't")
    .replace(new RegExp(`([A-Za-z])${bad}re\\b`, "g"), "$1're")
    .replace(new RegExp(`([A-Za-z])${bad}ll\\b`, "g"), "$1'll")
    .replace(new RegExp(`([A-Za-z])${bad}ve\\b`, "g"), "$1've")
    .replace(new RegExp(`([A-Za-z])${bad}m\\b`, "g"), "$1'm")
    .replace(new RegExp(`([A-Za-z])${bad}d\\b`, "g"), "$1'd")
    .replace(new RegExp(`\\s*${bad}\\s*`, "g"), " - ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([.!?])([A-Z])/g, "$1 $2")
    .replace(/([a-z])(\*\*)/g, "$1 $2")
    .replace(/(\*\*)([A-Za-z])/g, "$1 $2")
    .replace(/([a-z])(-\s)/g, "$1 $2")
    .replace(/([a-z]{3,})(AI)/g, "$1 AI")
    .replace(/(AI)([a-z]{3,})/g, "$1 $2")
    .replace(/\bandresponsible\b/gi, "and responsible")
    .replace(/\bagainand\b/gi, "again and")
    .replace(/\bWorkflowcleanup\b/g, "Workflow cleanup")
    .replace(/\bAIuse\b/g, "AI use")
    .replace(/\bpublishcarelessly\b/gi, "publish carelessly")
    .replace(/\bcontentcreation\b/gi, "content creation")
    .replace(/\bTheevidence\b/g, "The evidence")
    .replace(/\bwhereverifiable\b/gi, "where verifiable")
    .replace(/\bisabout\b/gi, "is about")
    .replace(/\bUsea\b/g, "Use a")
    .replace(/\bhowto\b/gi, "how to")
    .replace(/\s+([,.!?;:])/g, "$1")
    .replace(/[ \t]+/g, " ")
    .replace(/\bWhatChanges\b/g, "What Changes")
    .replace(/\bThatis\b/gi, "That is")
    .replace(/\btwothings\b/gi, "two things")
    .replace(/\btasksget\b/gi, "tasks get")
    .replace(/\bcreatorscan\b/gi, "creators can")
    .replace(/\banduses\b/gi, "and uses")
    .replace(/\bon(outhe)\b/gi, "on the")
    .replace(/\bresponsibleand\b/gi, "responsible and")
    .replace(/\bneeda\b/gi, "need a")
    .replace(/\bItis\b/g, "It is")
    .replace(/\sstreamlineworkflow\b/gi, "streamline workflow")
    .replace(/\bdoesnot\b/gi, "does not")
    .replace(/\bBe wise\.Do\b/g, "Be wise. Do")
    .replace(/\*\*\s+/g, "**")
    .replace(/\s+\*\*/g, "**")
    .replace(/\*\s+/g, "*")
    .replace(/\s+\*/g, "*")
    .replace(/-\*\*/g, "- **")
    .replace(/\*\*([A-Za-z])/g, "** $1")
    .replace(/([a-z])\*\*/g, "$1 **")
    .replace(/\*\*([a-z])/g, "** $1")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .trim();
}

export async function POST(request: Request) {
  const auth = await authorizeEditorOrCron(request);
  if (!auth.ok) return auth.response;

  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { ok: false, error: "Missing OPENAI_API_KEY" },
        { status: 500 },
      );
    }

    const body = await request.json();

    const topic = body.topic || "AI automation for creators";
    const category = body.category || "ai-automation";
    const manualSources: SourceRecord[] = Array.isArray(body.manualSources)
      ? body.manualSources
      : [];

    const teachingPlan = buildScriptureTeachingPlan(
      String(topic || ""),
      category,
    );

    const sourceCollection = await sourceCollector(
      topic,
      manualSources,
      category,
    );
    if (sourceCollection.sourceCount === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: sourceCollection.collectionStatus,
          articleUnchanged: true,
          publicationDecision: {
            approved: false,
            status: "blocked",
            reason: sourceCollection.collectionStatus,
          },
        },
        { status: 422 },
      );
    }
    const evidence = await evidenceRegistry(
      topic,
      sourceCollection.collectedSources,
      {
        teachingRelevancePatterns: teachingPlan
          ? teachingEvidenceRelevancePatterns(teachingPlan)
          : [],
        teachingRequiredRefs: teachingPlan?.requiredRefs ?? [],
      },
    );
    if (evidence.evidenceCount === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "Research blocked: no usable evidence was retrieved.",
          articleUnchanged: true,
          publicationDecision: {
            approved: false,
            status: "blocked",
            reason: "Research blocked: no usable evidence was retrieved.",
          },
        },
        { status: 422 },
      );
    }

    if (teachingPlan?.oversizedBrief) {
      return NextResponse.json(
        {
          ok: false,
          error: teachingPlan.oversizedReason,
          articleUnchanged: true,
          teachingCompleteness: {
            ok: false,
            missingChapterKeys: teachingPlan.truncatedChapterKeys,
            coveredChapterKeys: teachingPlan.requiredChapterKeys,
            missingMovements: [],
            reason: teachingPlan.oversizedReason,
          },
          publicationDecision: {
            approved: false,
            status: "blocked",
            reason: teachingPlan.oversizedReason,
          },
        },
        { status: 422 },
      );
    }
    if (teachingPlan && teachingPlan.requiredChapterKeys.length >= 2) {
      const teachingCoverage = assessEvidenceTeachingCoverage(
        evidence.evidence,
        teachingPlan,
      );
      if (!teachingCoverage.ok) {
        return NextResponse.json(
          {
            ok: false,
            error: teachingCoverage.reason,
            articleUnchanged: true,
            teachingCompleteness: teachingCoverage,
            publicationDecision: {
              approved: false,
              status: "blocked",
              reason: teachingCoverage.reason,
            },
            researchAudit: {
              sourceCount: sourceCollection.sourceCount,
              evidenceCount: evidence.evidenceCount,
              missingRequiredPassages: teachingCoverage.missingChapterKeys,
              coveredRequiredPassages: teachingCoverage.coveredChapterKeys,
            },
          },
          { status: 422 },
        );
      }
    }

    const factExtraction = factExtractor(topic, evidence.evidence, category);
    const factVerification = factVerificationEngine(factExtraction.facts);
    const consensus = consensusEngine(factVerification.verifiedFacts);
    const publicationRecommendation = recommendationWithEvidenceCompleteness(
      consensus.publicationRecommendation,
      factVerification.verifiedFacts,
    );
    const governedConsensus = {
      ...consensus,
      publicationRecommendation,
    };
    const publicationDecision = publicationGate(governedConsensus);

    if (publicationDecision.status === "blocked") {
      return NextResponse.json(
        {
          ok: false,
          error: "Publication blocked by research gate",
          publicationDecision,
          researchAudit: {
            sourceCount: sourceCollection.sourceCount,
            averageAuthorityScore: sourceCollection.averageAuthorityScore,
            averageTrustScore: sourceCollection.averageTrustScore,
            researchConfidence: sourceCollection.researchConfidence,
            evidenceCount: evidence.evidenceCount,
            factCount: factVerification.verifiedFacts.length,
            extractedFactCount: factExtraction.factCount,
            verifiedCount: factVerification.verifiedCount,
            averageVerificationScore: factVerification.averageVerificationScore,
            partiallyVerifiedCount: factVerification.partiallyVerifiedCount,
            unverifiedCount: factVerification.unverifiedCount,
            consensusScore: consensus.consensusScore,
            sourceQualityScore: consensus.sourceQualityScore,
            publicationRecommendation,
          },
        },
        { status: 422 },
      );
    }

    const consensusText = consensus.consensusGroups
      .map(
        (group) =>
          `Theme: ${group.theme}\n` +
          `Sources: ${group.sourceCount}\n` +
          `Consensus: ${group.consensusStatement}`,
      )
      .join("\n\n");

    const consensusBlock =
      consensus.consensusGroupCount > 0
        ? "CONSENSUS THEMES:\n\n" + consensusText
        : "No consensus themes available.";

    const evidenceBlob = (evidence.evidence ?? [])
      .map((record: { extractedText?: string }) => record.extractedText ?? "")
      .join("\n");
    const bibleSubject = String(category || "")
      .toLowerCase()
      .includes("bible")
      ? detectBibleSubject(String(topic || ""), evidenceBlob)
      : "generic";
    const publishableFacts = factVerification.verifiedFacts.filter((fact) => {
      // Mission 006R4: teaching briefs may use single-host scripture for
      // composition input; Prepare/publication thresholds stay unchanged.
      const compositionOk = teachingPlan
        ? isTeachingCompositionFact(fact)
        : fact.verificationStatus === "verified" ||
          fact.verificationStatus === "partially verified";
      if (!compositionOk) return false;
      // Defense in depth: never feed unrelated D&G FACT blocks into non-D&G bible topics.
      if (
        bibleSubject !== "david-goliath" &&
        isDavidGoliathNarrativeClaim(fact.claim)
      ) {
        return false;
      }
      return true;
    });

    const verifiedFactsText = publishableFacts
      .map((fact, index) => {
        const sources = fact.supportingSources
          .map((source) => source.sourceUrl)
          .join(", ");

        return (
          `FACT ${index + 1}: ${fact.claim}\n` +
          `Verification: ${fact.verificationStatus}\n` +
          `Sources: ${sources || "none"}`
        );
      })
      .join("\n\n");

    const hasVerifiedEvidence =
      evidence.evidenceCount > 0 && publishableFacts.length > 0;

    const factsBlock = hasVerifiedEvidence
      ? "EVIDENCE-SUPPORTED FACTS (the only factual material you may use):\n" +
        verifiedFactsText
      : "There are NO verified facts available for this topic. " +
        "Write a cautious, clearly-framed draft that avoids specific factual " +
        "claims, statistics, quotes, names, dates, companies, or sources. " +
        "Lean on principles, frameworks, and practical guidance rather than asserted facts.";

    const memoryContext = await getMemoryContext({
      query: topic,
      types: ["strategy", "voice", "audience", "publishing"],
      limit: 8,
    });

    const response = await getOpenAI().responses.create({
      model: "gpt-5.2",
      instructions:
        "You are the AI writing engine for Echoes & Visions. " +
        DAVID_WRITING_DNA +
        " Return only valid JSON. No markdown wrapper. No explanations.",
      input:
        "RESEARCH LOCK MODE. Write only from the supplied topic, category, consensus themes, and evidence-supported facts.\n\n" +
        "Topic: " +
        topic +
        "\n" +
        "Category: " +
        category +
        "\n\n" +
        "Write a full, useful article of 1200 to 1800 words when evidence allows. If evidence is limited, write as fully as possible without inventing claims.\n\n" +
        "Do not redirect the article back to AI automation unless the category is ai-tools or ai-automation.\n" +
        "If the category is bible-stories, write a Bible/history article that stays on the requested topic and cited passages. Do not inject an unrelated biblical story (for example David and Goliath) when the topic and facts concern a different passage such as Exodus or Pharaoh.\n" +
        "If the category is motivation, write a motivation article.\n" +
        "If the category is health, write a health article.\n" +
        "If the category is space, write a space article.\n" +
        "If the category is history, write a history article.\n\n" +
        "Relevant saved AI memory context: " +
        memoryContext +
        "\n\n" +
        consensusBlock +
        "\n\n" +
        factsBlock +
        "\n\n" +
        (teachingPlan ? formatTeachingPlanForPrompt(teachingPlan) + "\n\n" : "") +
        "ARTICLE STRUCTURE REQUIREMENT:\n" +
        (teachingPlan
          ? "Use the required scripture coverage list as the primary outline. Create a dedicated H2 for every required movement and supporting passage. Use verified facts as evidence inside those sections.\n"
          : "Create one major section for each verified fact.\nUse the verified facts as H2 headings or the basis of H2 headings.\n") +
        "Expand each section with explanation, examples, implications and practical guidance.\n" +
        "\n" +
        "STRICT RULES:\n" +
        "- Stay faithful to the category.\n" +
        "- Write only from verified or partially verified facts.\n" +
        "- Every verified fact must appear somewhere in the article.\n" +
        "- Create at least one section heading for each major verified fact" +
        (teachingPlan
          ? ", while still completing every required scripture coverage section.\n"
          : ".\n") +
        "- Expand verified facts into practical examples, implications, benefits, risks, and applications.\n" +
        "- Do not summarize multiple facts into one sentence.\n" +
        "- If five verified facts are supplied, discuss all five.\n" +
        (teachingPlan
          ? "- The required scripture coverage list is the backbone of the article structure; verified facts supply the evidence for each section.\n"
          : "- Use verified facts as the backbone of the article structure.\n") +
        "- Do not invent statistics, quotes, dates, historical claims, companies, or sources.\n" +
        "- If evidence is limited, clearly say so and write a cautious article around what is supported.\n" +
        "- Never omit a required scripture coverage item when evidence for that passage was supplied.\n" +
        "- Return valid JSON only.\n" +
        "- Use plain ASCII punctuation only.\n" +
        "- Use straight apostrophes (').\n" +
        '- Use straight quotation marks (").\n' +
        "- Use normal hyphens (-).\n" +
        "- Do not use smart quotes.\n" +
        "- Do not use curly apostrophes.\n" +
        "- Do not use em dashes.\n" +
        "- Do not use en dashes.\n\n" +
        'Return JSON only in this exact format: {"title":"...","excerpt":"...","content":"...","seoTitle":"...","seoDescription":"...","seoKeywords":"keyword one, keyword two, keyword three","featuredImagePrompt":"...","faq":[{"question":"...","answer":"..."}]}.\n\n' +
        "SEO RULES:\n" +
        "- seoTitle must be 40 to 65 characters.\n" +
        "- seoDescription must be 120 to 160 characters.\n" +
        "- seoKeywords must include at least 3 comma-separated keyword phrases.\n" +
        "- faq must include 3 to 5 practical questions and answers.\n\n" +
        "Requirements: use Markdown in content, include headings, practical examples, clear human rhythm, and a subtle Echoes & Visions CTA near the end.",
    });

    const rawOutput = response.output_text || "";

    function extractJsonObject(text: string): string {
      const start = text.indexOf("{");
      const end = text.lastIndexOf("}");

      if (start === -1 || end === -1 || end <= start) {
        throw new Error("AI returned no JSON object.");
      }

      return text.slice(start, end + 1);
    }

    let parsed;

    try {
      parsed = JSON.parse(extractJsonObject(rawOutput));
    } catch (parseError) {
      console.error("AI JSON parse failed. Raw output:", rawOutput);
      throw parseError;
    }

    let cleanedContent = parsed.content
      ? finalTextCleanup(
          contentSafeNormalizer(encodingNormalizer(parsed.content)),
        )
      : null;

    let cleanedExcerpt = parsed.excerpt
      ? finalTextCleanup(encodingNormalizer(parsed.excerpt))
      : null;

    let cleanedSeoDescription = parsed.seoDescription
      ? finalTextCleanup(encodingNormalizer(parsed.seoDescription))
      : null;

    let title = finalTextCleanup(parsed.title || topic);
    let seoTitle = finalTextCleanup(parsed.seoTitle || title);
    let seoKeywords = parsed.seoKeywords
      ? finalTextCleanup(parsed.seoKeywords)
      : null;

    const faq = Array.isArray(parsed.faq) ? parsed.faq : [];
    const listedAttribution = (sourceCollection.collectedSources || []).map(
      (source) => ({
        url: source.url,
        title: source.title,
      }),
    );
    const versionedEnabled = isVersionedEditorialVerifierEnabled();

    const groundDraft = (draft: {
      title: string;
      excerpt: string | null;
      content: string;
    }) =>
      verifyGeneratedArticleAgainstEvidence({
        title: draft.title,
        excerpt: draft.excerpt,
        content: draft.content,
        evidence: Array.isArray(evidence.evidence) ? evidence.evidence : [],
        listedSources: listedAttribution,
        versioned: versionedEnabled,
      });

    let articleGrounding =
      cleanedContent && cleanedContent.trim().length > 0
        ? groundDraft({
            title,
            excerpt: cleanedExcerpt,
            content: cleanedContent,
          })
        : null;

    if (
      articleGrounding &&
      articleGrounding.unsupportedFactualClaims.length > 0 &&
      cleanedContent
    ) {
      const revision = await getOpenAI().responses.create({
        model: "gpt-5.2",
        instructions:
          "You are the Echoes & Visions editorial grounding reviser. " +
          DAVID_WRITING_DNA +
          " Return only valid JSON. No markdown wrapper.",
        input:
          "Revise this draft so every factual claim is supported by the supplied evidence-supported facts. " +
          "Omit, qualify as editorial guidance, or rewrite any unsupported factual statement. " +
          "Do not invent statistics, quotations, citations, or independent corroboration. " +
          "Preserve practical guidance and the Echoes & Visions voice.\n\n" +
          "EVIDENCE-SUPPORTED FACTS:\n" +
          (verifiedFactsText || "None") +
          "\n\nUNSUPPORTED FACTUAL CLAIMS TO REMOVE OR QUALIFY:\n" +
          unsupportedClaimsRevisionBrief(
            articleGrounding.unsupportedFactualClaims,
          ) +
          "\n\nCURRENT DRAFT JSON FIELDS:\n" +
          JSON.stringify({
            title,
            excerpt: cleanedExcerpt,
            content: cleanedContent,
            seoTitle,
            seoDescription: cleanedSeoDescription,
            seoKeywords,
          }) +
          '\n\nReturn JSON only: {"title":"...","excerpt":"...","content":"...","seoTitle":"...","seoDescription":"...","seoKeywords":"..."}',
      });

      try {
        const revised = JSON.parse(
          (() => {
            const text = revision.output_text || "";
            const start = text.indexOf("{");
            const end = text.lastIndexOf("}");
            if (start === -1 || end === -1 || end <= start) {
              throw new Error("Revision returned no JSON object.");
            }
            return text.slice(start, end + 1);
          })(),
        );
        if (typeof revised.content === "string" && revised.content.trim()) {
          cleanedContent = finalTextCleanup(
            contentSafeNormalizer(encodingNormalizer(revised.content)),
          );
        }
        if (typeof revised.excerpt === "string") {
          cleanedExcerpt = finalTextCleanup(
            encodingNormalizer(revised.excerpt),
          );
        }
        if (typeof revised.title === "string" && revised.title.trim()) {
          title = finalTextCleanup(revised.title);
        }
        if (typeof revised.seoTitle === "string" && revised.seoTitle.trim()) {
          seoTitle = finalTextCleanup(revised.seoTitle);
        }
        if (typeof revised.seoDescription === "string") {
          cleanedSeoDescription = finalTextCleanup(
            encodingNormalizer(revised.seoDescription),
          );
        }
        if (typeof revised.seoKeywords === "string") {
          seoKeywords = finalTextCleanup(revised.seoKeywords);
        }
        articleGrounding = groundDraft({
          title,
          excerpt: cleanedExcerpt,
          content: cleanedContent || "",
        });
      } catch (revisionError) {
        console.error(
          "Grounded revision parse failed; keeping original draft:",
          revisionError,
        );
      }
    }

    let finalContent = cleanedContent;

    if (
      teachingPlan &&
      teachingPlan.requiredChapterKeys.length >= 2 &&
      typeof finalContent === "string" &&
      finalContent.trim().length > 0
    ) {
      let articleCoverage = assessArticleTeachingCoverage(
        finalContent,
        teachingPlan,
      );

      // Mission 006R4: one bounded completeness revision before failing safely.
      if (!articleCoverage.ok) {
        try {
          const completenessRevision = await getOpenAI().responses.create({
            model: "gpt-5.2",
            instructions:
              "You are the Echoes & Visions biblical teaching completeness reviser. " +
              DAVID_WRITING_DNA +
              " Return only valid JSON. No markdown wrapper.",
            input:
              formatMissingCoverageRevisionBrief(teachingPlan, articleCoverage) +
              "\n\n" +
              formatTeachingPlanForPrompt(teachingPlan) +
              "\n\nEVIDENCE-SUPPORTED FACTS (the only factual material you may use):\n" +
              (verifiedFactsText || "None") +
              "\n\nCURRENT DRAFT JSON FIELDS:\n" +
              JSON.stringify({
                title,
                excerpt: cleanedExcerpt,
                content: finalContent,
                seoTitle,
                seoDescription: cleanedSeoDescription,
                seoKeywords,
              }) +
              '\n\nReturn JSON only: {"title":"...","excerpt":"...","content":"...","seoTitle":"...","seoDescription":"...","seoKeywords":"..."}',
          });

          const revisedText = completenessRevision.output_text || "";
          const start = revisedText.indexOf("{");
          const end = revisedText.lastIndexOf("}");
          if (start === -1 || end === -1 || end <= start) {
            throw new Error("Completeness revision returned no JSON object.");
          }
          const revised = JSON.parse(revisedText.slice(start, end + 1));
          if (typeof revised.content === "string" && revised.content.trim()) {
            cleanedContent = finalTextCleanup(
              contentSafeNormalizer(encodingNormalizer(revised.content)),
            );
            finalContent = cleanedContent;
          }
          if (typeof revised.excerpt === "string") {
            cleanedExcerpt = finalTextCleanup(
              encodingNormalizer(revised.excerpt),
            );
          }
          if (typeof revised.title === "string" && revised.title.trim()) {
            title = finalTextCleanup(revised.title);
          }
          if (typeof revised.seoTitle === "string" && revised.seoTitle.trim()) {
            seoTitle = finalTextCleanup(revised.seoTitle);
          }
          if (typeof revised.seoDescription === "string") {
            cleanedSeoDescription = finalTextCleanup(
              encodingNormalizer(revised.seoDescription),
            );
          }
          if (typeof revised.seoKeywords === "string") {
            seoKeywords = finalTextCleanup(revised.seoKeywords);
          }

          articleGrounding = groundDraft({
            title,
            excerpt: cleanedExcerpt,
            content: finalContent || "",
          });
          articleCoverage = assessArticleTeachingCoverage(
            finalContent || "",
            teachingPlan,
          );
        } catch (completenessError) {
          console.error(
            "Teaching completeness revision failed; keeping original draft:",
            completenessError,
          );
        }
      }

      if (!articleCoverage.ok) {
        return NextResponse.json(
          {
            ok: false,
            error: articleCoverage.reason,
            articleUnchanged: true,
            teachingCompleteness: articleCoverage,
            publicationDecision: {
              approved: false,
              status: "blocked",
              reason: articleCoverage.reason,
            },
          },
          { status: 422 },
        );
      }
    }

    const groundedRecommendation =
      articleGrounding?.publicationRecommendation || publicationRecommendation;
    const groundedConsensusScore =
      articleGrounding?.consensusScore ?? consensus.consensusScore;
    const groundedVerified =
      articleGrounding?.verifiedCount ?? factVerification.verifiedCount;
    const groundedPartial =
      articleGrounding?.partiallyVerifiedCount ??
      factVerification.partiallyVerifiedCount;
    const groundedUnverified =
      articleGrounding?.unverifiedCount ?? factVerification.unverifiedCount;
    const groundedAvg =
      articleGrounding?.averageVerificationScore ??
      factVerification.averageVerificationScore;
    const groundedSourceQuality =
      articleGrounding?.sourceQualityScore ?? consensus.sourceQualityScore;
    const groundedFacts =
      articleGrounding?.facts ??
      factVerification.verifiedFacts.filter(
        (fact) =>
          fact.verificationStatus === "verified" ||
          fact.verificationStatus === "partially verified",
      );
    const groundedEvidence =
      articleGrounding?.acceptedEvidence ??
      (Array.isArray(evidence.evidence) ? evidence.evidence : []);

    const baseSlug = slugify(title);
    const slug = await createUniqueSlug(baseSlug, category);

    const wordCount = finalContent
      ? finalContent.split(/\s+/).filter(Boolean).length
      : 0;

    const editorialQuality = calculateEditorialQualityScore({
      wordCount,
      hasTitle: Boolean(title),
      hasExcerpt: Boolean(cleanedExcerpt),
      hasSeoTitle: Boolean(seoTitle),
      hasSeoDescription: Boolean(cleanedSeoDescription || cleanedExcerpt),
      hasFeaturedImage: true,
      consensusScore: groundedConsensusScore,
      verifiedCount: groundedVerified,
      partiallyVerifiedCount: groundedPartial,
      unverifiedCount: groundedUnverified,
      publicationRecommendation: groundedRecommendation,
    });

    const qualityResult = articleQualityScorer({
      title,
      content: finalContent || "",
      faq,
    });

    const seoResult = seoScorer({
      seoTitle,
      seoDescription: cleanedSeoDescription || cleanedExcerpt || "",
      seoKeywords: seoKeywords || "",
    });

    const article = await prisma.$transaction(async (tx) => {
      const createdArticle = await tx.article.create({
        data: {
          title,
          slug,
          category,
          status: "review-required",
          approvedAt: null,
          approvedBy: null,
          excerpt: cleanedExcerpt,
          content: finalContent,
          featuredImage: null,
          seoTitle,
          seoDescription: cleanedSeoDescription || cleanedExcerpt || null,
          seoKeywords,
          publishedAt: null,
          scheduledFor: null,
          editorialScore: editorialQuality.score,
          editorialGrade: editorialQuality.grade,
          editorialWarnings: editorialQuality.warnings,
          qualityScore: qualityResult.score,
          qualityGrade: qualityResult.grade,
          seoScore: seoResult.score,
          seoGrade: seoResult.grade,
        },
      });

      await lockArticleForGovernance(tx, createdArticle.id);

      const audit = await tx.articleResearchAudit.create({
        data: {
          articleId: createdArticle.id,
          sourceCount: sourceCollection.sourceCount,
          averageAuthorityScore: sourceCollection.averageAuthorityScore,
          averageTrustScore: sourceCollection.averageTrustScore,
          researchConfidence: sourceCollection.researchConfidence,
          evidenceCount: groundedEvidence.length,
          factCount: groundedFacts.length,
          verifiedCount: groundedVerified,
          partiallyVerifiedCount: groundedPartial,
          unverifiedCount: groundedUnverified,
          averageVerificationScore: groundedAvg,
          consensusScore: groundedConsensusScore,
          sourceQualityScore: groundedSourceQuality,
          publicationRecommendation: groundedRecommendation,
          sources: sourceCollection.collectedSources,
          evidence: groundedEvidence,
          facts: groundedFacts,
          consensus: {
            groups: consensus.consensusGroups,
            notScoredClaims: articleGrounding?.extraction.notScoredClaims ?? [],
            articleGrounded: true,
            engineRevision: revisionWrittenByEditorialPrepare(),
          },
          ...(versionedEnabled && articleGrounding?.specificationVersion
            ? {
                specificationVersion: articleGrounding.specificationVersion,
                disputes: articleGrounding.disputes ?? [],
              }
            : {}),
        },
      });

      const sourceMutation = await applyArticleSourceMutationInTransaction(
        tx as never,
        {
          articleId: createdArticle.id,
          operation: "replace",
          sources: (sourceCollection.collectedSources || []).map((source) => ({
            title: source.title || null,
            url: source.url || null,
            publisher: null,
            authorityScore: source.authorityScore || 0,
            trustScore: source.trustScore || 0,
            sourceType: source.sourceType || null,
            category,
          })),
        },
      );
      if (!sourceMutation.ok) {
        throw new Error(sourceMutation.error);
      }

      if (groundedFacts.length > 0) {
        await tx.researchFact.createMany({
          data: groundedFacts.map((fact) => ({
            articleId: createdArticle.id,
            claim: fact.claim || "",
            verificationStatus: fact.verificationStatus || "unverified",
            confidence: fact.confidence || null,
            supportingSources: fact.supportingSources || [],
            category,
          })),
        });
      }

      const contentFingerprint = computeArticleAuditFingerprint(
        createdArticle,
        (sourceCollection.collectedSources || [])
          .map((source) => source.url)
          .filter((url): url is string => Boolean(url)),
      );
      await tx.articleReviewNote.create({
        data: {
          articleId: createdArticle.id,
          reviewer: "system",
          action: RESEARCH_AUDIT_FINGERPRINT_ACTION,
          note: serializeArticleAuditAssociation({
            auditId: audit.id,
            contentFingerprint,
            createdAt: audit.createdAt,
          }),
        },
      });

      return createdArticle;
    }, { timeout: 10_000 });

    let updatedArticle = article;

    try {
      const imageData = await generateAndPersistFeaturedImage({
        articleId: article.id,
      });

      if (imageData.ok && imageData.article && !imageData.articleUnchanged) {
        updatedArticle = imageData.article as unknown as typeof updatedArticle;
      }
    } catch (imageError) {
      console.error(
        "Article created, but featured image generation failed:",
        imageError,
      );
    }

    const editorialWarning =
      groundedRecommendation === "blocked" ||
      groundedUnverified > 0
        ? "Article-grounded verification found unsupported or incomplete evidence. The article was saved as review-required for human editorial review."
        : null;

    return NextResponse.json({
      ok: true,
      article: updatedArticle,
      qualityScore: qualityResult.score,
      qualityGrade: qualityResult.grade,
      qualityChecks: qualityResult.checks,
      seoScore: seoResult.score,
      seoGrade: seoResult.grade,
      seoChecks: seoResult.checks,
      researchAudit: {
        sourceCount: sourceCollection.sourceCount,
        averageAuthorityScore: sourceCollection.averageAuthorityScore,
        averageTrustScore: sourceCollection.averageTrustScore,
        researchConfidence: sourceCollection.researchConfidence,
        evidenceCount: groundedEvidence.length,
        factCount: groundedFacts.length,
        extractedFactCount: factExtraction.factCount,
        verifiedCount: groundedVerified,
        averageVerificationScore: groundedAvg,
        partiallyVerifiedCount: groundedPartial,
        unverifiedCount: groundedUnverified,
        consensusScore: groundedConsensusScore,
        sourceQualityScore: groundedSourceQuality,
        publicationRecommendation: groundedRecommendation,
        publicationDecision,
        articleGrounded: true,
        specificationVersion: articleGrounding?.specificationVersion ?? null,
        editorialWarning,
        editorialQuality,
      },
    });
  } catch (error) {
    console.error("AI article generation failed:", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Failed to generate article",
      },
      { status: 500 },
    );
  }
}
