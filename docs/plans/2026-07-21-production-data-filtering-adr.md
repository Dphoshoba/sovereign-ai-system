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

---

## Phase III — Client Model isTest Extension (2026-07-21)

**Status:** IMPLEMENTED

### Scope

Extended the `isTest` boundary from `CreatorLead` (Phase I) to all 5 client-domain models:

| Model | Seeded Records | Query Files Affected |
|---|---|---|
| `ClientProfile` | 3 clients | 4 files |
| `CreatorProposal` | 3 proposals | 8 files |
| `ClientProject` | 3 projects | 7 files |
| `ClientProjectTask` | 6 tasks | 5 files |
| `ClientInvoice` | 3 invoices | 9 files |

### Design Decision: Independent Fields, Not Relational Filtering

Each model carries its own `isTest Boolean @default(false)` field. Queries filter at the model level (`where: { isTest: false }`), not through relational joins. This preserves the independence of each domain boundary and avoids cascading deletions or joins that would break during testing.

### Schema Changes

```prisma
model ClientProfile     { ... isTest Boolean @default(false) ... }
model ClientProject     { ... isTest Boolean @default(false) ... }
model ClientProjectTask { ... isTest Boolean @default(false) ... }
model ClientInvoice     { ... isTest Boolean @default(false) ... }
model CreatorProposal   { ... isTest Boolean @default(false) ... }
```

### Seed Script

All 18 seeded records across the 5 models marked `isTest: true`.

### Query Filter Locations

**ClientProfile** — `opportunities.ts:30`, `platform-snapshot.ts:191`, `knowledge-graph.ts:272`, `client-intelligence.ts:126`

**CreatorProposal** — `opportunities.ts:28`, `recommendations.ts:463`, `automation-engine.ts:195`, `knowledge-graph.ts:273`, `business-memory.ts:197`, `client-intelligence.ts:165`, `revenue-intelligence.ts:288`, `strategy-adjustments.ts:614`

**ClientProject** — `opportunities.ts:31`, `recommendations.ts:464`, `risks.ts:36`, `platform-snapshot.ts:192`, `knowledge-graph.ts:268`, `business-memory.ts:146`, `client-intelligence.ts:137`

**ClientProjectTask** — `recommendations.ts:465`, `risks.ts:37`, `platform-snapshot.ts:195`, `knowledge-graph.ts:269`, `business-memory.ts:159`

**ClientInvoice** — `opportunities.ts:32`, `recommendations.ts:466`, `risks.ts:35`, `platform-snapshot.ts:190`, `knowledge-graph.ts:270`, `business-memory.ts:170`, `cfo-intelligence.ts:141`, `client-intelligence.ts:148`, `revenue-intelligence.ts:283`

### Test Results

305 tests passing across 19 test files, zero failures. 2 new regression tests added for decision quality stability.

## Phase IV — Governance Enforcement Platform (v1.1)

### Problem

The `isTest` pattern was enforced by developer convention. A future query could omit the filter and compile without error.

### Solution

A static governance validator (`scripts/governance-executive-data.ts`) that scans all `src/lib/executive/` files for Prisma queries on governed models and verifies `isTest: false` is present. Integrated into `npm run ci` and `npm run governance:executive-data`.

### Design Decisions

- **Regex-based static analysis** rather than AST parsing — sufficient for the pattern, no tooling overhead
- **CamelCase Prisma accessors** (`prisma.creatorLead.findMany()`) — matches the Prisma Client convention
- **`// executive-governance-ignore`** comment for approved exceptions
- **Exclusions:** `tests/`, `scripts/`, `prisma/` directories automatically excluded

### Validator Rules

- Exit code 0 when compliant, 1 when violations exist
- Reports: model, file, line, suggested fix
- Checks: `findMany`, `findUnique`, `findFirst`, `create`, `update`, `upsert`, `delete`
- Ignores: non-governed models, excluded directories, `governance-ignore` comments

### Test Results

316 tests across 20 files, zero failures. 11 governance-specific tests covering:
- Compliant queries (isTest present, existing where clauses, options)
- Missing filter detection
- Executive-governance-ignore exclusion
- All 6 governed models
- findUnique, findFirst, create, update operations
- Non-governed model exclusion

### CI Integration

`npm run ci` now includes `npm run governance:executive-data` as the validation gate before build and test.
