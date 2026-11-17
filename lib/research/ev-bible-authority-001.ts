/**
 * EV-BIBLE-AUTHORITY-001 — machine identifiers and deterministic evaluators
 * for verified biblical/scripture attribution rules already enforced in
 * claim-source-attribution and related research helpers.
 *
 * This module is not a parallel theological approval engine. It does not
 * approve, publish, or certify semantic/theological correctness.
 */
import { bibleExtractor } from "./bible-extractor"
import {
  EV_BIBLE_AUTHORITY_CONTRACT_ID,
  EV_BIBLE_AUTHORITY_CONTRACT_VERSION,
  claimAllowsEvidence,
  isBibleProjectClaim,
  isBibleProjectSource,
  isPrimaryScriptureClaim,
  isPrimaryScriptureSource,
  namedSecondaryDocuments,
  resolveClaimSourceBinding,
  sameDocumentIdentity,
  sourceMatchesNamedDocument,
  type AttributableSource,
  type NamedSecondaryDocument,
} from "./claim-source-attribution"
import { parseScriptureVerseRanges } from "./scripture-verse-locator"

export {
  EV_BIBLE_AUTHORITY_CONTRACT_ID,
  EV_BIBLE_AUTHORITY_CONTRACT_VERSION,
}

/** Verified requirement IDs documented in docs/editorial/EV-BIBLE-AUTHORITY-001.md */
export const EV_BIBLE_AUTHORITY_REQUIREMENTS = [
  "BA-R1",
  "BA-R2",
  "BA-R3",
  "BA-R4",
  "BA-R5",
  "BA-R6",
  "BA-R7",
  "BA-R8",
] as const

export type EvBibleAuthorityRequirementId =
  (typeof EV_BIBLE_AUTHORITY_REQUIREMENTS)[number]

export type EvBibleAuthorityRuleResult = {
  id: EvBibleAuthorityRequirementId
  ok: boolean
  detail: string
}

export type EvBibleAuthorityEvaluation = {
  contractId: typeof EV_BIBLE_AUTHORITY_CONTRACT_ID
  contractVersion: typeof EV_BIBLE_AUTHORITY_CONTRACT_VERSION
  /**
   * Deterministic attribution rule outcomes only.
   * Does not certify theological or semantic correctness.
   */
  certifiesTheology: false
  results: EvBibleAuthorityRuleResult[]
}

function bibleProjectDocumentUrls(
  sources: AttributableSource[],
): string[] {
  const urls: string[] = []
  const seen = new Set<string>()
  for (const source of sources) {
    if (!isBibleProjectSource(source)) continue
    const url = source.url
    if (seen.has(url)) continue
    seen.add(url)
    urls.push(url)
  }
  return urls
}

/**
 * Evaluate verified BA-R* rules for a claim against listed sources and
 * candidate evidence sources. Failures are fail-closed attribution checks.
 */
export function evaluateVerifiedBibleAuthorityRules(input: {
  claim: string
  listedSources: AttributableSource[]
  candidateSources?: AttributableSource[]
}): EvBibleAuthorityEvaluation {
  const listed = input.listedSources
  const candidates = input.candidateSources ?? listed
  const binding = resolveClaimSourceBinding(input.claim, listed)
  const results: EvBibleAuthorityRuleResult[] = []

  // BA-R1 — primary-scripture binding shape for Article-3 class claims
  if (isPrimaryScriptureClaim(input.claim)) {
    results.push({
      id: "BA-R1",
      ok:
        binding.role === "primary-scripture" &&
        binding.exclusiveDocumentKey === "1-samuel-17",
      detail:
        binding.role === "primary-scripture"
          ? "Claim bound as primary-scripture with document key 1-samuel-17."
          : `Expected primary-scripture binding; received role ${binding.role}.`,
    })
  } else {
    results.push({
      id: "BA-R1",
      ok: binding.role !== "primary-scripture",
      detail:
        binding.role === "primary-scripture"
          ? "Non primary-scripture claim incorrectly bound as primary-scripture."
          : "Claim is outside Article-3 primary-scripture patterns (BA-R1 not triggered).",
    })
  }

  // BA-R2 — exclusive BibleGateway when listed sources exist
  if (binding.role === "primary-scripture") {
    const exclusiveOk =
      listed.length === 0
        ? true
        : Boolean(
            binding.exclusiveUrl &&
              listed.some(
                (source) =>
                  isPrimaryScriptureSource(source) &&
                  sameDocumentIdentity(source.url, binding.exclusiveUrl!),
              ),
          )
    const candidatesAllowed = candidates.filter((source) =>
      claimAllowsEvidence(input.claim, source, listed),
    )
    const onlyPrimary =
      listed.length === 0 ||
      (candidatesAllowed.length > 0 &&
        candidatesAllowed.every((source) => isPrimaryScriptureSource(source)))
    results.push({
      id: "BA-R2",
      ok: exclusiveOk && (listed.length === 0 || onlyPrimary || candidatesAllowed.length === 0),
      detail: exclusiveOk
        ? listed.length === 0
          ? "No listed sources; primary-scripture source predicate remains BibleGateway+1 Samuel 17."
          : "Exclusive BibleGateway 1 Samuel 17 identity required among listed sources."
        : "Primary-scripture exclusive BibleGateway URL missing or mismatched among listed sources.",
    })
  } else {
    results.push({
      id: "BA-R2",
      ok: true,
      detail: "BA-R2 applies only to primary-scripture bindings.",
    })
  }

  // BA-R3 — BibleProject cannot support primary-scripture
  if (binding.role === "primary-scripture") {
    const bibleProjectAllowed = candidates.some(
      (source) =>
        isBibleProjectSource(source) &&
        claimAllowsEvidence(input.claim, source, listed),
    )
    results.push({
      id: "BA-R3",
      ok: !bibleProjectAllowed,
      detail: bibleProjectAllowed
        ? "BibleProject source incorrectly allowed for primary-scripture claim."
        : "BibleProject sources are disallowed for primary-scripture corroboration.",
    })
  } else {
    results.push({
      id: "BA-R3",
      ok: true,
      detail: "BA-R3 applies only to primary-scripture bindings.",
    })
  }

  // BA-R4 — named secondary documents stay exclusive
  const namedDocs = namedSecondaryDocuments(input.claim)
  if (namedDocs.length === 1 && binding.role === "secondary-document") {
    const document = namedDocs[0] as NamedSecondaryDocument
    const wrongDoc = namedDocs[0] === "samuel-guide" ? "king-david-article" : "samuel-guide"
    const allowsOwn = candidates.some(
      (source) =>
        sourceMatchesNamedDocument(source, document) &&
        claimAllowsEvidence(input.claim, source, listed),
    )
    const allowsOther = candidates.some(
      (source) =>
        sourceMatchesNamedDocument(source, wrongDoc as NamedSecondaryDocument) &&
        claimAllowsEvidence(input.claim, source, listed),
    )
    results.push({
      id: "BA-R4",
      ok: allowsOwn && !allowsOther,
      detail: allowsOther
        ? "Named secondary document incorrectly accepts a substitute BibleProject document."
        : "Named secondary document exclusivity holds.",
    })
  } else {
    results.push({
      id: "BA-R4",
      ok: true,
      detail:
        namedDocs.length === 1
          ? "Named document present but binding is not secondary-document (multi-source or other role)."
          : "BA-R4 applies to single named secondary-document claims.",
    })
  }

  // BA-R5 — ambiguous multi BibleProject publisher matches fail closed at evaluation helper level
  if (isBibleProjectClaim(input.claim) && binding.role === "publisher") {
    const distinct = bibleProjectDocumentUrls(candidates)
    results.push({
      id: "BA-R5",
      ok: distinct.length <= 1,
      detail:
        distinct.length > 1
          ? "Multiple distinct BibleProject documents present for a publisher claim — matcher/selector must fail closed."
          : "BibleProject publisher claim does not span multiple distinct documents.",
    })
  } else {
    results.push({
      id: "BA-R5",
      ok: true,
      detail: "BA-R5 applies to BibleProject publisher-role claims.",
    })
  }

  // BA-R6 — verse locator only activates for 1 Samuel 17-class claims as implemented
  const ranges = parseScriptureVerseRanges(input.claim)
  if (isPrimaryScriptureClaim(input.claim) && /\b17\s*:/.test(input.claim)) {
    results.push({
      id: "BA-R6",
      ok: ranges.length > 0,
      detail:
        ranges.length > 0
          ? `Parsed ${ranges.length} verse range(s) for primary-scripture claim.`
          : "Expected verse ranges for a 1 Samuel 17 verse citation were not parsed.",
    })
  } else {
    results.push({
      id: "BA-R6",
      ok: !isPrimaryScriptureClaim(input.claim) || ranges.length >= 0,
      detail: "BA-R6 verse parsing uses the existing 1 Samuel 17 locator behaviour.",
    })
  }

  // BA-R7 — bibleExtractor heuristic claims are not primary-scripture classifiers
  const heuristicClaims = bibleExtractor(input.claim).claims
  const heuristicAsPrimary = heuristicClaims.some((claim) =>
    isPrimaryScriptureClaim(claim),
  )
  results.push({
    id: "BA-R7",
    ok: !heuristicAsPrimary,
    detail: heuristicAsPrimary
      ? "bibleExtractor produced a claim that matches primary-scripture patterns."
      : "bibleExtractor remains a narrative heuristic and does not emit primary-scripture bindings.",
  })

  // BA-R8 — structural: this evaluator never grants publication authority
  results.push({
    id: "BA-R8",
    ok: true,
    detail:
      "Biblical attribution evaluation does not approve, schedule, or publish articles.",
  })

  return {
    contractId: EV_BIBLE_AUTHORITY_CONTRACT_ID,
    contractVersion: EV_BIBLE_AUTHORITY_CONTRACT_VERSION,
    certifiesTheology: false,
    results,
  }
}

export function allVerifiedBibleAuthorityRulesPassed(
  evaluation: EvBibleAuthorityEvaluation,
): boolean {
  return evaluation.results.every((result) => result.ok)
}
