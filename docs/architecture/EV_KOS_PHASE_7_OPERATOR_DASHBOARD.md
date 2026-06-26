# EV-KOS Phase 7A - Operator Dashboard Foundation

## Status

Phase 7A creates the first unified EV-KOS operator dashboard. It is read-only
and surfaces system state without triggering generation, approvals, publishing,
graph writes, social posting, or database writes.

## Files

- `lib/ev-kos/operator-dashboard.ts`
- `app/api/ev-kos/operator-dashboard/route.ts`
- `app/admin/ev-kos/page.tsx`

## Dashboard Sections

- System readiness
- Research missions
- Content campaigns
- Draft preview pipeline
- Review queue
- Approval packages
- Graph readiness
- Knowledge graph safety
- Publishing safety
- Recent blockers
- Recommended next actions

## API Shape

Route:

```text
GET /api/ev-kos/operator-dashboard
```

The route returns:

- `readinessScore`
- `readinessStatus`
- `missionSummary`
- `campaignSummary`
- `draftSummary`
- `reviewSummary`
- `approvalSummary`
- `graphSummary`
- `publishingSummary`
- `safetyFlags`
- `blockers`
- `recommendedActions`

## Safety Flags

The dashboard explicitly reports:

- `writesToPrisma: false`
- `graphWrites: false`
- `graphDeletes: false`
- `automaticApprovals: false`
- `automaticPublishing: false`
- `socialPosting: false`
- `openAiCalls: false`

## UI Boundary

The admin page intentionally has no:

- approve buttons
- reject buttons
- publish buttons
- generation buttons
- graph write buttons
- social posting buttons

It is a read-only operating surface.

## Implementation Notes

The dashboard composes the existing dry-run research mission engine and the
governed draft preview engine. It summarizes graph readiness and publishing
safety as operator status without invoking graph transactions, Prisma writes,
OpenAI calls, or publication actions.

## Phase 7B Recommendation

Phase 7B should add governed operator action preview controls. Those controls
should still default to dry-run and should require explicit operator intent
before any later approval, generation, graph-write, or publishing execution path
is introduced.
