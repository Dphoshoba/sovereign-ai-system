# EV-KOS Enterprise Beta Risk Register

## Top Risks

| Risk | Severity | Current Mitigation |
| --- | --- | --- |
| Premature runtime activation | High | Activation remains blocked in all phases through EB-10. |
| Tenant blast-radius expansion | High | Tenant-limited cohorts and wave constraints are required. |
| Rollback uncertainty | High | Rollback checkpoints and SLA drill contracts are defined. |
| Approval bypass risk | Medium | Operator holdpoints and go/no-go criteria are mandatory. |
| Telemetry blindspots | Medium | Guardrail telemetry thresholds are required in pilot planning. |
| Scope drift across phases | Medium | Freeze documents lock candidate status and merge recommendation to review-only. |

## Risk Posture

Risk posture: `MANAGED_IN_REPORT_ONLY_MODE`

Enterprise Beta risk is controlled by documentation gates, explicit constraints,
and blocked runtime activation. Implementation risk remains deferred to future
approved phases.
