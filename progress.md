# Echoes & Visions — Agent Progress

**Worktree:** `C:\Users\David\echoes-visions-preview-security`
**Branch:** `integrate/production-research-integrity`
**Updated:** 2026-11-17 (Mission 006R2 Production release)

## Operating contract

Mission 005R Production release complete (`dpl_EMYTUsKCeCxUMDsQiXBy7K9A5HxG` @ `5fbdfd05`). Mission 006R Production release complete (`dpl_HtFNkrbPNrTuzJuuwJPEREHTPDER` @ `3fe423ec` — **rollback baseline**). Mission **006R2** scoped Production release authorised. No Production article mutations; Mission 006 editorial recovery still requires separate authorisation. Space discoveries remains ON HOLD.

## EV-REG-SPEC-1.1.0 release

| Field | Value |
|---|---|
| Spec | `docs/governance/EV-REG-SPEC-1.1.0.md` |
| Implementing commits | `5ddb1c8a` → `60f936b7` → `5dc0151a` |
| Production deployment | `dpl_5cmzX5e1FtKeeDwwSKegZ9bxCuc7` (Ready) |
| Production SHA | `5dc0151ae3c370879ec4411125992f43dfca405c` |
| Health | `ok=true`, verifier `article-grounded-ev-reg-1`, flag enabled |
| Tests | 106 files / 1,150 editorial (+1.1.0 cases); tsc clean; build 0 |
| Prior rollback | `dpl_zqhmJWch2fDkEpRRGdfRXdC8Z5GG` @ Mission 004 / earlier pins retained |

### Behaviour shipped
- Primary-source + human confirmation pathway (scores retained; independence thresholds do not block confirmed primary-only articles)
- Confirm API + decision-board confirm buttons
- Spec-upgrade re-Prepare when current audit is on an older specification
- Vendor-doc exclusive-primary fix (Zapier docs naming ChatGPT/OpenAI)
- Evidence-state reclassify without score mutation

## AI Automation publication

| Field | Value |
|---|---|
| Article | `cmqrvyx860000ycun5wo9ny8c` |
| Status | **published** |
| Audit | `cmwj14hpz000008l5om2drq8l` (`EV-REG-SPEC-1.1.0`, `publish-ready`) |
| Scores (unaltered) | consensus 83 · SQ 83 · avg verification 55 |
| Claims | 6 primary-source confirmed; 0 unverified (interpretive claim authorial) |
| Public URL | https://www.echoesandvisions.com/blog/ai-automation-for-creators-build-your-first-workflow-in-7-days (HTTP 200) |
| Workflow | Prepare → reclassify → confirm ×6 → Approve → publish-package |

## Remaining risks
1. Social draft generation ran as part of publish-package (platform default); no cron force-publish used.
2. Space discoveries remains ON HOLD.
3. Mixed independent+primary articles still require consensus/avg ≥80 when any independent claim is present.

## Mission 005 — Autonomous editorial acceptance

| Field | Value |
|---|---|
| Production deployment | `dpl_5cmzX5e1FtKeeDwwSKegZ9bxCuc7` (Ready) |
| Production SHA | `5dc0151ae3c370879ec4411125992f43dfca405c` |
| Health | `ok=true`, verifier `article-grounded-ev-reg-1` |
| Governance target | EV-REG-SPEC-1.1.0 |
| Dashboard path | `/admin/ai-generator` → Generate for Review → audit board |
| Article ID | `cmwj5wal7000008juka6kjr35` |
| Title | Start Using AI Without Losing Human Control |
| Slug | `start-using-ai-without-losing-human-control` |
| Status | `review-required` (not approved; not published) |
| Audit | `cmwj5waxb000108juqe9sztn0` (`specificationVersion=null`, baseline) |
| Recommendation | `review-required` |
| Scores | consensus 100 · SQ 50 · avg verification 35 |
| Claims | verified 0 · partial 3 · unverified 29 |
| Sources | 8 collected (incl. HBS BiGS, Forbes Councils, Inc., Gallagher, Zone of Genius) |
| Manual technical interventions | 0 (no API injects, no score edits, no content rewrite) |
| Publication | Not attempted — Director approval required and gate not publish-ready |

### Operational usability finding
Decision board instructs “Correct unverified claims, then run Prepare for Review again,” but Prepare is hidden while a current audit exists (`canShowPrepareForReviewAction`). Backend would allow re-Prepare when `specificationVersion !== EV-REG-SPEC-1.1.0`; the dashboard does not expose that control. No developer-endpoint workaround used.

### Acceptance snapshot
- A Autonomous creation: PASS
- B Evidence integrity: BLOCKED (29 unverified; SQ 50; avg 35)
- C Editorial readiness under EV-REG-SPEC-1.1.0: BLOCKED (baseline audit only)
- D Director experience: PASS (one decision presented)
- E Governed publication: BLOCKED (awaiting Director; not eligible)

## Mission 005R — Autonomous editorial recovery (local)

| Field | Value |
|---|---|
| Director decision | REQUEST CHANGES on `cmwj5wal7000008juka6kjr35` (unchanged in Production) |
| Prepare UI fix | `canShowPrepareForReviewAction` + audit/edit/list wiring; re-Prepare when versioned verifier is on and current audit is not `EV-REG-SPEC-1.1.0` |
| Prepare API fix | Same upgrade rule; adopted-version and baseline-mode duplicates remain blocked; concurrent duplicate protection retained |
| Generator root cause | Audit stored pre-write source-extracted facts (29 unverified) instead of article-grounded claims |
| Generator fix | `ground-generated-article.ts` + revision pass in `/api/ai/generate-article`; store article-grounded audit; force `review-required` when claims missing/unverified |
| Live Mission 005 article | Not modified |
| Tests | 107 editorial files / 1,155 tests passing; tsc clean; `npm run build` exit 0 |
| Release readiness re-verify | Focused 61 + full editorial 1,155; tsc 0; build 0 (2026-11-16 readiness pass) |
| Release | **Deployed** — `5fbdfd05` → `dpl_EMYTUsKCeCxUMDsQiXBy7K9A5HxG` (Ready); prior Ready rollback `dpl_5cmzX5e1FtKeeDwwSKegZ9bxCuc7` |
| Commit scope | Prepare UI/API + generate-article grounding + tests + progress.md; excluded `gamma/research/index.json` and `scripts/final-exec-*.cjs` |
| Production baseline | `dpl_EMYTUsKCeCxUMDsQiXBy7K9A5HxG` @ `5fbdfd05…`; health ok; versioned verifier on; engine `article-grounded-ev-reg-1` |
| Rollback | Re-alias to `dpl_5cmzX5e1FtKeeDwwSKegZ9bxCuc7` — does not reverse DB writes |

## Mission 006 — Director biblical publishing (Production)

| Field | Value |
|---|---|
| Director decision | **REQUEST CHANGES** |
| Canonical article | `cmwjb1tld000u07jp2rz3ydrm` — Pharaoh's Counterplans: 5 Devilish Tactics That Keep Believers Bound |
| Status | `review-required` (preserved; not approved/published) |
| Audit | `EV-REG-SPEC-1.1.0` recorded; recommendation `review-required`; factCount 0 |
| Prepare | Blocked — `insufficient_article_evidence` |
| Root causes recorded | (A) bible-stories fallback hard-coded to 1 Samuel 17; (B) scripture narrative/quotations classified non-auditable / primary-scripture limited to 1 Samuel 17 |
| Production mutations after decision | None |

## Mission 006R — Scripture editorial reliability (local)

| Field | Value |
|---|---|
| Defect A fix | `scripture-ref.ts` + `fallback-source-provider.ts` + `source-collector.ts` — topic-derived BibleGateway/BibleHub sources; empty = safe failure; never silent D&G substitution |
| Defect B fix | `isScriptureTextualClaim` + generalized primary-scripture claim/source binding + verse locator; glued-heading split so body prose remains auditable; pastoral advice stays authorial |
| Governance | Compatible with EV-REG-SPEC-1.1.0 primary-source pathway; **no amendment required**; thresholds unchanged; `insufficient_article_evidence` retained |
| Tests | Focused Mission 006R + Article-3 identity/coverage green; full editorial **108 files / 1,162 tests** pass; `tsc --noEmit` 0; `npm run build` 0 |
| Production article | Prior article `cmwjb1tld000u07jp2rz3ydrm` preserved |
| Release | **Deployed** — `3fe423ec` → `dpl_HtFNkrbPNrTuzJuuwJPEREHTPDER` (Ready); health ok; engine `article-grounded-ev-reg-1` |
| Commit scope | scripture-ref + fallback/collector + claim extractor/attribution + verse locator + mission-006r tests + progress.md |

## Mission 006 — Autonomous editorial recovery (Production)

| Field | Value |
|---|---|
| Authority | Director Mission 006 AUTHORISED (dashboard only; no approve/publish) |
| Final candidate article | `cmwjn252i000c08jtva3c775m` — Pharaoh's Counterplans: How Bondage Tries to Block Deliverance |
| Prior trail | `cmwjb1tld000u07jp2rz3ydrm` (REQUEST CHANGES); `cmwjmu0ep000008jtwb586jkp` (first post-006R regen; wrong chapter mix + D&G body) |
| Status | `review-required` (not approved; not scheduled; not published) |
| Sources (candidate) | Exodus 5, 8, 10 + John 10 (BibleGateway/BibleHub) — **006R source fix verified** |
| Audit | recommendation `review-required`; Sources 8; Evidence Records **0**; Facts **0**; consensus/SQ/avg **0** |
| Prepare | Not available on candidate (current audit already present; list shows Approve not Prepare) |
| Body defect | Opens as `FACT 1: The David and Goliath account highlights trust in God` despite Exodus topic/sources |
| Smoking-gun evidence | Consensus group claim `"The David and Goliath account highlights trust in God."` bound to Exodus 5 KJV evidenceText (Moses/Aaron/Pharaoh) |
| Root cause (single) | `lib/research/bible-extractor.ts` + `lib/research/fact-extractor.ts` `bibleClaims` still hard-map any bible evidence containing Lord/God/Israel/faith/trust into David-and-Goliath claims; 006R did not remove this path |
| Manual interventions | 0 (no API source injection; no score edits; no DB writes) |
| Director decision required | **REQUEST CHANGES** — authorise Mission **006R2** to make bible fact extraction subject-preserving (Exodus/Pharaoh-aware; never inject unrelated D&G claims), then re-run dashboard recovery |

### Acceptance snapshot
- A Source subject preservation (006R): PASS (Exodus 5/8/10 + John 10)
- B Body free of unrelated biblical story: FAIL (D&G FACT framing)
- C Scripture claims auditable / evidence traceable: FAIL (Facts 0; Evidence Used [])
- D Valid EV-REG editorial decision state for human review of Exodus teaching: FAIL
- E Approve/schedule/publish: Not attempted (boundary held)

## Mission 006R2 — Biblical research integrity (local)

| Field | Value |
|---|---|
| Authority | Director **CONDITIONAL APPROVAL** for scoped Production release (2026-11-17) |
| Root cause | `bibleExtractor` / dead `bibleClaims` mapped Lord/God/Israel/faith/trust → hard-coded David-and-Goliath claims; applications promoted into FACT claims; uncited primary-scripture key defaulted to `1-samuel-17` |
| Fix A | `bible-extractor.ts` — subject detection (`david-goliath` \| `exodus-deliverance` \| `generic`); Exodus-aware extraction; chapter-qualified claims; `isDavidGoliathNarrativeClaim`; D&G rules only when subject is D&G |
| Fix B | `fact-extractor.ts` — pass topic + source into extractor; drop pastoral applications from FACT claims; final filter uses topic **and** evidence blob |
| Fix C | `claim-source-attribution.ts` — `biblicalNarrativeAllowsEvidence` blocks Exodus↔D&G mismatches (incl. Philistine/confrontation); no `1-samuel-17` default key |
| Fix D | `generate-article/route.ts` — bible topic fidelity instruction + filter D&G FACT blocks using evidence-aware subject + narrative claim detector |
| Review follow-up | Closed [Review](77d26edd-19aa-4d64-bb08-ef4a76353304) HIGH items: Philistine gate, topic-only filter, residual confrontation leak, chapter provenance |
| Tests | `tests/editorial/mission-006r2-biblical-research-integrity.test.ts` (acceptance 1–10 + regression cases) |
| Regression | Focused 006R+006R2 **17/17**; full editorial **109 / 1,172**; `tsc --noEmit` 0; `npm run build` 0 (pre-release re-verify) |
| Production | No article/audit changes; no regenerate; no Prepare/approve/schedule/publish |
| Rollback baseline | Prior Ready Production `dpl_HtFNkrbPNrTuzJuuwJPEREHTPDER` @ `3fe423ec` |
| Commit scope | bible-extractor + fact-extractor + claim-source-attribution + generate-article + mission-006r2 tests + progress.md; **excluded** `scripts/final-exec-*.cjs` |
| Status | Production release in progress under Director CONDITIONAL APPROVAL |
