/**
 * EV-ENG-01 P0 — offline Mode A / Mode B baseline reproduction (no Prod).
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { consensusEngine } from "../../lib/research/consensus-engine";
import { assessPassageSupport } from "../../lib/research/article-claim-extractor";
import {
  isPrimaryScriptureClaim,
  resolveClaimSourceBinding,
  evidenceCorroborationKey,
  independentDocumentKey,
} from "../../lib/research/claim-source-attribution";
import { scriptureCanonicalIdentity } from "../../lib/research/biblical-editorial-evidence-profile";
import type { VerifiedFact } from "../../lib/research/fact-verification-engine";

function fact(partial: Partial<VerifiedFact> & Pick<VerifiedFact, "claim" | "sourceUrl">): VerifiedFact {
  return {
    evidenceId: "",
    sourceTitle: "",
    sourceType: "primary-scripture",
    evidenceText: "",
    confidence: "medium",
    requiresHumanReview: true,
    articleExcerpt: "",
    articleSection: "body",
    blockType: "paragraph",
    verificationCount: 1,
    verificationStatus: "partially verified",
    verificationMethod: "single-source-supported",
    supportingSources: [],
    similarityMatches: [],
    verificationScore: 60,
    ...partial,
  };
}

const gwCol =
  "https://www.biblegateway.com/passage/?search=Colossians%203%3A23-24&version=ESV";
const hubCol = "https://biblehub.com/esv/colossians/3.htm";
const gwThess =
  "https://www.biblegateway.com/passage/?search=1%20Thessalonians%204%3A11-12&version=ESV";
const hubThess = "https://biblehub.com/esv/1_thessalonians/4.htm";

const staleFacts: VerifiedFact[] = [
  fact({
    claim:
      "According to Colossians 3 (ESV) Bible Gateway, faith and courage in ordinary labour for the Lord",
    sourceUrl: gwCol,
    supportingSources: [
      { sourceUrl: gwCol, sourceTitle: "Col Gateway", evidenceId: "1" },
    ],
  }),
  fact({
    claim:
      "According to Colossians 3 (ESV) Bible Hub, faith and courage in ordinary labour for the Lord",
    sourceUrl: hubCol,
    supportingSources: [
      { sourceUrl: hubCol, sourceTitle: "Col Hub", evidenceId: "2" },
    ],
  }),
  fact({
    claim:
      "According to 1 Thessalonians 4 (ESV) Bible Gateway, aspire to live quietly and work with your hands",
    sourceUrl: gwThess,
    supportingSources: [
      { sourceUrl: gwThess, sourceTitle: "Thess Gateway", evidenceId: "3" },
    ],
  }),
  fact({
    claim:
      "According to 1 Thessalonians 4 (ESV) Bible Hub, aspire to live quietly and work with your hands",
    sourceUrl: hubThess,
    supportingSources: [
      { sourceUrl: hubThess, sourceTitle: "Thess Hub", evidenceId: "4" },
    ],
  }),
];

const staleConsensus = consensusEngine(staleFacts);

const esvColPassage =
  "Whatever you do, work heartily, as for the Lord and not for men, knowing that from the Lord you will receive the inheritance as your reward. You are serving the Lord Christ.";

const freshClaimExact =
  "Paul speaks inside household instructions, addressing bondservants and then masters: “Bondservants, obey in everything those who are your earthly masters, not by way of eye-service, as people-pleasers, but with sincerity of heart, fearing the Lord. Whatever you do, work heartily, as for the Lord and not for men, knowing that from the Lord you will receive the inheritance as your reward. You are serving the Lord Christ. For the wrongdoer will be paid back for the wrong he has done, and there is no partiality. Masters, treat your bondservants justly and fairly, knowing that you also have a Master in heaven” (Colossians 3:22–25; 4:1, ESV).";

const freshClaimShort =
  "“Whatever you do, work heartily, as for the Lord and not for men, knowing that from the Lord you will receive the inheritance as your reward. You are serving the Lord Christ” (Colossians 3:23-24, ESV).";

const supportLong = assessPassageSupport(freshClaimExact, esvColPassage, {
  documentKind: "html",
});
const supportShort = assessPassageSupport(freshClaimShort, esvColPassage, {
  documentKind: "html",
});
const supportMark = assessPassageSupport(
  "Even the Lord Jesus was known in His hometown as “the carpenter” (Mark 6:3, ESV).",
  "Is not this the carpenter, the son of Mary and brother of James and Joses and Judas and Simon? And are not his sisters here with us?",
  { documentKind: "html" },
);
const supportChrome = assessPassageSupport(
  "“The Lord God took the man and put him in the garden of Eden to work it and keep it” (Genesis 2:15, ESV).",
  "Please enable JavaScript. Cookie settings. Skip to main content. Privacy policy. Subscribe to our newsletter.",
  { documentKind: "html" },
);

const emptyFacts = Array.from({ length: 9 }, (_, i) =>
  fact({
    claim: `Unverified claim ${i + 1}`,
    sourceUrl: "",
    verificationStatus: "unverified",
    verificationCount: 0,
    verificationScore: 0,
    supportingSources: [],
    requiresHumanReview: true,
  }),
);
const freshConsensus = consensusEngine(emptyFacts);

const listed = [
  { url: gwCol, title: "Colossians 3:22-25; 4:1 (ESV) Bible Gateway" },
  { url: hubCol, title: "Colossians 3 (ESV) Bible Hub" },
];

const out = {
  baselineCommit: "918b8447",
  modeA: {
    consensusScore: staleConsensus.consensusScore,
    sourceQualityScore: staleConsensus.sourceQualityScore,
    publicationRecommendation: staleConsensus.publicationRecommendation,
    verifiedFacts: staleConsensus.verifiedFacts,
    partiallyVerifiedFacts: staleConsensus.partiallyVerifiedFacts,
    groups: staleConsensus.consensusGroups.map((g) => ({
      theme: g.theme,
      sourceCount: g.sourceCount,
      sourceQualityScore: g.sourceQualityScore,
      factCount: g.facts.length,
    })),
    keys: {
      gwIndependent: independentDocumentKey(gwCol),
      hubIndependent: independentDocumentKey(hubCol),
      gwIdentity: scriptureCanonicalIdentity({ url: gwCol, title: "ESV" }),
      hubIdentity: scriptureCanonicalIdentity({ url: hubCol, title: "ESV" }),
      gwCorroboration: evidenceCorroborationKey(
        "According to Colossians 3",
        { url: gwCol },
        listed,
      ),
      hubCorroboration: evidenceCorroborationKey(
        "According to Colossians 3",
        { url: hubCol },
        listed,
      ),
      distinctIndependent:
        independentDocumentKey(gwCol) !== independentDocumentKey(hubCol),
    },
  },
  modeB: {
    supportLong,
    supportShort,
    supportMark,
    supportChrome,
    freshConsensus: {
      consensusScore: freshConsensus.consensusScore,
      sourceQualityScore: freshConsensus.sourceQualityScore,
      publicationRecommendation: freshConsensus.publicationRecommendation,
      unverifiedFacts: freshConsensus.unverifiedFacts,
    },
    bindingShort: resolveClaimSourceBinding(freshClaimShort, listed),
    isPrimaryShort: isPrimaryScriptureClaim(freshClaimShort),
    isPrimarySamuel: isPrimaryScriptureClaim(
      "According to 1 Samuel 17, David kept sheep.",
    ),
  },
};

mkdirSync("ops/ev-eng-01/var", { recursive: true });
writeFileSync(
  "ops/ev-eng-01/var/p0-baseline-repro.json",
  JSON.stringify(out, null, 2),
);
console.log(JSON.stringify(out, null, 2));
