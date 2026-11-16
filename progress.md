# Echoes & Visions — Agent Progress

**Worktree:** `C:\Users\David\echoes-visions-preview-security`
**Branch:** `integrate/production-research-integrity`
**HEAD:** `5dc0151ae3c370879ec4411125992f43dfca405c`
**Updated:** 2026-11-16 (Mission 005R autonomous editorial recovery — local repair ready for governed release)

## Operating contract

Mission 004 accepted. Mission 005 Director decision: **REQUEST CHANGES** for `cmwj5wal7000008juka6kjr35` (kept `review-required`; no approve/schedule/publish). Mission 005R repaired Prepare recovery + article-grounded generation locally. No commit/push/deploy/Production Prepare without separate authorisation. Space discoveries remains ON HOLD.

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
| Release | **Not deployed** — awaiting Director governed-release authorisation |
| Commit scope (candidate) | Prepare UI/API + generate-article grounding + tests + progress.md; exclude `gamma/research/index.json` and `scripts/final-exec-*.cjs` |
| Production baseline | `dpl_5cmzX5e1FtKeeDwwSKegZ9bxCuc7` @ `5dc0151a…`; health ok; versioned verifier on |
| Rollback | Re-alias to `dpl_5cmzX5e1FtKeeDwwSKegZ9bxCuc7` (or prior Ready pin) — does not reverse DB writes |
