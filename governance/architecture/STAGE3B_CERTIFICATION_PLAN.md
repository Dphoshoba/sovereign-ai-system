# Stage 3B Certification Plan

**Status:** PLANNING
**Parent:** Stage 3A frozen at `05631b9`

## Milestone Overview

| Milestone | Code Changes | Validation Gates |
|---|---|---|
| 3B.0 — Architecture & Governance | None | Document review |
| 3B.1 — Execution interfaces & capability contracts | Minimal | TypeScript, unit tests |
| 3B.2 — Execution pipeline | Yes | TypeScript, build, runtime tests |
| 3B.3 — Provider adapters | Yes | TypeScript, build, drive tests |
| 3B.4 — Rollback engine | Yes | TypeScript, build, rollback tests |
| 3B.5 — Safety & approval gates | Yes | TypeScript, build, governance tests |
| 3B.6 — Integration testing | None (feature-complete) | Full validation suite |
| 3B.7 — Certification & freeze | None | Full validation + review |

## Validation Gates

### Mandatory Gates (every implementation milestone)

| Gate | Command | Pass/Fail |
|---|---|---|
| TypeScript diagnostics | `npx tsc --noEmit` | Zero diagnostics |
| Production build | `npm run build` | Compiled successfully |
| Focused unit tests | `npx vitest run tests/platform/execution.test.ts` | 100% PASS |
| Stage 3A regression | Full Stage 3A test suite | No regressions |

### Stage 3B-Specific Gates (milestones 3B.2+)

| Gate | Scope |
|---|---|
| Execution pipeline tests | All pipeline paths reachable |
| Rollback tests | All rollback scenarios |
| Approval gate tests | All approval levels |
| Safety gate tests | Blocking conditions, kill switch |
| Adapter tests | Per-connector execution tests |
| Integration tests | End-to-end pipeline |
| Stage 3A non-regression | Frozen tests must still pass |

### Final Certification Gates (3B.7)

| Gate | Command |
|---|---|
| TypeScript | `npx tsc --noEmit` |
| Production build | `npm run build` |
| Focused runtime tests | Full execution test suite |
| Platform tests | All platform tests |
| Drive tests | All drive tests |
| Repository tests | All repository tests |
| Determinism | `npm run test:determinism` |
| Mutation reachability | Manual review + static analysis |
| Security review | Manual review |

## Required Evidence

For certification, the following must be archived:

1. Git status at certification commit
2. `git show` of certification commit
3. TypeScript output
4. Build output
5. Test runner output for each test suite
6. Determinism check output
7. Mutation reachability analysis
8. Security review
9. Updated GAMMA_PROGRESS.md

## Freeze Requirements

Before freezing Stage 3B:

1. All validation gates pass
2. Governance board approves
3. Tag created (convention: `gamma-drive-stage3b-execution-v1`)
4. Artifacts archived to `governance/certification/stage-3b/`
5. Stage 3A archive confirmed intact (no modifications)
6. Stage 3B milestone 3B.7 marked FROZEN

## Non-Regression Requirement

Every Stage 3B milestone must pass the complete Stage 3A test suite without modification. If a Stage 3A test fails after a Stage 3B change, the change is rejected.

## Determinism Guarantee (Stage 3B)

Stage 3B introduces controlled non-determinism in execution/verification/rollback phases. The determinism gate must verify:

- Planning phase remains fully deterministic
- Audit phase remains fully deterministic (execution outcomes are recorded, not computed)
- Non-deterministic elements are explicitly identified and excluded from hash computations
- Stage 3A determinism is not affected
