# EV-EDITORIAL-07 — Unified Autonomous Publishing Pipeline

**Mode:** Assessment complete; **P0 implementation authorised separately (EV-EDITORIAL-07-P0)**  
**Director decision executed:** GO for assessment; GO for P0 stage runner only  
**Repos:** `echoes-visions-nextjs-cta` / remote `Dphoshoba/sovereign-ai-system`  
**Date:** 2026-11-22 (Australia/Adelaide)

This document does not authorise Production deployment, schema change, approval, schedule override, publication, or social send. P0 is local implementation + tests only.

---

## 1. Current platform capability map

| # | Capability | Status | Primary implementations | Notes |
| --- | --- | --- | --- | --- |
| 1 | Editorial planning / topic selection | **Working, fragmented** | `lib/discovery/topic-discovery.ts`, `topic-scorer.ts`, `app/admin/discovery`, `app/api/discovery/*`, `app/api/workers/weekly-planner` | Brave discovery + scoring exist. Cron discovery can generate drafts. Not bound to a Director-authorised calendar policy. |
| 2 | Research / source collection | **Working** | `lib/research/source-acquisition.ts`, `content-fetcher.ts`, source collectors used by `prepare-article-for-review.ts` | Fetch failures are classified; recovery is largely manual (see EV-EDITORIAL-02). |
| 3 | Evidence registry / fact verification | **Working** | `evidence-registry.ts`, `claim-evidence-matcher.ts`, `claim-evidence-selector.ts`, `fact-verification-engine.ts`, EV-REG 1.1.0 primary-source pathway | Supports verified / partially verified / unverified. Unsupported claims surface in selection; no first-class article `HOLD` lifecycle status. |
| 4 | Consensus / quality auditing | **Working (certified gates)** | `consensus-engine.ts`, `prepare-article-for-review.ts`, `current-article-audit.ts`, `article-audit-association.ts` | Gates: consensus ≥ 80, source quality ≥ 70, recommendation exactly `publish-ready`, current fingerprint association. Dual-zone association hotfix is live. |
| 5 | Content generation / rewriting | **Working with lockdown** | `app/admin/ai-generator`, `app/api/ai/generate-article`, `app/api/articles/generate` | Governed path stops at human review. `/admin/autonomous-pipeline` intentionally locked (skip-research packaging removed). Legacy `/api/pipeline` still chains plan→generate→package→**auto-schedule** and must not be the unified engine. |
| 6 | Featured-image generation / storage | **Working** | `approve-featured-image-prompt.ts`, `persist-featured-image.ts`, `lib/storage/article-images.ts`, admin prompt panel | Prompt must be current + approved; image outside audit fingerprint. Ops observed transient OpenAI→Supabase upload flake; upload itself is healthy. |
| 7 | Director review / approval | **Working, UX fragmented** | `POST /api/articles/approve\|reject`, `ArticleReviewActions`, `ArticleAuditPanel`, `editorial-decision-board` (preview-security WIP), `/admin/director-checklist` | Checklist is evidence-based **monitoring**, not a single action console. Approve/reject/schedule/image live on separate surfaces. |
| 8 | Scheduling / publication | **Working** | `adelaide-time.ts`, `article-lifecycle.ts`, `publish-due-articles.ts`, `POST /api/articles/schedule`, `/api/cron/publish-scheduled`, root cron `0 0 * * *` | Explicit-offset scheduling; UTC wall-clock storage under Production UTC session; `scheduledFor <= now` prevents early publish. Calendar page is inventory, not policy. Idempotent publish via `alreadyApplied`. |
| 9 | Social distribution | **Working, dual-gated** | `auto-generate-social.ts` (post-publish drafts), social approve + platform publish routes, X URL guards | Drafts require separate publishing-editor approval. Canonical `/blog/{slug}` URL must be present before X publish. |
| 10 | Monitoring / recovery / incidents | **Partial** | EV-OPS-01 (`ops/ev-ops-01`), director-checklist monitoring + operational events, health routes | Strong public/auth health monitoring. Article-stage failure alerts and evidence-recovery automation are incomplete. |

### Proven end-to-end spine (preserve)

Recent EV-EDITORIAL-01…05 operations proved the governed human path works when driven deliberately:

AI Generator / prepare-for-review → current audit → Director approve → featured image → schedule (`2026-11-22T22:30:00.000Z`) → cron publish-due → (later) social draft/approve/publish.

---

## 2. Working components to preserve

Do **not** replace or fork these:

1. `transitionArticleLifecycle` + `publicationGuard` + research publish-ready thresholds  
2. Audit fingerprint association (including dual-zone matcher)  
3. `parseSchedulingTimestamp` / Adelaide wall-clock helpers  
4. `requireEditorAuth` / `requirePublishingEditor` / cron auth  
5. Featured-image prompt binding to content fingerprint  
6. `publishDueArticles` due comparison and publish idempotency  
7. Autonomous pipeline lockdown (no research-skip packaging)  
8. Social dual gate (article publish ≠ X publish)  
9. Director checklist as **derived evidence view** (do not invent statuses)  
10. EV-OPS-01 external monitoring pattern  

**Hard rule:** do not introduce a second publishing engine. Compose a stage orchestrator on top of the above.

---

## 3. Confirmed gaps

| ID | Kind | Deficiency | Smallest safe change |
| --- | --- | --- | --- |
| G1 | Integration | No single orchestrator advances stages with retries/HOLD while stopping for human approval. Legacy `/api/pipeline` auto-schedules and bypasses the intended Director gate. | Add a **stage runner** that only invokes existing libraries/routes; never call legacy auto-schedule; stop at `review-required` / image / schedule waits. |
| G2 | Missing (ops exists) | Evidence recovery is manual ops scripting, not platform automation with bounded retries. | Stage-local retry for transient fetch/upload; escalate unsupported claims to HOLD/review without score gaming. |
| G3 | Integration | Featured image is a separate multi-click path after approval. | After approval, enqueue prompt draft + optional auto-generate once prompt approved (still human prompt approval unless Director pre-authorises a template policy). |
| G4 | Integration / UX | Director experience split across articles, audit, checklist, calendar, scheduled, social, operations. Checklist is read-only. | Unify actions into one Decision Board on `/admin/director-checklist` (or successor) calling existing mutation routes. |
| G5 | Missing | No Director-authorised calendar **rules** that auto-pick next slot after approval. Calendar page lists articles only. | Policy table/config: allowed slots + cadence; scheduler assigns next free slot **after** approval, using `parseSchedulingTimestamp`. |
| G6 | Partial | Failure alerts are mainly site/auth health; article-stage failures not consolidated for Director. | Extend checklist monitoring + optional EV-OPS-01 article probes / Resend for stage Failed. |
| G7 | Defect (ops) | Featured-image upload can fail transiently immediately after OpenAI generation in-process. | Retry/backoff in upload path; optional generate→cache→upload separation (already proven in EV-04 ops). |
| G8 | Design | No first-class `HOLD` article status; “blocked” exists on audit recommendation only. | Prefer review-note + checklist Blocked/Failed + keep `review-required`; only add status if unavoidable. |

---

## 4. Proposed unified architecture

```
Discovery/Plan (auto, bounded)
    → Draft generate (auto)
    → Research prepare-for-review (auto, retries on transient fetch)
    → Evidence/Audit (deterministic)
         ├─ publish-ready → queue for Director
         └─ unsupported / blocked → HOLD (no score elevation)
    → Director Decision Board (human ONLY gate for approval)
         ├─ approve → Featured image stage (prompt approve → generate/attach)
         ├─ reject / request changes → back to editorial
         └─ set/confirm schedule (or accept next calendar slot)
    → Scheduler cron publish-due (timestamp lte now)
    → Social draft generate (auto) → human social approve → platform publish
    → Monitoring (checklist + EV-OPS-01)
```

### Design principles

- **Composition:** orchestrator calls existing modules; no parallel publish path.  
- **Human authority:** no article bypasses editorial approval; calendar may be pre-authorised for *slots*, not for *content*.  
- **Idempotency:** reuse lifecycle `alreadyApplied`, social “posts already exist”, schedule repeat-same-instant.  
- **Time:** store UTC instants with explicit offsets; display Adelaide.  
- **Honesty:** retries only for transient I/O; never fabricate verification or raise scores.  

### Director experience (Phase 3)

One Decision Board queue:

- Awaiting approval (current audit + blockers + evidence summary)  
- Full article + sources  
- Audit scores / unresolved claims  
- Featured-image preview or prompt state  
- Approve / Reject / Request changes  
- Confirm schedule (next policy slot or explicit Adelaide datetime)  
- Scheduled / published lists  
- Failures needing attention (from checklist monitoring + ops events)

---

## 5. Minimal implementation roadmap

| Priority | Milestone | Acceptance criteria |
| --- | --- | --- |
| **P0** | Reliable end-to-end orchestration | Stage runner advances draft→research→audit→**stop for review**; retries transient failures; HOLD on unsupported; never auto-approve/publish; legacy `/api/pipeline` auto-schedule unreachable or gated off; tests for stage transitions + lockdown preserved. |
| **P1** | Automated evidence recovery | Transient source fetch/upload retries with backoff; unsupported claims produce clear HOLD/review package; no gate threshold changes; focused regression tests. |
| **P2** | Automated featured-image preparation | Post-approval enqueue; prompt approval retained; generate+attach with upload retries; article remains approved; audit stays current. |
| **P3** | Unified Director approval dashboard | Single surface for review/approve/reject/request-changes + image preview + schedule confirm; mutations via existing auth routes; checklist monitoring embedded. |
| **P4** | Calendar-driven scheduling | Director-authorised slot policy; after approval(+image), assign next slot via governed schedule API; cron remains due-comparison only. |
| **P5** | Social + operational monitoring | Keep dual social gate; optional draft prep after publish; Director-visible failure alerts; EV-OPS-01 extended for scheduled-due / publish-verify probes. |

Do not assume a milestone is missing until inspection shows it — several pieces already exist and only need composition (checklist, lifecycle, image, cron, social, EV-OPS-01).

---

## 6. First recommended implementation milestone

**P0 — Editorial Stage Runner (compose-only)**

Scope:

1. Define explicit stage IDs aligned to Director checklist + HOLD.  
2. Implement a worker/API that runs **only** automated pre-approval stages using existing prepare/generate libraries.  
3. Disable or hard-gate legacy `/api/pipeline` auto-schedule path.  
4. Persist stage attempts/errors as operational events or review notes (no schema expansion if avoidable).  
5. Tests: lockdown remains; runner stops at `review-required`; retry does not duplicate articles; publish/approve never invoked.

Out of scope for P0: dashboard redesign, calendar policy, social automation, Production deploy without separate GO.

---

## 7. Risks and acceptance gates

| Risk | Mitigation / gate |
| --- | --- |
| Reviving auto-schedule bypass | Explicit forbid in P0; test that runner cannot schedule/publish |
| Second publishing engine | Architecture review rejects any duplicate lifecycle |
| Score gaming via “recovery” | Recovery limited to fetch/upload retries; scores remain deterministic |
| Timezone early publish | Keep explicit-offset parse + UTC session storage + `lte now` |
| Director UX still multi-hop after P0 | Acceptable; P3 is the UX consolidation |
| Cron lag after due time | Prefer late over early (already policy) |
| Auth bypass in ops scripts | Production mutations only via authenticated app routes in productised path |

**Programme acceptance (later):** Director manages editorial decisions; platform handles technical workflow; every published article still has human approval, publish-ready current audit, and governed schedule/publish.

---

## P0 implementation note

Implemented locally under EV-EDITORIAL-07-P0:

- `lib/publishing/editorial-stage-runner.ts`
- `app/api/articles/editorial-stage-runner/route.ts`
- Legacy auto-schedule lockdown (`lib/publishing/legacy-auto-schedule.ts`, `/api/pipeline/auto-schedule`, `/api/pipeline`)

## STOP

Awaiting Director **GO / HOLD / NO-GO** on **isolated Preview validation** of P0, then separately on P1+. No Production deploy is authorised by P0.
