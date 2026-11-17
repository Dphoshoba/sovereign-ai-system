# EV-BIBLE-AUTHORITY-001 — Biblical / scripture authority contract

**Contract ID:** `EV-BIBLE-AUTHORITY-001`  
**Version:** `1.0.0`  
**Status:** Version-controlled documentation of **verified in-repo behaviour**  
**Programme:** M2-P3 Biblical Authority Governance  
**Authority source:** Existing research attribution and Article-3 regression tests in this repository — not a new theological doctrine file.

This contract does **not** invent new theology. It binds a stable identifier to controls that already exist in code and tests. Automation may prove deterministic attribution rules; it does **not** certify semantic or theological correctness by itself. Human research audit and human editorial approval remain required before publication.

## Scope

Applies to research evidence attribution for scripture-related claims during article-grounded research audit preparation. It does **not**:

- replace research audit fingerprint association
- replace human article approval
- replace publication guards (`publish-ready` consensus / source quality)
- create a parallel “theological approval” engine
- auto-approve, schedule, publish, or socially distribute content

## Verified requirements (implemented in code)

These requirements are grounded in current repository behaviour and regression coverage (especially `lib/research/claim-source-attribution.ts`, `scripture-verse-locator.ts`, `claim-evidence-matcher.ts`, `claim-evidence-selector.ts`, and `tests/editorial/research-audit-article-3-*`).

| ID | Requirement | Evidence in code |
| --- | --- | --- |
| **BA-R1** | A **primary-scripture** claim (Article-3 class: “According to 1 Samuel 17…”, “The narrative in 1 Samuel 17…”, “1 Samuel 17 states/describes/says/records…”) binds with role `primary-scripture` and exclusive document key `1-samuel-17`. | `resolveClaimSourceBinding`, `isPrimaryScriptureClaim` |
| **BA-R2** | When listed sources are present, a primary-scripture claim may accept evidence **only** from the exclusive BibleGateway 1 Samuel 17 source identity. Missing exclusive URL ⇒ evidence disallowed (fail closed). | `isPrimaryScriptureSource`, `claimAllowsEvidence` |
| **BA-R3** | BibleProject sources must **not** verify or corroborate a primary-scripture claim. | `claimAllowsEvidence` + Article-3 source-identity tests |
| **BA-R4** | Named secondary BibleProject documents are distinct: Samuel guide vs King David article bind exclusively to their own document identities and must not substitute for each other. | `namedSecondaryDocuments`, `sourceMatchesNamedDocument` |
| **BA-R5** | Ambiguous BibleProject publisher attribution across multiple distinct bibleproject.com documents fails closed (no combined corroboration). | `dropAmbiguousBibleProjectMatches` / `disambiguatePublisherMatches` |
| **BA-R6** | Verse-window extraction for primary-scripture claims uses `scripture-verse-locator` against 1 Samuel 17 ranges only as implemented today. | `parseScriptureVerseRanges`, `locateVerseWindows` |
| **BA-R7** | `bibleExtractor` is a **David/Goliath narrative heuristic** for bible-category fact seeding. It is **not** a scripture authority registry and does not assign `primary-scripture` role by itself. | `lib/research/bible-extractor.ts`, `fact-extractor.ts` |
| **BA-R8** | Biblical attribution rules operate inside research evidence matching. They do **not** bypass prepare-for-review, human approve, or publication guards. | Publishing lifecycle + research prepare path unchanged by this contract |

Machine-readable identifiers for these rules live in `lib/research/ev-bible-authority-001.ts`.

## Proposed Director decisions (not established — do not implement as policy yet)

The following are **gaps or open questions**. They are recorded for Director decision and must not be treated as certified requirements until approved:

1. **General scripture coverage:** Whether primary-scripture patterns should expand beyond 1 Samuel 17 / Article-3 class claims to other books, chapters, and citation phrasings.
2. **Allowed primary hosts:** Whether hosts other than BibleGateway (e.g. Bible Hub, Blue Letter Bible present in fallback lists) may ever satisfy `primary-scripture` for any passage.
3. **Translation policy:** Whether a specific translation (e.g. KJV only) is mandatory for primary-scripture sources.
4. **bibleExtractor generalisation:** Whether narrative heuristics should be replaced or constrained so heuristic claims cannot remain freely `unattributed`.
5. **Separate theological review gate:** Whether Directors want an additional human “biblical review” transition beyond research audit + editorial approval.
6. **Multi-source scripture+commentary claims:** Broader rules for explicit multi-source claims beyond the current narrow “According to 1 Samuel 17 … and … BibleProject” pattern.
7. **Contract registry placement:** Whether EV-BIBLE-AUTHORITY-001 should later join a formal EV-REG programme catalogue UI alongside `EV-REG-SPEC-1.1.0` (now present as a provenance reconciliation spec; still **not** a shared runtime registry engine). Deferred biblical decisions in this file remain unchanged.

## Compliance statement for automation

Passing EV-BIBLE-AUTHORITY-001 deterministic tests means the **attribution exclusivity rules** hold for the covered fixtures and helpers. It does **not** mean an article’s theology, pastoral application, or interpretive accuracy has been certified.
