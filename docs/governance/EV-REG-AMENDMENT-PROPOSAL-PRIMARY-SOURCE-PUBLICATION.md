# EV-REG Amendment Proposal — Authoritative Primary-Source Publication Pathway

**Status:** APPROVED — Director Option A with §3.4 redline (2026-11-16); implemented as `EV-REG-SPEC-1.1.0`
**Date:** 2026-11-16
**Triggered by:** Mission 004 + Director publication authorisation for article `cmqrvyx860000ycun5wo9ny8c`
**Governing baseline:** `docs/governance/EV-REG-SPEC-1.0.0.md` (certified; immutable)
**Adopted amendment:** `docs/governance/EV-REG-SPEC-1.1.0.md`
**Supersedes:** 1.0.0 publication effect for primary-source claims **only on 1.1.0 audits** after implementing release verification
**Linked from:** `progress.md` (Mission 004 addendum / publication decision boundary)
**User instruction (verbatim excerpt):** "If the certified contract requires two independent publishers without exception, do not bypass that requirement. Instead, prepare a specific governance amendment for Director approval..." / "Do not deploy a governance amendment without explicit approval of its terms." / "If a new governance decision is required, stop at that decision boundary and present the exact issue rather than starting another engineering mission."
**This document does not change Production behaviour until separately approved and implemented.**

---

## 1. Exact blocker (current certified contract)

Article **AI Automation for Creators: Build Your First Workflow in 7 Days** (`cmqrvyx860000ycun5wo9ny8c`) is human-reviewed and Director-authorised for publication, but Production cannot complete the governed publish workflow under EV-REG-SPEC-1.0.0.

### Live Production evidence (read-only, 2026-11-16)

| Field | Value |
|---|---|
| Status | `review-required` |
| Content SHA-256 | `9D426B5962C5C82160BC9B13234716A4B7EE27C6C097A2CF40A062C37BD052F2` |
| Current audit | `cmwilpof2000008l9xoo7jwg5` |
| Recommendation | `review-required` |
| Consensus / source quality / avg verification | 78 / 83 / 47 |
| Verified / partial / unverified | 0 / 6 / 1 |

Claim pattern:

- **6 claims** — vendor product or NIST risk naming facts supported by **one** exclusive primary publisher (`single-source-supported` / partially verified). These are the intended class of “authoritative primary source” statements about Zapier’s own docs or NIST’s own profile.
- **1 claim** — interpretive NIST framing still stored as unverified on this pre–Mission-004 audit. Mission 004 code on Production now classifies that pattern as **authorial** on a fresh Prepare; clearing it alone does **not** unlock `publish-ready` while the six single-source claims remain.

### Certified rules that block publication

From EV-REG-SPEC-1.0.0:

- §4.3 Primary-source supported: *“There is no primary-source exception that permits publication.”*
- §9 Human confirmation: confirmation **does not** promote primary-source supported to independently corroborated and **does not** make the article publish-ready.
- §11: *“There is no primary-source exception that permits publication.”* Single-source count must be 0; primary-source supported counts as single-source.
- Application guard (`lib/publishing/publication-guard.ts`) requires recommendation exactly `publish-ready` and rejects `single-source-supported` facts.

**Conclusion:** No compliant pathway exists today to publish a correctly evidenced vendor-doc tutorial under the certified contract without either (a) inventing a second independent publisher (forbidden) or (b) bypassing the publication guard (forbidden). This is a **governance contract gap**, not a remaining Mission 004 engineering defect.

---

## 2. Proposed amendment purpose

Allow **narrow, auditable** publication eligibility when every remaining scored factual claim is either:

1. **Independently corroborated** (unchanged), or
2. **Primary-source supported** under the exclusive primary-source classes already defined in §4.3 / §6, **and** a recorded human editorial confirmation exists for that claim,

while continuing to **block** unsupported, disputed, high-risk, and non-exclusive single-source claims.

---

## 3. Proposed terms (for Director approval)

### 3.1 When authoritative primary-source documentation is sufficient

A scored factual claim may satisfy the per-claim corroboration requirement for `publish-ready` when **all** of the following hold:

1. Machine state is **primary-source supported** under EV-REG §4.3 (exactly one canonical publisher; exclusive primary source).
2. The substantiating document is one of:
   - the vendor’s own product / API documentation for a product-behaviour claim about that vendor, or
   - authoritative official guidance issued by the body whose guidance the claim states, or
   - the cited scripture edition for scripture claims.
3. The claim is **not** disputed (§4.5 / §7).
4. A **human editorial confirmation record** exists for that claim on the current audit (§3.3).
5. The claim does **not** assert measured outcomes, third-party performance comparisons, prevalence statistics, or causal effects beyond what the primary document states.

### 3.2 When independent corroboration remains mandatory

Independent corroboration (two different canonical publishers) remains mandatory when any of the following apply:

1. The claim attributes a fact to more than one organisation, or is unattributed general knowledge.
2. The claim asserts statistics, study results, market size, productivity gains, or other measured outcomes.
3. The claim compares vendors, products, or APIs across organisations.
4. The claim relies on commentary, secondary reporting, mirrors, or non-primary pages.
5. The exclusive primary-source test fails (support is ordinary partial / single-source, not primary-source supported).
6. Any unresolved or expired dispute applies.

### 3.3 How human editorial decisions are recorded

For each primary-source-supported claim used under §3.1, the current versioned audit must store confirmation metadata that includes at least:

| Field | Requirement |
|---|---|
| `claimId` / claim text checksum | Ties confirmation to the exact scored claim |
| `decision` | `confirmed` \| `declined` |
| `decidedBy` | Authenticated editor identity |
| `decidedAt` | UTC timestamp |
| `primarySourceUrl` | Exact substantiating URL |
| `rationale` | Short human reason (no score editing) |
| `auditId` | Current `ArticleResearchAudit` id |

Rules:

- Confirmation is recorded through an authenticated editorial API/UI action — **not** by editing audit scores or writing SQL.
- `declined` keeps the claim blocking publication.
- Confirmation on a stale audit is void; a new Prepare invalidates prior confirmations for changed claims.
- Confirmation never changes `verificationScore` fields; it only satisfies the **eligibility** rule for primary-source-supported claims under this amendment.

### 3.4 How evidence and exceptions are audited

**Director redline (approved 2026-11-16):**

For claims eligible under the authoritative primary-source pathway, publication eligibility must be determined by complete primary-document support, claim classification and valid editorial confirmation.

The verifier must retain and report the original consensus, source-quality and verification scores without alteration.

Numerical thresholds designed to measure independent corroboration must not independently disqualify a properly confirmed primary-source claim merely because a second publisher is absent.

For claims requiring independent corroboration, retain the existing certified thresholds.

For articles containing both claim categories, every factual claim must independently satisfy its applicable pathway. Any unsupported, disputed or unconfirmed factual claim blocks publication.

Operational rules:

1. Prepare continues to produce machine states under EV-REG (unsupported / partial / primary-source supported / independently corroborated / disputed).
2. `publish-ready` under EV-REG-SPEC-1.1.0 requires:
   - source quality ≥ 70,
   - zero unsupported / disputed / ordinary-partial / unconfirmed primary-source claims,
   - every scored claim either independently corroborated **or** primary-source supported with a valid confirmation record,
   - when any claim uses the independent pathway: consensus ≥ 80 and average verification ≥ 80,
   - current revision-matched audit,
   - separate article-level Approve after that audit.
3. The publication guard must fail closed if confirmation metadata is missing, malformed, or bound to a different audit/claim text.
4. Historical audits without confirmation metadata remain judged under EV-REG-SPEC-1.0.0 (no silent backfill).

### 3.5 How unsupported or high-risk claims remain blocked

Unchanged hard blocks:

- `unverified` / unsupported claims
- disputed claims
- missing substantiating URL
- unscored eligible factual claims
- single-source claims that are **not** exclusive primary-source supported
- primary-source-supported claims without confirmation
- security / auth / lifecycle guards (Approve → schedule/publish still separate; no cron force-publish; no DB lifecycle bypass)

---

## 4. Effect on the AI Automation article (if approved and implemented)

| Claim class | Expected path |
|---|---|
| Zapier product / API facts (5) | Primary-source supported + human confirm → eligible |
| NIST risk-name fact (1) | Primary-source supported (NIST) + human confirm → eligible |
| Interpretive “practical response” claim | Authorial (Mission 004) → not a scored factual blocker after fresh Prepare |
| Fabricated second publishers | Still forbidden |

Until this amendment is **approved and implemented**, Production must continue to refuse publication for this article under the certified guard.

---

## 5. Implementation boundary (only after term approval)

If the Director approves these terms (or a marked revision):

1. Amend EV-REG specification text with an explicit version bump (e.g. EV-REG-SPEC-1.1.0) — do not silently rewrite 1.0.0 bytes without a versioned programme.
2. Implement machine recognition of `primary-source-supported` (already specified) plus confirmation metadata persistence.
3. Update consensus / publication-guard eligibility accordingly.
4. Add regression tests: primary-source+confirm can publish; unsupported / unconfirmed / disputed still blocked; no score manipulation path.
5. Separately authorised Prepare → confirm claims → Approve → Publish for `cmqrvyx860000ycun5wo9ny8c`.

**No implementation or Production deploy of this amendment is authorised by this draft alone.**

---

## 6. Director decision required

Please approve one of:

**A.** Approve the terms in §3 as written (or attach redlines) and authorise an EV-REG-SPEC-1.1.0 implementation programme.
**B.** Reject primary-source publication; require independent second publishers for all scored claims (article remains unpublished under current contract).
**C.** Approve a narrower redline (list which claim classes in §3.1 are accepted / rejected).

Publication of `cmqrvyx860000ycun5wo9ny8c` remains **blocked** until A or C is approved and implemented, or until independent corroboration is obtained without fabrication.
