# EV-EDITORIAL-07-P0U — Unified Director Preparation Interface

**Status:** Implemented locally (awaiting Preview validation GO)  
**Scope:** UI + composition only. No Production deploy. No P1–P5.

## Workflow

1. Director opens `/admin/ai-generator`.
2. Enters a topic (or an existing draft article ID).
3. Clicks **Prepare for Director Review**.
4. Platform:
   - Topic path: `POST /api/ai/generate-article` with `directorPrepare: true` → creates **draft** + sources (no pre-approval image, no inline audit) → `runEditorialStages`.
   - Existing draft path: `POST /api/articles/editorial-stage-runner` with `{ articleId }`.
5. UI shows outcome: `ready_for_human_review` | `already_applied` | `hold` | `failed`.
6. On success, navigates to `/admin/articles/{id}/edit` for human review.
7. HOLD offers safe retry via the stage runner only.

Article list **Prepare for Director Review** button also targets the stage runner (no parallel prepare path).

## Governance preserved

- No auto-approve / schedule / publish / social
- No featured image on the Director prepare path
- Immutable statuses rejected by the runner
- Legacy `/api/pipeline/auto-schedule` remains 410

## Tests

- `tests/editorial/director-prepare-p0u.test.ts`
- Existing `tests/editorial/editorial-stage-runner.test.ts`
- Existing automation-endpoint-auth / lifecycle suites
