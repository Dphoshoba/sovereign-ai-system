# EV-KOS Enterprise Alpha Beta Plan

## Beta Readiness

Beta readiness score: `63`

Enterprise Beta is planned, not enabled.

## Recommended Beta Path

1. Perform Enterprise Alpha merge review without enabling runtime behavior.
2. Select the canonical enterprise authentication provider.
3. Define tenant-aware session and identity mapping.
4. Implement report-only route guard wrappers first.
5. Add rate limit enforcement in preview or staging.
6. Map audit evidence to approved persistence.
7. Connect review-board decisions to existing governance approval contracts.
8. Wire deployment gates into CI and environment promotion checks.
9. Run negative tests proving execution, publishing, graph writes, OpenAI calls,
   and approval bypass remain blocked.
10. Only then consider controlled Enterprise Beta runtime enablement.

## Beta Entry Criteria

- Auth provider approved.
- Session strategy approved.
- Route guard enforcement approved.
- Tenant boundary enforcement verified.
- Audit persistence approved.
- Rate limiting active.
- Startup gates active.
- Enterprise deployment gates wired to CI.
- No unsafe legacy route bypasses remain.

## Beta Non-Goals

Enterprise Beta should not immediately add autonomous execution, automatic
publishing, unrestricted graph writes, OpenAI generation, or automatic approvals.
Those capabilities require later phase-specific approval.
