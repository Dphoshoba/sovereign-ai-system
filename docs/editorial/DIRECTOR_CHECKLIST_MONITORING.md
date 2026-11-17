# Director Checklist monitoring consolidation

**Programme:** M2-P4  
**Surface:** `/admin/director-checklist` and `GET /api/articles/director-checklist`  
**Mode:** Read-only operational view over existing records

## Purpose

Give Directors one trustworthy monitoring view on the existing Director Checklist spine:

AI Generator → Research → Audit → Human Approval → Featured Image → Publishing / Scheduler → Social

This is **not** a new monitoring engine, agent, or workflow state machine. It overlays evidence-based statuses on checklist steps derived from authoritative records.

## Monitoring statuses

| Status | Meaning |
| --- | --- |
| **Success** | Evidence shows the stage completed (e.g. current audit, approval metadata, published article, published X post). |
| **Pending** | Work is waiting, actionable, scheduled, or an X publish claim is in progress (`publishing`). |
| **Failed** | Evidence of failure (rejected article on approval stage; `social_publish_failed` operational event). |
| **Blocked** | Stage cannot proceed until a prior gate is satisfied (existing checklist blocked state). |
| **Unavailable** | Stage is not operable (archived article). |
| **Unknown** | Evidence is inconclusive (`social_publish_uncertain`). Do not invent success or failure. |

Automation does not invent missing evidence. Absence of an operational event is not treated as failure.

## Evidence sources (authoritative only)

| Stage | Sources |
| --- | --- |
| Generate / research | Article content, `researchSources`, `researchAudits` |
| Audit / verification | `resolveArticleAuditState`, audit scores / recommendation |
| Human approval | Article `status`, `approvedAt`, `approvedBy` |
| Featured image | `inspectFeaturedImagePromptState`, `featuredImage` |
| Publication | Article `status` (`scheduled` / `published`), publication readiness helpers |
| Social | `SocialPost` rows + `OperationalEvent` for those posts (`social_publish`, `social_publish_failed`, `social_publish_uncertain`, `social_publish_claimed`) |

## Security

- Admin page remains behind editor admin layout.
- API uses `requireEditorAuth`.
- Endpoints are read-only: no approve/publish/social mutations from this view.
- Autonomous Pipeline lockdown and publishing gates are unchanged.

## Related code

- `lib/publishing/director-checklist.ts`
- `lib/publishing/director-checklist-monitoring.ts`
- `lib/publishing/director-checklist-signals.ts`
- `app/admin/director-checklist/page.tsx`
- `app/api/articles/director-checklist/route.ts`
