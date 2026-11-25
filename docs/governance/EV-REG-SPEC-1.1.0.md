# EV-REG-SPEC-1.1.0 — Authoritative Primary-Source Publication Pathway

**Status:** Adopted for implementation under Director Decision Option A (2026-11-16)
**Parent contract:** `docs/governance/EV-REG-SPEC-1.0.0.md` (immutable certified baseline; SHA-256 `9D3C34F1689BBC0DB673A5E0A3B79A11B343C2792D4F9179BFA8E29E5ECC2419`)
**Supersedes:** the publication effect of EV-REG-SPEC-1.0.0 §9 step 6 / §11 “no primary-source exception” **only for audits that record** `specificationVersion = EV-REG-SPEC-1.1.0`. Does not rewrite or replace the 1.0.0 document bytes.
**Linked from:** `docs/governance/EV-REG-AMENDMENT-PROPOSAL-PRIMARY-SOURCE-PUBLICATION.md`, `progress.md`
**User instruction (verbatim excerpt):** "Decision: Option A, subject to the following amendment." / "Required redline to §3.4" / "Implement this as a versioned EV-REG-SPEC-1.1.0 governance change, with regression tests, certification evidence and fail-closed publication guards." / "Do not activate the amendment until its implementation passes the required tests and release verification."
**Amendment source:** `docs/governance/EV-REG-AMENDMENT-PROPOSAL-PRIMARY-SOURCE-PUBLICATION.md` with Director §3.4 redline
**Activation:** Versioned audits that record `specificationVersion = EV-REG-SPEC-1.1.0` after the implementing release is tested and deployed. Historical `EV-REG-SPEC-1.0.0` audits keep 1.0.0 publication rules.

This document amends only the sections below. All other EV-REG-SPEC-1.0.0 norms remain in force.

---

## Amended §9 — Human review of primary-source-supported claims

Steps 1–5 and 7–8 of EV-REG-SPEC-1.0.0 §9 remain unchanged.

**Replacement for §9 step 6 and closing paragraph:**

6. `confirmed` leaves the machine evidence state at **primary-source supported**. Scores are not altered. When every scored factual claim on the current audit is either independently corroborated or primary-source supported with a valid confirmation record, the audit’s publication recommendation may become `publish-ready` under amended §11. `declined` / `rejected` keeps that claim blocking publication.

An article may become `publish-ready` when every scored factual claim satisfies its applicable pathway under amended §11. Unconfirmed primary-source-supported claims, ordinary partially supported claims, unsupported claims, and disputed claims continue to block `publish-ready`.

Confirmation metadata must include at least: claim text or checksum, decision (`confirmed` | `declined`), authenticated editor identity, UTC timestamp, primary source URL, short rationale, and current audit id. Confirmation is recorded through authenticated editorial actions only. It must not change article content, verification scores, consensus score, or source-quality score.

---

## Amended §10.1 — Provenance

In addition to EV-REG-SPEC-1.0.0 §10.1, a 1.1.0 audit stores:

- `specificationVersion` = `EV-REG-SPEC-1.1.0`
- for each scored claim: `evidenceState` (`unsupported` | `partially supported` | `primary-source supported` | `independently corroborated` | `disputed`)
- for each confirmed primary-source claim: confirmation metadata (§9)

Average verification, consensus, and source-quality scores remain present and **unaltered** by confirmation.

---

## Amended §11 — Publication safety invariants (1.1.0 audits)

### 11.A Claim pathways

Every scored factual claim must independently satisfy exactly one applicable pathway:

| Pathway | Requirement |
|---|---|
| Independently corroborated | Evidence state is independently corroborated (two distinct canonical publishers; existing §4.4 / §6 rules). |
| Authoritative primary-source | Evidence state is primary-source supported under §4.3 / §6; substantiating document is vendor product/API documentation, issuing-body official guidance, or cited scripture; claim is not disputed; claim does not assert measured outcomes, third-party comparisons, prevalence statistics, or causal effects beyond the primary document; and a valid human confirmation record exists on the current audit. |

Ordinary partially supported (non-exclusive primary) claims, unsupported claims, disputed claims, and unconfirmed primary-source-supported claims **block** publication.

### 11.B Article-level numeric thresholds

1. The verifier **retains and reports** the original consensus, source-quality, and average verification scores without alteration.
2. **Source quality** must be ≥ 70 for `publish-ready` on every 1.1.0 audit.
3. Numerical thresholds designed to measure **independent corroboration** (consensus ≥ 80 and average verification ≥ 80) **must not independently disqualify** an article whose every scored factual claim satisfies the authoritative primary-source pathway with valid confirmation, merely because a second publisher is absent.
4. When **any** scored factual claim relies on the independently corroborated pathway, the existing certified thresholds remain mandatory for that article: consensus ≥ 80, source quality ≥ 70, and average verification ≥ 80, in addition to per-claim pathway satisfaction.
5. Mixed articles: every factual claim must satisfy its own pathway; any unsupported, disputed, ineligible, or unconfirmed factual claim blocks publication.

### 11.C Unchanged hard blocks

- Missing substantiating URL for a scored claim
- Unscored eligible factual claims (completeness)
- Missing/malformed specification version, disputes array, or engine revision
- Stale audit / fingerprint mismatch
- Security, authentication, article Approve, schedule, and publish lifecycle controls
- No score manipulation, fabricated corroboration, cron force-publish, or direct database lifecycle writes

### 11.D Baseline and 1.0.0 audits

Baseline audits (null specification version) and `EV-REG-SPEC-1.0.0` audits remain under EV-REG-SPEC-1.0.0 §11. There is no silent backfill of 1.1.0 eligibility onto historical audits.

---

## Eligible primary-source categories (normative summary)

Aligned with amendment §3.1:

1. Vendor’s own product / API documentation for a product-behaviour claim about that vendor
2. Authoritative official guidance issued by the body whose guidance the claim states
3. Cited scripture edition for scripture claims

### Biblical Editorial Evidence Profile (policy extension)

Permanent scripture classification, edition identity, and biblical source-authority scoring for biblical teaching articles are defined in **`docs/governance/EV-BIBLE-AUTHORITY-001.md`** (directive EV-BIBLE-AUTHORITY-001 **v1.1.1**). Hierarchy: Scripture L1 · Director pastoral L2 · supplementary L3 (optional; zero OK) · AI instrument L4 (`certifiesTheology: false`). Authorised edition: **ESV** (`scripture:esv`). Single authentic Scripture witness is sufficient; Gateway↔Hub mirrors of the same edition must not inflate independence. Category B pastoral/interpretive claims are satisfied by **documented L2 article approval** (no forced quote rewrite; no score fabrication). That profile does **not** amend §11.B numeric thresholds: source quality ≥ 70 remains mandatory; human confirmation (§9) remains required for the Category A primary-source pathway; nonbiblical claims retain ordinary EV-REG corroboration rules.

---

## Document control

| Field | Value |
|---|---|
| Version | EV-REG-SPEC-1.1.0 |
| Parent | EV-REG-SPEC-1.0.0 |
| Director decision | Option A with §3.4 redline (2026-11-16) |
| Biblical profile extension | EV-BIBLE-AUTHORITY-001 |
| Implementation | Fail-closed publication guards + regression tests required before Production activation |
