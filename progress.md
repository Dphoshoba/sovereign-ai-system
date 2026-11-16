# Echoes & Visions — Agent Progress

**Worktree:** `C:\Users\David\echoes-visions-preview-security`
**Branch:** `integrate/production-research-integrity`
**HEAD:** `6f33a18dbbd9b4e69b185fe273c5c96d2580167d` (local Mission 004 changes uncommitted)
**Updated:** 2026-11-16 (Mission 004 — publishing usability)

## Operating contract

**Mission 004 authorised:** restore reliable article publishing (local engineering + dashboard UX).
Still forbidden without new authority: Production data changes, commit/push/deploy, Prepare on Production, approve/schedule/publish, threshold weakening, schema changes, space discoveries (ON HOLD).

## Current mission

**Mission 004 — Restore Reliable Article Publishing**

### Acceptance criteria

1. Root cause established — **PASS**
2. Reliable verification (passage preference + authorial framing) — **PASS**
3. Usable editorial decisions in dashboard — **PASS**
4. Controlled end-to-end publishability demonstration — **PASS**
5. Regression suite + tsc + build — **PASS** (105 files / 1145 tests; tsc clean; build exit 0)

## Root causes (AI Automation remains review-required)

1. **EV-REG single-publisher rule (governance, not a defect)**
   Zapier/NIST tutorial claims are correctly **partial** when one publisher document supports them. `publish-ready` requires **two independent publisher identities per claim**, consensus ≥80, source quality ≥70, average verification ≥80, zero unverified. Human ACCEPT/QUALIFY docs are out-of-band and do not re-score audits.

2. **Interpretive Claim 3 scored as factual (software defect — fixed)**
   “Keeping those decisions with people is a practical response…” was pulled as factual because `\bnist\b` matched `FACTUAL_SIGNAL`, then failed lexical PDF match → unverified score 0. Now classified **authorial**.

3. **Weak passage preference (software defect — fixed)**
   When multiple passages supported a claim, ranking used raw overlap only, so a generic NIST blurb could beat the Human-AI Configuration / over-reliance passage. Ranking now uses `distinctiveSupportScore`.

4. **Dashboard opacity (product gap — fixed)**
   Directors saw raw scores/JSON without clear verified / needs corroboration / needs correction / decision / publication-permitted language.

## Changes implemented

| Area | Change |
|---|---|
| `lib/research/article-claim-extractor.ts` | Authorial patterns for interpretive NIST framing; export `distinctiveSupportScore` |
| `lib/research/claim-evidence-selector.ts` | Rank supporting passages with distinctive boost |
| `lib/research/claim-evidence-matcher.ts` | Prefer distinctive matches when selecting primary evidence |
| `app/admin/articles/ArticleAuditPanel.tsx` | Editorial decision board + claim decision list |
| `app/admin/articles/[id]/edit/EditArticleForm.tsx` | Link to decision board + workflow reminder |
| Tests | `mission004-passage-preference.test.ts`, `mission004-publishability-workflow.test.ts`, tutorial coverage update |

## Tests and build

- Focused Mission 004 tests: **pass**
- `tests/editorial`: **105 files / 1145 tests pass**
- `tsc --noEmit`: **clean**
- `npm run build` (CI Supabase placeholders): **exit 0**

## Decisions

- Did **not** weaken EV-REG thresholds or invent dual-publisher corroboration.
- Did **not** add a silent human override of `publish-ready`.
- Human **Approve** remains a separate workflow gate; schedule/publish still require research publication eligibility.
- Single-publisher tutorials (e.g. AI Automation) will remain `review-required` under certified rules unless claims gain independent second-publisher support or the Director authorises a governance-contract change.

## Remaining risks

1. Production AI Automation article still reflects the prior audit until a separately authorised save/Prepare after this release.
2. Vendor help-centre HTML drift can still change extraction quality.
3. `consensusEngine` computes average verification for the gate but does not return that field on `ConsensusResult` (pre-existing; Prepare stores matcher average separately).

## Exact next authorised action

1. Director review of this Mission 004 diff.
2. Separately authorise **commit → push → Production deploy** of Mission 004.
3. Separately authorise Production Prepare for AI Automation only after deploy (optional; expect continued `review-required` under single-publisher rule unless content/sources change).
4. For publication of vendor-doc tutorials: either add independent corroborating sources, or request a governed programme to change EV-REG publication rules (Director decision).

## Prior closed work (reference)

- Engineering release `ec32d7af` + Production save SHA `9D426B59…` + Prepare `cmwilpof2000008l9xoo7jwg5` (`review-required`, avg verification 47).
- Space discoveries remains **ON HOLD**.
