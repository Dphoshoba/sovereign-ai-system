# Gamma OS Runtime Engine
## Stage 5

## Purpose
Stage 5 introduces the Gamma OS Runtime State Machine.

It consumes a Stage 4 `OrchestrationPlan` and projects:
- runtime sessions,
- route checkpoints,
- explicit operator/runtime events,
- immutable runtime snapshots.

Stage 5 does not execute connectors, own persistence, call networks, or bypass governance.

Strategic traceability:
- `docs/platform/GAMMA_2_MASTER_ROADMAP.md`

## Runtime Boundary
The runtime state machine is a projection layer only.

Allowed responsibilities:
- derive deterministic checkpoints from a governed orchestration plan,
- transition session status from explicit events,
- preserve blocker, warning, approval, audit, and preview state,
- expose immutable snapshot objects for downstream systems to store through existing owners.

Prohibited responsibilities:
- direct connector execution,
- workflow runtime implementation replacement,
- database or filesystem writes,
- autonomous publishing,
- hidden side effects,
- policy bypass.

## Public Surface
Runtime contracts live in:
- `src/lib/gamma-os/contracts.ts`

Runtime port:
- `RuntimeStateMachinePort`

Runtime implementation:
- `src/lib/gamma-os/runtime/runtime-state-machine.ts`

Public functions:
- `initializeRuntimeSession`
- `applyRuntimeEvent`
- `createRuntimeSnapshot`
- `RuntimeStateMachine`

## State Model
Runtime sessions can be:
- `preview-ready`
- `awaiting-approval`
- `awaiting-audit`
- `completed`
- `blocked`

Runtime checkpoints can be:
- `pending`
- `satisfied`
- `blocked`

Runtime events are explicit inputs:
- `preview-acknowledged`
- `approval-checkpoint-satisfied`
- `audit-checkpoint-satisfied`
- `session-blocked`

There is no runtime event for live execution.

## Validation
Stage 5 validation coverage:
- initialization from Stage 4 plans,
- blocked-plan projection,
- deterministic checkpoint ordering,
- guarded checkpoint transitions,
- non-mutation of prior sessions,
- immutable snapshot projection,
- no execution permission in runtime outputs,
- no persistence or connector execution signals.

Verified locally:
- `.\node_modules\.bin\vitest.cmd run tests\gamma-os`
- `.\node_modules\.bin\tsc.cmd --noEmit --pretty false`
