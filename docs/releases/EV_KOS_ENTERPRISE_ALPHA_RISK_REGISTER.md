# EV-KOS Enterprise Alpha Risk Register

## Summary

Enterprise Alpha risk score: `43`

Risk status: `CONTROLLED_ALPHA_RISK_WITH_BETA_BLOCKERS`

The primary risk is not that Alpha enables unsafe behavior. It does not. The
primary risk is that the contract surface could be mistaken for runtime
readiness before Enterprise Beta enforcement work is complete.

## Risks

| Risk | Severity | Mitigation |
| --- | --- | --- |
| Contracts are not enforced at runtime | High | Keep execution blocked until auth, route guards, and audit persistence are implemented. |
| Audit evidence is not persisted | Medium | Require immutable audit persistence before Enterprise Beta execution controls. |
| Auth provider choice may reshape contracts | Medium | Use the RC-6 provider evaluation before implementation. |
| Main merge could broaden visible planning surface | Medium | Require human merge review, build, smoke, and safety-flag verification. |
| Deployment gates are not wired to CI | Medium | Treat EA-7 gates as planning until CI integration is approved. |
| Policy lifecycle is not enforced | Medium | Keep policies contract-only until enforcement and exception workflows are approved. |

## Accepted Alpha Risks

The above risks are accepted for Alpha only because no execution, persistence,
publishing, graph writes, OpenAI calls, auth integration, sessions, JWT, provider
installation, telemetry backend, schema changes, or migrations are introduced.
