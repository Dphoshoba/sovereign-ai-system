/**
 * Re-evaluate evidenceState on a current EV-REG-SPEC-1.1.0 audit from stored
 * evidence passages. Does not change verification scores, consensus, or
 * source-quality.
 *
 * Caller: app/api/articles/reclassify-evidence-states/route.ts
 * Reads: ArticleResearchAudit.facts/evidence
 * Writes: facts.evidenceState only + ArticleReviewNote
 * No existing module refreshes evidenceState without a new Prepare.
 *
 * User instruction: repair confirmed implementation defects within governance;
 * do not manipulate scores; complete fresh assessment then publish if eligible.
 */
import { prisma } from "@/lib/prisma"
import { isEvReg110Audit } from "./primary-source-publication"
import {
  evaluateVersionedClaim,
  type VersionedPassage,
} from "./versioned-evidence"

export async function reclassifyAuditEvidenceStates(input: {
  articleId: string
  auditId: string
  actor: string
}): Promise<
  | { ok: true; updated: number; auditId: string }
  | { ok: false; code: "not_found" | "invalid_audit"; error: string }
> {
  const audit = await prisma.articleResearchAudit.findFirst({
    where: { id: input.auditId, articleId: input.articleId },
  })
  if (!audit) {
    return { ok: false, code: "not_found", error: "Audit not found." }
  }
  if (!isEvReg110Audit(audit.specificationVersion)) {
    return {
      ok: false,
      code: "invalid_audit",
      error: "Only EV-REG-SPEC-1.1.0 audits can be reclassified.",
    }
  }
  if (!Array.isArray(audit.facts) || !Array.isArray(audit.evidence)) {
    return {
      ok: false,
      code: "invalid_audit",
      error: "Audit facts or evidence are missing.",
    }
  }

  const evidenceRows = audit.evidence as Array<Record<string, unknown>>
  let updated = 0
  const nextFacts = (audit.facts as Array<Record<string, unknown>>).map(
    (fact) => {
      const claim = typeof fact.claim === "string" ? fact.claim : ""
      const supporting = Array.isArray(fact.supportingSources)
        ? fact.supportingSources
        : []
      const passages: VersionedPassage[] = []
      for (const source of supporting) {
        if (!source || typeof source !== "object") continue
        const url = (source as { sourceUrl?: unknown }).sourceUrl
        const evidenceId = (source as { evidenceId?: unknown }).evidenceId
        if (typeof url !== "string") continue
        const evidence =
          evidenceRows.find((row) => row.id === evidenceId) ??
          evidenceRows.find((row) => row.sourceUrl === url)
        const passageText =
          typeof evidence?.extractedText === "string"
            ? evidence.extractedText
            : typeof fact.evidenceText === "string"
              ? fact.evidenceText
              : ""
        if (!passageText) continue
        passages.push({
          url,
          passage: passageText,
          polarity: "supports",
          title:
            typeof evidence?.sourceTitle === "string"
              ? evidence.sourceTitle
              : null,
        })
      }
      if (passages.length === 0 || !claim) return fact
      const versioned = evaluateVersionedClaim({ claim, passages })
      if (fact.evidenceState === versioned.evidenceState) return fact
      updated += 1
      return {
        ...fact,
        evidenceState: versioned.evidenceState,
      }
    },
  )

  await prisma.$transaction(async (tx) => {
    await tx.articleResearchAudit.update({
      where: { id: audit.id },
      data: { facts: nextFacts as object[] },
    })
    await tx.articleReviewNote.create({
      data: {
        articleId: input.articleId,
        action: "evidence-state-reclassify",
        reviewer: input.actor,
        note: JSON.stringify({
          auditId: audit.id,
          updated,
          reason:
            "Refresh evidenceState after exclusive-primary classification fix",
        }),
      },
    })
  })

  return { ok: true, updated, auditId: audit.id }
}
