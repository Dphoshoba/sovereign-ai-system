# M2 Release Readiness Verification (M2-RR)

**Programme:** Milestone 2 (M2) Consolidated Release Readiness  
**Status:** Audit complete — awaiting Director release decision  
**Branch:** `cursor/autonomous-pipeline-lockdown-1605`  
**Baseline HEAD at audit start:** `6acc02684651801833c83264d6ac04112c627d9c`  
**Audit nature:** Verification only. No product behaviour changes. Production deployment is **not** authorised by this report.  
**Date of evidence:** 2026-11-18

## Recommendation (executive)

**CONDITIONAL GO** for accepting the M2 editorial programme as locally complete and merge-*candidate* subject to the conditions in **Section L**.

**NO-GO for production promotion** until those conditions are cleared or explicitly waived by the Director. This audit did not authorise push, PR, deploy, migration, or live social publishing.

---

## A. Baseline verification

| Check | Result | Evidence |
| --- | --- | --- |
| Current branch | **PASS** | `cursor/autonomous-pipeline-lockdown-1605` |
| HEAD at audit | **PASS** | `6acc02684651801833c83264d6ac04112c627d9c` |
| P0 present | **PASS** | `d1495d991ab5c94849e491d35b724010a46f8f50` — Autonomous Pipeline lockdown |
| P1 present | **PASS** | `5299e0d5963512fb5c5b3b29bab5e716be0b0287` — Director Checklist |
| P2 present | **PASS** | `2659bc8cd93338788c9b6b1cd5783a04b7164c07` — Facebook canonical URL |
| P3 present | **PASS** | `99bfa863c12b213211e0d83a4c8a4b9f89e18c22` — EV-BIBLE-AUTHORITY-001 |
| P4 present | **PASS** | `db5ed5848f1c687c5b05e06d0ad5c78e5c7e2edc` — Monitoring consolidation |
| P5 present | **PASS** | `6acc02684651801833c83264d6ac04112c627d9c` — EV-REG-SPEC-1.1.0 |
| Linear ancestry P0→P5 | **PASS** | `git log --oneline d1495d99^..6acc0268` shows exactly those six commits in order |

## B. Full test suite

| Suite | Result | Evidence |
| --- | --- | --- |
| Full `npx vitest run` | **FAIL (pre-existing / env)** | `279` files: `2 failed`, `277 passed`. Tests: `7 failed`, `3831 passed`, `23 skipped` (~159s) |
| `research-audit-claim-selection-v15.test.ts` | **FAIL (7)** | Pre-M2 file (`b641505d` “record claim-selection gaps for v15”). Not introduced by P0–P5. Failures cover antecedent-scoped deduplication and balanced safety-first selection. |
| `article-governance-postgres.concurrency.test.ts` | **FAIL (suite bootstrap)** | Disposable PostgreSQL 16 / Docker API unavailable in this environment; `20` tests skipped after suite error. |
| M2-focused editorial + `tests/security` | **PASS** | `7` files / `59` tests: autonomous-pipeline-lockdown, director-checklist, director-checklist-monitoring, ev-bible-authority-001, ev-reg-spec-1-1-0, facebook-publish-canonical-url, supabase-rls-proposal |
| `tsc --noEmit -p tsconfig.json` | **PASS** | Exit `0` |

**Disposition:** Full-suite green is **not** achieved. Failures are outside M2 commit deltas (claim-selection gaps) or environment (Docker). No silent product or test changes were made to hide them.

## C. Security inventory (especially `/api/agents/*`)

### C.1 M2 publishing-spine controls (in scope)

| Control | Result | Evidence |
| --- | --- | --- |
| `POST /api/ai/autonomous-pipeline` | **PASS** | Requires `requireEditorAuth`; always returns `403 AUTONOMOUS_PIPELINE_DISABLED` with `articleUnchanged: true`; directs to `/api/ai/generate-article` |
| Agent autonomous packaging routes | **PASS (auth)** | `app/api/agents/autonomous-pipeline` and `execute-autonomous-pipeline` require `requireEditorAuth` before execution (P0). They remain **executable for authenticated editors** (video/director pipeline — not the disabled research-free article packaging route). |
| Editorial article mutations | **PASS (spot inventory)** | `app/api/articles/*` routes checked use `requireEditorAuth` / publishing gates with fail-closed `articleUnchanged` patterns |
| Admin middleware | **PASS (narrow)** | `middleware.ts` matcher is `/admin/:path*` only — does **not** protect `/api/agents/*` |

### C.2 `/api/agents/*` surface (broader, largely pre-M2)

| Metric | Count |
| --- | --- |
| Total `route.ts` under `app/api/agents` | **112** |
| Using `requireEditorAuth` / `requirePublishingEditor` | **2** (`autonomous-pipeline`, `execute-autonomous-pipeline`) |
| No detected application auth gate | **110** |
| Unauthenticated routes that can Prisma `create`/`update`/`delete`/`upsert` | **7** (see below) |

**Unauthenticated Prisma writers (HIGH — pre-existing, not introduced by M2):**

1. `app/api/agents/script-generation/route.ts` — can `prisma.youTubePost.update` when `youtubePostId` supplied  
2. `app/api/agents/scene-planner/route.ts`  
3. `app/api/agents/shorts-swarm/route.ts`  
4. `app/api/agents/thumbnail-intelligence/route.ts`  
5. `app/api/agents/timeline-builder/route.ts`  
6. `app/api/agents/visual-assets/route.ts`  
7. `app/api/agents/voiceover-director/route.ts`

**Additional notable unauthenticated behaviour:**

- `POST /api/agents/director` starts `startPersistentScheduler()` (six-hour cron calling `localhost` content-generation loop) with **no** editor auth.
- Many compute/simulation agent POSTs remain open. Some endpoints (e.g. YouTube publish / render-video) return disabled `501` stubs.

**Audit posture:** Findings are reported; product behaviour was **not** changed in M2-RR to conceal them. M2-P0 correctly locked the research-free **article** packaging path; it did not remediate the broader agent YouTube/media mutation surface.

**Follow-up:** M2-SR1 remediated privileged `/api/agents/*` surfaces (see `docs/editorial/M2_SR1_AGENT_API_SECURITY_REMEDIATION.md`). Production promotion remains **NO-GO** until remaining conditions in Section L are cleared.

## D. Governance (publishing spine)

| Invariant | Result | Evidence |
| --- | --- | --- |
| Generate → research/audit → human approval → featured image → publication guards → social | **PASS** | Director Checklist derivation + publication guard + lifecycle tests |
| Human approval ≠ publish ≠ social send | **PASS** | Distinct transitions/routes; AI generate stops at `review-required` |
| Publication thresholds | **PASS** | Consensus ≥ 80, source quality ≥ 70, recommendation `publish-ready` |
| Approval integrity / fingerprint binding | **PASS** | Audit association v2 + featured-image prompt fingerprint notes |
| X uncertain non-retry / claim lock | **PASS** (prior M1/runbook + monitoring recognition of `publishing`) | Director Checklist monitoring treats `publishing` as action-required |
| Pipeline lockdown preserved | **PASS** | P0 tests green |

## E. Biblical Authority

| Check | Result | Evidence |
| --- | --- | --- |
| Contract present | **PASS** | `docs/editorial/EV-BIBLE-AUTHORITY-001.md` |
| Machine helpers | **PASS** | `lib/research/ev-bible-authority-001.ts` |
| Deferred Director decisions preserved | **PASS** | Proposed section retained; registry placement note updated by P5 without absorbing theology into a registry engine |
| Regression tests | **PASS** | `tests/editorial/ev-bible-authority-001.test.ts` in M2 suite |

## F. Registry (EV-REG-SPEC)

| Check | Result | Evidence |
| --- | --- | --- |
| Spec present | **PASS** | `docs/editorial/EV-REG-SPEC-1.1.0.md` |
| Traceability module | **PASS** | `lib/publishing/ev-reg-spec-1-1-0.ts` with `createsRegistryEngine: false` |
| No new registry engine / Prisma model | **PASS** | Inventory + test asserts absence of `EvReg` / `RegistryEntry` models |
| REG-R1…R10 bound to existing stores | **PASS** | Fingerprints, review notes, publication guard, social OperationalEvents |
| Tests | **PASS** | `tests/editorial/ev-reg-spec-1-1-0.test.ts` |

## G. Monitoring

| Check | Result | Evidence |
| --- | --- | --- |
| Director Checklist UI/API | **PASS** | `/admin/director-checklist`, `GET /api/articles/director-checklist` (`requireEditorAuth`, `readOnly: true`) |
| Status vocabulary | **PASS** | Success / Pending / Failed / Blocked / Unavailable / Unknown via `director-checklist-monitoring.ts` |
| Evidence-only (no invented rows) | **PASS** | Overlay on Article / audits / notes / SocialPost / OperationalEvent |
| Docs | **PASS** | `docs/editorial/DIRECTOR_CHECKLIST_MONITORING.md` |
| Tests | **PASS** | Director checklist + monitoring suites |

## H. Database / Supabase

| Check | Result | Evidence |
| --- | --- | --- |
| M2 commits alter Prisma schema? | **PASS (no)** | P0–P5 are application/docs/tests only; no migration in those six commits |
| Proposed RLS / public Data API SQL | **NOT PART OF M2 RELEASE** | Untracked / proposed under `docs/security/proposed/*` — **must not** be applied as part of M2-RR |
| Prior production assessment | **OPEN RISK** | `docs/security/PRODUCTION_READINESS_ASSESSMENT.md` (untracked local) previously recorded Supabase Data API / `DATABASE_URL` verification gaps; DB remediation was **not** approved there |
| Concurrency governance suite | **UNVERIFIED HERE** | Docker PostgreSQL unavailable in this agent environment |

## I. Deployment readiness

| Item | Result | Notes |
| --- | --- | --- |
| Production deploy authorised by M2-RR? | **NO** | Explicitly prohibited |
| Push / PR created? | **NO** | Local verification only |
| Live social publish exercised? | **NO** | Prohibited |
| Dirty worktree outside M2 | **PRESENT** | Unrelated untracked/modified paths (OAuth trees, focus, privacy, terms, proposed SQL, etc.) must **not** ride along in any future release package without separate review |
| Canonical production URL convention | Documented | `https://sovereign-ai-executive.vercel.app` / public articles via `https://www.echoesandvisions.com/blog/{slug}` (Facebook remediation verified in code) |
| Build smoke / live `/api/health` | **NOT RUN** | Out of scope without deploy authorisation |

## J. Rollback plan

If this branch is later promoted (only after Director authorisation):

1. **Application rollback:** Redeploy the previously known-good production deployment/commit (do not reverse via ad-hoc DB surgery). M2 commits contain **no** Prisma migrations, so there is no schema reverse step for P0–P5 themselves.
2. **Behavioural rollback targets by phase:**
   - P0: restore prior autonomous packaging only if Director explicitly re-authorises (not recommended).
   - P1/P4: remove/disable Director Checklist UI/API overlay (read-only; low risk).
   - P2: Facebook link construction reverts with code rollback.
   - P3/P5: documentation + deterministic helpers; rollback is code/docs revert only.
3. **Do not** apply or “roll back” proposed `docs/security/proposed/*.sql` as part of M2 — those are a separate security programme.
4. **Social:** leave uncertain X claims in `publishing`; do not auto-retry on rollback.

## K. Evidence summary

| Artefact | Path / command |
| --- | --- |
| This report | `docs/editorial/M2_RELEASE_READINESS.md` |
| M2 commits | `d1495d99` … `6acc0268` on `cursor/autonomous-pipeline-lockdown-1605` |
| Full vitest | `3831` passed / `7` failed / `23` skipped; `2` failed files |
| M2 vitest slice | `59` passed |
| Typecheck | `tsc --noEmit` exit `0` |
| Agent auth inventory | `112` routes; `2` editor-gated; `7` unauthenticated Prisma writers |
| Contracts | `EV-BIBLE-AUTHORITY-001`, `EV-REG-SPEC-1.1.0`, Director Checklist monitoring docs |

## L. Consolidated recommendation

### Verdict: **CONDITIONAL GO** (programme acceptance) / **NO-GO** (production promotion)

**Accept M2 P0–P5 as complete** for Director programme sign-off **if** the following conditions are acknowledged:

1. **Production promotion remains blocked** until the Director explicitly authorises a separate release action.
2. **`/api/agents/*` unauthenticated mutation surface** (at least the seven Prisma writers and unauthenticated director scheduler start) is remediated, network-isolated, or formally waived with a risk acceptance note.
3. **`research-audit-claim-selection-v15` failures** are dispositioned (fix, skip-with-ticket, or accepted gap) — they are pre-M2 and outside the six M2 commits.
4. **PostgreSQL concurrency suite** is either runnable in CI/release environment or formally waived.
5. **Proposed Supabase SQL** and unrelated dirty worktree paths are excluded from any M2 release package.
6. **No live social or DB migration** is bundled with M2 acceptance.

### What is ready

- Working publishing spine lockdown for research-free Autonomous Pipeline packaging  
- Director Checklist + evidence-based monitoring overlay  
- Facebook canonical `/blog/{slug}` remediation  
- Biblical Authority contract + guards  
- Registry provenance specification without a new engine  

### What is not ready

- Full-repository production security posture (agent routes, Supabase Data API proposals)  
- Full vitest green in this environment  
- Authorised production deployment

---

**STOP.** Awaiting Director release decision. No push, PR, deploy, migration, live social, or next milestone started by this audit.
