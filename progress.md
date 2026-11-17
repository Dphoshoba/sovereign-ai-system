# Echoes & Visions — Agent Progress

**Worktree:** `C:\Users\David\echoes-visions-preview-security`
**Branch:** `integrate/production-research-integrity`
**Updated:** 2026-11-17 (Mission 006 article ready for Director inspection)

## Operating contract

Mission **006** article completion delivered. Production on `dpl_CkT2eBF69tqJAzAZfJeNrLEW7HeA` @ `6ef9f3ed` (006R4). Rollback candidate preserved: `dpl_CPaaai2ez9oxn4VSRXnK1ojCkohC` @ `563dc34f`. Approve / schedule / publish remain closed. Space discoveries remains ON HOLD.

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
| Status | **Deployed** — `5587d4c0` → `dpl_7YV3q6WRoXyvkn3RGNa3zEt9R12z` (Ready); health ok; engine `article-grounded-ev-reg-1` |

## Mission 006 — Final Autonomous Editorial Recovery (Production)

| Field | Value |
|---|---|
| Authority | Director **AUTHORISED** — generate / research / verify / Prepare only; no approve / schedule / publish / Director impersonation |
| Production | Ready `dpl_7YV3q6WRoXyvkn3RGNa3zEt9R12z` @ `5587d4c0037e6e98dbd6c7bac03d2d40a080ba56` |
| Health | `ok=true`, verifier `article-grounded-ev-reg-1`, versioned flag enabled |
| Workflow | Authenticated `/admin/ai-generator` → Generate for Review → list Prepare for Review → audit board |
| Canonical article | `cmwjrlw9c000008l5ssad82bx` |
| Title | Pharaoh’s First Pushback: When God Says “Let Go” and Power Says “No” |
| Slug | `pharaoh-s-first-pushback-when-god-says-let-go-and-power-says-no` |
| Status | `review-required` (not approved; not scheduled; not published) |
| Word count | ~608 |
| Category | `bible-stories` |
| Sources (8) | Exodus 5/8/10 + John 10 (BibleGateway + BibleHub each) — **no David & Goliath** |
| Evidence records | **1** (Exodus 5 KJV chunk only; Ex 8/10/John sources collected but unused in evidence) |
| Article-grounded claims | **3** (genuine; Exodus-subject; no D&G) |
| Verified / partial / unsupported | **0 / 2 / 1** |
| Scores | consensus **38** · source quality **50** · avg verification **35** |
| Recommendation | `review-required` — publication permitted: **No** |
| Prepare | Executed; Audit State **Current**; Prepare control cleared on list |
| Body coverage | Only Exodus **5:1–2**; editorial note admits later Exodus scenes not verified here |
| Mission brief gaps | Missing movements 2–5 (Ex 8:25–28; 8:28; 10:8–11; 10:24–26); missing John 10:10 / 2 Cor 2:11 in body |
| Historical articles preserved | `cmwjb1tld…`, `cmwjmu0ep…`, `cmwjn252i…` (+ earlier Pharaoh drafts) untouched |
| Manual interventions | 0 (no source injection, no DB edits, no score bypass, no approve/publish) |
| Primary-source confirmations outstanding | Ex 5:1 and 5:2 claims remain single-publisher / needs corroboration; 1 unsupported meta-claim; no confirm UI offered on audit |
| Director decision required | **REQUEST CHANGES** — article incomplete vs five-movement brief; EV-REG gate not publish-ready |
| Verdict | **BLOCKED — EVIDENCE PROVIDED** |
| Engineering | No new programme started |

### Acceptance snapshot
- A Production 006R2 Ready + autonomous generate: PASS
- B No D&G contamination in body/sources/claims: PASS
- C Subject-correct Scripture sources collected (Ex 5/8/10 + John 10): PASS
- D Full five-movement + NT teaching body: FAIL (Ex 5:1–2 only)
- E Article-grounded evidence for all brief passages: FAIL (1 evidence record; Ex 8/10/John unused)
- F EV-REG-SPEC-1.1.0 publish-ready gate: FAIL (consensus 38 / SQ 50 / avg 35; 0 verified)
- G Prepare executed without bypass: PASS
- H Approve/schedule/publish boundary: HELD

## Mission 006R3 — Multi-passage editorial completeness (local)

| Field | Value |
|---|---|
| Authority | Director **REQUEST CHANGES** + local engineering **AUTHORISED**; Production deploy / article mutate / Prepare / approve / publish **NOT AUTHORISED** |
| Root cause | `evidenceRegistry()` non-claim path flattened chunks then `slice(0, 24)`, so Exodus 5 consumed the audit cap; later chapters fetched but got zero selected passages. Composition then only received Exodus 5 publishable facts. Secondary: chapter dual-host + collector `slice(0, 8)` dropped NT chapters after four chapters. |
| Fix A | `selectSourceBalancedEvidence` — round-robin passages across documents under `RESEARCH_MAX_UNIQUE_AUDIT_PASSAGES` |
| Fix B | `scriptureSourcesFromTopic` — Gateway-first up to 12 chapters, then Hub corroboration |
| Fix C | `sourceCollector` bible cap **16** (non-bible remains 8) |
| Fix D | `biblical-teaching-completeness.ts` — teaching plan, evidence/article coverage diagnostics, Mission 006 fixture |
| Fix E | `generate-article` — block incomplete multi-passage evidence before compose; required coverage prompt; block incomplete article before save |
| Fix F | `bible-extractor` — evidence-source-aware extraction + supporting NT textual claims; `fact-extractor` usefulness patterns for thief/Christ/devil/etc. |
| Review follow-up | Closed Medium items from review: aligned 12-chapter teaching/source cap with oversized-brief diagnostic; verse-qualified non-Exodus coverage; dedicated-section Exodus movement checks |
| Production article `cmwjrlw9c…` | **Unchanged** (no regenerate / Prepare / DB edits) |
| Tests | Focused 006R+R2+R3 **27/27**; full editorial **110 / 1,182**; `tsc --noEmit` 0; `npm run build` 0 (pre-NT polish build; post-polish tsc+editorial green) |
| Commit | `563dc34fd997a7bf83a3f86feb9e15ca2bca8176` |
| Production deployment | `dpl_CPaaai2ez9oxn4VSRXnK1ojCkohC` (Ready) — aliased to www.echoesandvisions.com |
| Rollback | Prior Ready `dpl_7YV3q6WRoXyvkn3RGNa3zEt9R12z` @ `5587d4c0` |
| Pre-release verification | Focused 30/30; editorial 110/1,185; tsc 0; build 0; MEDIUM review items closed; thresholds 80/70 unchanged |
| Post-deploy | health ok; verifier `article-grounded-ev-reg-1`; generate POST 401; prepare POST 401; admin 307; published article 200 |
| Production articles | Unchanged (no regenerate / Prepare / approve / publish) |
| Verdict | **PRODUCTION RELEASE COMPLETE — PASS** |

### Acceptance snapshot
- 1 Five Exodus movements in complete article fixture: PASS
- 2 Exodus 5/8/10 evidence under balanced selection: PASS
- 3 Supporting NT refs retained in collection: PASS
- 4 No D&G contamination: PASS
- 5 Claims bind to correct passages: PASS
- 6 Unsupported remain unsupported: PASS
- 7 Missing required passages → explicit failure: PASS
- 8 Single-passage bible still works: PASS
- 9 Non-bible generation unaffected: PASS
- 10 EV-REG Prepare/approve boundaries intact: PASS

## Mission 006 — Final Production Editorial Acceptance

| Field | Value |
|---|---|
| Authority | Director **AUTHORISED** — generate / research / verify / Prepare; no approve / schedule / publish |
| Production | Ready `dpl_CPaaai2ez9oxn4VSRXnK1ojCkohC` @ `563dc34fd997a7bf83a3f86feb9e15ca2bca8176` |
| Health | `ok=true`, verifier `article-grounded-ev-reg-1` |
| Workflow | Authenticated `/admin/ai-generator` as `davidoshoba@gmail.com` · topic = Mission 006 brief · category `bible-stories` |
| Generate result | **HTTP 422** — `articleUnchanged: true` (no new article row created) |
| Exact blocker | `Article incomplete: missing required teaching coverage (exodus-8-in-land, exodus-8-not-far, exodus-10-children, exodus-10-livestock, john-10, 2-corinthians-2, mark-8, joshua-24, ephesians-6, 1-peter-5, james-4).` |
| Draft coverage observed | Covered keys in rejected draft check: `exodus-5`, `romans-12`, `colossians-3` only |
| Missing movements | 2–5 (worship in Egypt; not very far; children; livestock) |
| Missing supporting (verse-level) | John 10:10, 2 Cor 2:11, Mark 8:34, Joshua 24:15, Eph 6:11, 1 Pet 5:8, James 4:7 |
| Final article ID | **None** (save blocked by teaching-completeness gate) |
| Prepare | **Not run** — no article produced |
| Historical Mission 006 articles | Preserved (`cmwjrlw9c…`, `cmwjn252i…`, `cmwjmu0ep…`, `cmwjb1tld…`, …) |
| Manual interventions | 0 |
| Approve/schedule/publish | Not attempted |
| Engineering | None started |
| Director decision required | **REQUEST CHANGES** — platform correctly refused incomplete composition; end-to-end acceptance not achieved |
| Verdict | **BLOCKED — EVIDENCE PROVIDED** |

### Acceptance snapshot
- A Production 006R3 Ready + authenticated generate: PASS
- B Completeness gate refuses incomplete multi-passage draft: PASS (safeguard held)
- C Five-movement + verse-level NT article saved: FAIL (422; no article)
- D Prepare / audit for Director review: FAIL (no article to prepare)
- E Approve/schedule/publish boundary: HELD

## Mission 006R4 — Complete multi-section article composition (local)

| Field | Value |
|---|---|
| Authority | Director **REQUEST CHANGES** + local engineering **AUTHORISED**; Production deploy / commit / push / article mutate / Prepare / approve / publish **NOT AUTHORISED** |
| Confirmed root cause | (1) `scriptureSourcesFromTopic` kept only the first verse range per chapter, so Exodus 8:28 and Exodus 10:24-26 were dropped from Gateway fetches. (2) `selectSourceBalancedEvidence` took early-chapter chunks, so plague/locust text starved late movement verses. (3) Evidence gate accepted URL-only chapter hits without movement text. (4) Single-host scripture movement claims stayed `unverified`, so RESEARCH LOCK composition never received Exodus 8/10 movement facts. (5) No completeness-aware revision before the 006R3 gate. |
| Fix A | `mergeRefsToUniqueChapters` — multi-range chapters fetch at chapter level |
| Fix B | `selectTeachingBalancedEvidence` — verse windows + movement-relevant chunks + per-document diversity |
| Fix C | Evidence coverage requires movement text, not URL-only chapter keys |
| Fix D | Teaching-structured prompt + one bounded completeness revision before fail-closed 422 |
| Fix E | `isTeachingCompositionFact` — composition may use single-host scripture; Prepare thresholds unchanged |
| Fix F | KJV-aligned Exodus 8/10 extractor claims (`not go very far`, sons/daughters, herds stayed) |
| 006R3 gate | Intact — incomplete drafts still rejected; no persistence on failed generation |
| Live research | PASS — real BibleGateway/Hub fetch retains all five Exodus movement texts + publishable composition facts |
| Live model compose | **NOT VERIFIED** — `OPENAI_API_KEY` unavailable locally (Vercel secrets pull returns `[SENSITIVE]` placeholder) |
| Tests | Focused 006R–R4 **39/39**; full editorial **112 / 1,193**; `tsc --noEmit` 0; `npm run build` 0 |
| Production articles | Unchanged |
| Commit / push / deploy | Not performed |
| Verdict | **BLOCKED — LIVE GENERATION NOT VERIFIED** |

### Acceptance snapshot
- 1 Same-chapter verse ranges retained: PASS
- 2 Teaching-aware selection recovers late movements: PASS
- 3 Evidence gate rejects URL-only / early-chapter misses: PASS
- 4 Completeness gate still rejects incomplete drafts: PASS
- 5 Complete five-movement fixture still passes: PASS
- 6 Single-passage bible unchanged: PASS
- 7 Non-bible topics skip teaching plan: PASS
- 8 Live research five-movement evidence + facts: PASS
- 9 Live model-generated complete article: FAIL (OpenAI key unavailable)
- 10 EV-REG thresholds 80/70 unchanged: PASS

## Mission 006 — Complete the Article (Director PROCEED)

| Field | Value |
|---|---|
| Authority | Director **PROCEED WITH ARTICLE COMPLETION** — Production AI; commit/deploy 006R4; generate; Prepare; no approve/schedule/publish |
| Commit | `6ef9f3ed1b89325ac8c3139daee42ea653a35f52` — `fix(editorial): complete multi-section biblical teaching composition` |
| Production deployment | `dpl_CkT2eBF69tqJAzAZfJeNrLEW7HeA` (Ready) — aliased to www.echoesandvisions.com |
| Production SHA | `6ef9f3ed1b89325ac8c3139daee42ea653a35f52` |
| Rollback candidate | `dpl_CPaaai2ez9oxn4VSRXnK1ojCkohC` @ `563dc34f` (preserved) |
| Article ID | `cmwjwzvj9000007kwv8z5kkyp` |
| Title (generated) | Pharaoh’s Counteroffers: Don’t Bargain With Bondage |
| Requested title | The Devil’s Tactics to Hold Us in Bondage — **not used by generator** |
| Slug | `pharaoh-s-counteroffers-don-t-bargain-with-bondage` |
| Status | `review-required` |
| Word count | ~1881 |
| Edit link | https://www.echoesandvisions.com/admin/articles/cmwjwzvj9000007kwv8z5kkyp/edit |
| Audit link | https://www.echoesandvisions.com/admin/articles/cmwjwzvj9000007kwv8z5kkyp/audit |
| Current audit | `cmwjx6bn2000307kzr4x6ksu3` (engine `article-grounded-ev-reg-1`) |
| Recommendation | `review-required` |
| Scores | confidence 35 · consensus 85 · SQ 50 · avg verification 32 · authority 50 · trust 65 |
| Claims | verified 1 · partial/single-publisher 11 · unverified 9 |
| Prepare | Ran successfully (HTTP 200); status unchanged `review-required` |
| Five movements | All present (Exodus 5:1–9; 8:25–27; 8:28; 10:8–11; 10:24–26) |
| Analogy disclaimer | Present (Exodus does not present a formal list of demonic tactics) |
| Stewardship | Whole-life surrender via Romans 12:1–2; no explicit “not merely 10%” contrast |
| Approve/schedule/publish | Not attempted |
| Transient ops note | Brief Prisma `EMAXCONNSESSION` after Prepare; pages recovered without code change |
| Verdict | **ARTICLE READY FOR DIRECTOR INSPECTION** — not publish-ready under EV-REG |

### Acceptance snapshot
- A 006R4 Production deploy: PASS
- B Authenticated AI Generator complete five-movement article: PASS
- C Prepare for Review + stay `review-required`: PASS
- D Approve/schedule/publish boundary: HELD
- E Exact requested title/subtitle: FAIL (generator chose alternate title)
- F EV-REG publish gate: BLOCKED (SQ 50; avg verification 32; unverified/single-host claims)

## Mission 006 — Editorial Corrections (REQUEST CHANGES)

| Field | Value |
|---|---|
| Authority | Director **REQUEST CHANGES** — edit + Prepare; no approve/schedule/publish; no engineering programme |
| Article ID | `cmwjwzvj9000007kwv8z5kkyp` |
| Final title | **The Devil's Tactics to Hold Us in Bondage** |
| Subtitle | Incorporated as lead line + excerpt: *Pharaoh's Counterplans Against Israel's Deliverance and Their Lessons for Christians Today* |
| Edit link | https://www.echoesandvisions.com/admin/articles/cmwjwzvj9000007kwv8z5kkyp/edit |
| Audit link | https://www.echoesandvisions.com/admin/articles/cmwjwzvj9000007kwv8z5kkyp/audit |
| Status | `review-required` |
| Current audit | `cmwk1k6aw000607l84ateb18m` (`article-grounded-ev-reg-1`) |
| Recommendation | `review-required` |
| Scores | confidence **62** · consensus **94** · SQ **50** · avg verification **53** · authority 50 · trust 65 |
| Claims | verified **0** · single-publisher **12** · unverified **0** |
| Editorial changes | Title restored; subtitle in intro/excerpt; five Exodus movements + NT retained; fifth-movement stewardship strengthened (whole life/resources; 10% not ceiling; not donate-all-to-org); narrative vs pastoral analogy preserved; claims tightened to KJV quotes / authorial framing |
| Prepare | Re-run after final save (HTTP 200) |
| Approve/schedule/publish | Not attempted |
| Unresolved evidence | SQ 50 (&lt;70); avg verification 53 (&lt;80); 12 single-publisher claims need independent second-publisher corroboration (BibleHub passages largely `no_relevant_passage` for NT/Exodus 5–8) |
| Verdict | **CORRECTED FOR DIRECTOR REVIEW — EV-REG STILL BLOCKED** |

## Mission 006 — REQUEST CHANGES (verify save + corroboration pass)

| Field | Value |
|---|---|
| Production editor verified | Title **The Devil's Tactics to Hold Us in Bondage** + corrected body with real Markdown headings (not earlier Counteroffers draft) |
| Edit link | https://www.echoesandvisions.com/admin/articles/cmwjwzvj9000007kwv8z5kkyp/edit |
| Status | `review-required` |
| Current audit | `cmwk1ufhq000907l8cszfr0ui` |
| Scores | consensus **100** · SQ **50** · avg verification **53** |
| Claims | verified **0** · single-publisher **13** · unverified **0** |
| Corroboration attempt | Exact KJV quotes + BibleGateway/BibleHub Markdown links added; Hub/NT Gateway pages largely returned `no_relevant_passage` in Prepare evidence matching |
| Unresolved | Independent second-publisher acceptance for scored claims; SQ ≥70 |
| Approve/schedule/publish | Not attempted |

## Mission 006 — Biblical primary-source verification attempt

| Field | Value |
|---|---|
| Authority | Director: KJV primary-source verification; Bible Hub not required; no engineering |
| Prepare audit | `cmwk5yh4v000307js8midses3` |
| Reclassify | ok; updated **0** |
| Confirm API | **422 `not_primary_source`** — claims remain `partially supported` |
| Classification cause | `exclusivePrimary()` does not treat cited KJV scripture as exclusive primary |
| Scores | confidence 62 · consensus **100** · SQ **50** · avg verification **53** |
| Claims | verified 0 · partial/single-publisher **13** · unverified 0 |
| Status | `review-required` |
| KJV inspection | Article Exodus / Joshua / 1 Peter quotes match Bible Gateway KJV |
| Eligible for final approval toward publish? | **No** |
| Governance change | Not made |

## Mission 006 — Scripture Primary-Source Classification (AUTHORISED)

| Field | Value |
|---|---|
| Authority | Director **AUTHORISE** narrowly scoped classification correction; no deploy; no Production evidence mutation; no confirmation until Director reviews |
| Root cause | `exclusivePrimary()` omitted scripture; Gateway+Hub counted as distinct host identities → `partially supported` / false independence |
| Fix | `isExclusivePrimaryEligibleScriptureClaim` + `SCRIPTURE_TEXT_IDENTITY` collapse; exclusive primary only for verse+KJV+quote/narrative; pastoral/interpretation excluded |
| Files | `lib/research/claim-source-attribution.ts`, `lib/research/versioned-evidence.ts`, `tests/editorial/mission-006-scripture-primary-source-classification.test.ts` |
| Tests | Focused 7/7 PASS; editorial suite **1200/1200** PASS; `npm run build` PASS |
| Production | **Not deployed**; article `cmwjwzvj9000007kwv8z5kkyp` evidence unchanged |
| Next | Director review → then deploy + Prepare/reclassify + human confirm |
