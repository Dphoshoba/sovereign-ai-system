# EV-KOS Enterprise Beta Capabilities

Enterprise Beta capabilities remain planning and readiness surfaces only.
Nothing in this phase activates runtime enterprise auth or execution behavior.

## Completed Capabilities

| Capability | Beta Position |
| --- | --- |
| Provider decisioning | Provider comparison and checkpoints are documented in report-only form. |
| Session checkpointing | Session lifecycle, governance, and bootstrap contracts are defined. |
| Claim readiness | Tenant/workspace/actor claim requirements and validation contracts are defined. |
| Rollout sequencing | Provider rollout stages and cutover checkpoints are documented. |
| Dry-run governance | Runtime auth dry-run boundaries and feature-flag constraints are defined. |
| Rollback planning | Tenant-scoped rollback checkpoints, rollback controls, and rollback SLA targets are defined. |
| Go/no-go control | Explicit go/no-go criteria and scorecard contracts are documented. |
| Rehearsal design | Guarded activation rehearsal checkpoints and risk register are defined. |
| Pilot planning | Tenant-limited pilot cohorts, activation waves, operator holdpoints, and telemetry thresholds are defined. |

## Blocked Capabilities (By Design)

- Runtime auth activation.
- Middleware authorization integration.
- Session issuance and session storage.
- JWT issuance.
- Provider installation and provider runtime integration.
- Persistence implementation and write paths.
- Database writes, graph writes, and execution.
- Publishing behavior.
- OpenAI integration.

## Future Implementation Candidates

- Tenant-limited canary runtime pilots with explicit holdpoint approvals.
- Rehearsal-to-runtime handoff gates with enforced rollback SLAs.
- Provider integration implementation after dedicated merge review.
- Controlled middleware/session/JWT integration behind explicit activation gates.
