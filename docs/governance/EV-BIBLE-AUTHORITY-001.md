# EV-BIBLE-AUTHORITY-001 — Biblical Editorial Evidence Profile

**Status:** Permanent editorial governance policy (Director EV-BIBLE-AUTHORITY-FINAL)  
**Contract version:** `1.1.1`  
**Classification:** Explicit policy extension under EV-REG-SPEC-1.1.0  
**Directive ID:** `EV-BIBLE-AUTHORITY-001`  
**Parent contracts:** `docs/governance/EV-REG-SPEC-1.1.0.md`, `docs/governance/EV-REG-SPEC-1.0.0.md`  
**Does not supersede:** EV-REG-SPEC publication thresholds; extends scripture primary-source treatment only  
**certifiesTheology:** `false` (L4 AI instrument never certifies theology)

---

## Permanent authority hierarchy

| Level | Authority | Role |
| --- | --- | --- |
| **L1** | Scripture (authorised edition text) | Sole primary textual authority for Category A claims |
| **L2** | Director pastoral judgement | Human confirmation, pastoral approve, interpretive boundary |
| **L3** | Supplementary (commentary, secondary guides) | Optional context only — **zero supplementary is OK** |
| **L4** | AI instrument | Assistive extraction/matching only · `certifiesTheology: false` |

Single authentic Scripture witness of the authorised edition is **sufficient**. Supplementary sources are never required. Scripture mirrors must not inflate independence.

---

## 1. Foundational principle

The Bible is the authoritative scriptural foundation for Echoes & Visions biblical teaching.

1. **Scriptural authenticity** — whether a passage exists in the identified text and translation.  
2. **Quotation accuracy** — whether the article faithfully reproduces the passage.  
3. **Biblical interpretation** — whether an explanation is consistent with the cited passage and context.  
4. **Pastoral application** — whether a practical lesson is responsibly drawn from Scripture.  
5. **External factual claims** — historical, scientific, archaeological, or contemporary claims requiring ordinary EV-REG evidence.

These categories must never be confused. Scripture establishes what Scripture says. Interpretation remains accountable to Scripture. External factual claims require appropriate external evidence.

---

## 2. When this profile applies

The profile applies automatically when an article is **biblical teaching**, detected by explicit editorial signals (not by Mission ID or a hard-coded passage list):

- Article `category` in the biblical teaching set (for example `bible-stories`, `bible-study`, `sermon`, `devotional`, `christian-teaching`), **or**
- Research sources include `sourceType = scripture-reference` / `primary-scripture`, **or**
- Article content contains identifiable book/chapter/verse citations used as teaching evidence.

Nonbiblical research governance is unchanged.

---

## 3. Canonical Scripture evidence identity

Hosts that display the same underlying biblical edition (Bible Gateway, Bible Hub, and peer scripture hosts) collapse to one canonical identity keyed by **translation**, for example `scripture:esv`.

- They are access points to the text, not independent publishers of that text.  
- Two websites showing the same translation must not create artificial independent corroboration (**no mirror inflate**).  
- A failed secondary website fetch must not invalidate an otherwise verified quotation.  
- Provenance (retrieval URL, passage reference, translation) remains recorded on evidence rows.

**Authorised translation (Director FINAL):** English Standard Version (**ESV**).  
Exclusive primary-source pathway binds to identity `scripture:esv`. Other translations use distinct identities (`scripture:<edition>`) and are not assumed identical to ESV wording. KJV remains detectable as `scripture:kjv` but is **not** the authorised exclusive pathway.

---

## 4. Claim categories

### Category A — Direct Scripture claims

Direct quotations, explicit narrative events, statements attributed to biblical speakers, and faithful descriptions of what a cited passage expressly says — including multi-verse comparisons that only restate an explicit textual contrast.

**Evidence rule:** One authenticated textual witness of the authorised ESV edition is sufficient. Eligible claims may receive `primary-source supported` under EV-REG 1.1.0 when passage evidence substantiates them. Human primary-source confirmation (L2) remains required before the primary-source publication pathway.

Requirements: identifiable book, chapter, verse (or verse range), and translation (named in the claim **or** on the substantiating authorised scripture edition source).

### Category B — Biblical interpretation and pastoral teaching

Analogies, typological applications, “Christians today” lessons, pastoral paraphrases, and theological assertions not expressly stated as quotation or narrative fact.

**Evidence rule:** Evaluated for faithfulness and clarity under L2 Director pastoral authority. Must **not** automatically inherit primary-source status or be presented as explicit statements of Scripture. Must **not** be force-rewritten into Category A quotes solely to unlock publish.

**Publication eligibility (L2 pathway):** When a biblical teaching article has a current EV-REG-SPEC-1.1.0 audit with source quality ≥ 70, zero unverified claims, and scored facts that are Category B `partially supported` pastoral/interpretive claims, **documented Director/editor article approval (L2)** satisfies human publication eligibility for those claims. This does **not** fabricate scores, invent `publish-ready` recommendations, invent primary-source confirmation, or waive Category A §9 confirmation / Category C corroboration.

### Category C — External factual claims

Archaeology, non-passage historical dates, science, modern statistics, contemporary events.

**Evidence rule:** Ordinary EV-REG independence and source-quality rules. This profile is not a loophole for unsupported nonbiblical claims.

---

## 5. Source-quality and verification

- Threshold **source quality ≥ 70** remains mandatory for `publish-ready`.  
- Scripture edition hosts receive a documented authority score reflecting canonical text access (not a hard-coded article pass).  
- Scores must remain explainable from real evidence URLs and claim states.  
- No artificial score inflation, no silent threshold removal, no automatic article approval because references are biblical.  
- For 1.1.0 audits whose every scored claim is confirmed primary-source, independence thresholds (consensus / average verification ≥ 80) remain waived per EV-REG-SPEC-1.1.0 §11.B.3; source quality ≥ 70 still applies.

---

## 6. Human authority (L2)

The platform (L4) may identify references, retrieve authorised text, check quotation accuracy, classify Category A/B/C, and prepare audits. It must not impersonate the Director, fabricate confirmation, bypass gates, or publish without authorised human approval. Authenticated human primary-source confirmation retains identity, timestamp, rationale, and supporting URL.

---

## 7. Automated workflow (biblical articles)

1. Identify biblical teaching classification  
2. Extract quoted/referenced passages  
3. Verify against authorised ESV edition  
4. Classify Category A / B / C  
5. Assess with the correct evidence-quality rules (single authentic Scripture sufficient)  
6. Prepare transparent editorial audit  
7. Human review / confirmation / approval (L2)  
8. Publication only when all governance conditions hold  

---

## Document control

| Field | Value |
|---|---|
| Directive | EV-BIBLE-AUTHORITY-001 |
| Version | 1.1.1 |
| Profile module | `lib/research/biblical-editorial-evidence-profile.ts` · `lib/research/biblical-pastoral-publication.ts` |
| Authorised edition | ESV (`scripture:esv`) |
| certifiesTheology | false |
| EV-REG compatibility | EV-REG-SPEC-1.1.0 extension; thresholds unchanged |
| Activation | Implementing release after Director inspection and authorised Production deploy |
