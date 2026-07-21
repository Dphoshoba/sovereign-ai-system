# ADR: Executive Intelligence Production Data Filtering

**Decision ID:** EA-PROD-ADR-2026-001  
**Date:** 2026-07-21  
**Status:** IMPLEMENTED

---

## Problem

During the first Executive Morning Briefing after certifying Enterprise Architecture v1.0, the Executive Intelligence layer surfaced seeded/demo data alongside production business data. Specifically, 3 seeded `CreatorLead` records (Mia Calder, Jonah Reeve, Priya Anand) with `@example` email addresses appeared in executive opportunities and recommendations.

## Root Cause

The three briefing generators (`generateExecutiveOpportunities`, `generateExecutiveRecommendations`, `generateExecutiveRisks`) queried `CreatorLead.findMany()` without any database-level filtering. All leads — production and demo — were included in the executive intelligence pipeline. The seed script (`seed-executive-intelligence.ts`) had no mechanism to distinguish test data from production data.

**Investigation scope:** Full audit of all 10 Prisma models queried by the briefing pipeline (`src/lib/executive/opportunities.ts`, `recommendations.ts`, `risks.ts`) plus `platform-snapshot.ts`.

## Chosen Solution

### Schema: explicit `isTest` flag on `CreatorLead`

```prisma
model CreatorLead {
  // ... existing fields ...
  isTest Boolean @default(false)
}
```

New production leads default to `isTest: false`. Only explicitly seeded demo data carries `isTest: true`.

### Seed: mark all demo leads as test data

All 3 leads in `seed-executive-intelligence.ts` now carry `isTest: true`.

### Briefing generators: database-level filtering

- `opportunities.ts`: `prisma.creatorLead.findMany({ where: { isTest: false } })`
- `recommendations.ts`: `prisma.creatorLead.findMany({ where: { isTest: false } })`
- `platform-snapshot.ts`: `prisma.creatorLead.findMany({ where: { isTest: false } })`

Filtering occurs inside the generators (at the data layer), not in the route layer, maintaining the existing architectural separation.

### Briefing route: health calculation unchanged

`computeBriefingHealth()` is severity-penalty-based and does not depend on data volume. It remains appropriate after filtering.

## Alternatives Considered

1. **Email pattern matching** (`email NOT LIKE '%@example'`) — fragile, relies on convention, easily bypassed
2. **Separate test database** — operational overhead, doesn't scale for mixed environments
3. **Post-query in-memory filtering** — the current approach; fetches all data then filters in JS. Vulnerable to performance scaling

The `isTest` flag approach was chosen as the most robust, explicit, and maintainable solution.

## Operational Impact

- Existing production leads (isTest: false default) are unaffected
- Seeded demo data is automatically excluded after re-seeding
- New leads default to production-visible
- Zero API changes — the briefing endpoint returns the same shape
- Health calculation unchanged
- 303 tests pass, zero regressions

## Files Modified

| File | Change |
|---|---|
| `prisma/schema.prisma` | Added `isTest Boolean @default(false)` to `CreatorLead` |
| `scripts/seed-executive-intelligence.ts` | All 3 seeded leads get `isTest: true` |
| `src/lib/executive/opportunities.ts` | `creatorLead.findMany({ where: { isTest: false } })` |
| `src/lib/executive/recommendations.ts` | `creatorLead.findMany({ where: { isTest: false } })` |
| `src/lib/executive/platform-snapshot.ts` | `creatorLead.findMany({ where: { isTest: false } })` |
| `tests/executive-intelligence/executive-intelligence.test.ts` | 6 new regression tests |

## Migration Notes

After deployment, run `npx prisma db push` to apply the new column. Then re-run the seed script to update existing demo leads with `isTest: true`. All new leads default to `isTest: false`.

## Future Considerations

9 other executive intelligence files query `creatorLead.findMany()` without the `isTest` filter (`boardroom.ts`, `command-center.ts`, `knowledge-graph.ts`, `business-memory.ts`, `client-intelligence.ts`, `load-strategic-plan.ts`, `planning-cycle.ts`, `quarterly-review.ts`, `strategy-adjustments.ts`). These should be addressed in a follow-up programme to apply the same filter wherever executive intelligence data is consumed.
