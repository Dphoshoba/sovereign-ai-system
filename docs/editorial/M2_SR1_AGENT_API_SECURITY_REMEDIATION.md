# M2-SR1 — Agent API Security Remediation

**Status:** Complete — awaiting Director acceptance  
**Baseline:** `2317c951a35034e3e36e76216d064918fc5ac473`  
**Branch:** `cursor/autonomous-pipeline-lockdown-1605`  
**Nature:** Security remediation using existing `requireEditorAuth` only — no new engines, no migrations, no production deploy  
**Production posture:** remains **NO-GO** (promotion still not authorised)

## Consolidated verdict: **PASS**

Privileged `/api/agents/*` routes confirmed in M2-RR are now editor-gated. The seven Prisma writers and the director scheduler entry point reject unauthenticated callers before DB/scheduler work. Genuinely public / disabled stubs remain intentionally ungated. Autonomous Pipeline packaging remains disabled. Claim-selection-v15 failures are pre-existing relative to M2/SR1 and were not altered.

---

## 1. Inventory (112 routes)

| Class | Count | Treatment |
| --- | --- | --- |
| Total `app/api/agents/**/route.ts` | **112** | Full inventory |
| Editor-gated (`requireEditorAuth`) | **106** | Privileged compute, DB read/write, orchestration |
| Public / non-privileged allowlist | **6** | Justified exceptions below |
| Prisma writers (was 0 gated → now gated) | **7** | Priority remediation |
| Hard-disabled `501` stubs | **3** | Remain public stubs (no privileged work) |

### Public allowlist (justified)

| Route | Justification |
| --- | --- |
| `GET /api/agents/architecture-overview` | Static in-memory architecture metadata; no DB |
| `GET /api/agents/registry` | Static in-memory agent registry metadata; no DB |
| `GET /api/agents/subtitles/view` | Basename-scoped read from `public/subtitles` only |
| `GET|POST /api/agents/render-video` | Returns `501 disabled` stub |
| `GET|POST /api/agents/render-with-subtitles` | Returns `501 disabled` stub |
| `GET|POST /api/agents/youtube-publish` | Returns `501 disabled` stub |

### Priority Prisma writers (now require editor auth before work)

1. `script-generation`
2. `scene-planner`
3. `shorts-swarm`
4. `thumbnail-intelligence`
5. `timeline-builder`
6. `visual-assets`
7. `voiceover-director`

Also gated: `POST /api/agents/director` (starts persistent scheduler + reads `videoPerformanceMemory`) and all other non-allowlisted agent handlers (including DB-reading GETs and compute POSTs).

Auth import uses **relative** `lib/publishing/require-editor-auth` paths (Vitest/`@` alias resolves to `src/`, where this module does not live).

## 2. Autonomous Pipeline

| Control | Result |
| --- | --- |
| `POST /api/ai/autonomous-pipeline` | Still `requireEditorAuth` then `403 AUTONOMOUS_PIPELINE_DISABLED` |
| `POST /api/agents/autonomous-pipeline` | Still editor-gated (P0) |
| `POST /api/agents/execute-autonomous-pipeline` | Still editor-gated (P0) |

## 3. Claim-selection-v15 investigation

| Check | Result |
| --- | --- |
| Failures on current tree | **7 failed / 9 passed** in `tests/editorial/research-audit-claim-selection-v15.test.ts` |
| Independent of SR1 agent patches | **Yes** — same 7 failures with agent changes stashed |
| Touched by M2 P0–P5 commits? | **No material claim-selection change** — M2 range does not modify `article-claim-extractor.ts` or this test file; only incidental `claim-source-attribution.ts` constants for Biblical Authority |
| Product/test changes made in SR1? | **None** — failures recorded as known pre-existing gap; not “fixed” to greenwash |

## 4. Verification

| Suite | Result |
| --- | --- |
| `tests/security/agent-api-auth-remediation.test.ts` | **PASS** (inventory 112, writers 401, director 401, allowlist public, pipeline disabled) |
| `tests/editorial/autonomous-pipeline-lockdown.test.ts` | **PASS** |
| M2 editorial contracts (checklist / bible / reg / facebook) | **PASS** |
| `tsc --noEmit -p tsconfig.json` | **PASS** (exit 0) |

## 5. Residual risks (do not block SR1 PASS)

1. Public allowlist metadata endpoints still disclose high-level agent architecture names (intentional).
2. Authenticated editors can still invoke agent compute routes (by design).
3. Claim-selection-v15 and Docker concurrency suite remain open from M2-RR conditions.
4. Proposed Supabase SQL / unrelated dirty worktree still excluded from release.
5. Production promotion remains **NO-GO** until Director authorises a separate release after remaining M2-RR conditions.

## 6. Rollback

Revert this SR1 commit to restore prior unauthenticated agent behaviour. No schema migration is involved.

## 7. Production

**NO-GO.** No push, PR, deploy, migration, or live social publishing performed.
