# EV-KOS V1 Risk Register

## Purpose

This document records the V1 release candidate risks, severity, current mitigation, and recommended next action.

## Risk Summary

| ID | Risk | Severity | Status | Mitigation | Next Action |
| --- | --- | --- | --- | --- | --- |
| R1 | No production auth provider is integrated. | High | Open | Auth contracts and provider evaluation exist. | Select provider and implement in a future approved RC. |
| R2 | Authorization contracts are not enforced at route boundaries. | High | Open | Roles, permissions, and route audits exist. | Add report-only guard prototypes, then enforcement. |
| R3 | Rate limiting is defined but not implemented. | High | Open | Policies and recommended production backend exist. | Implement middleware and Upstash counters after approval. |
| R4 | Startup validation is report-only. | Medium | Open | Required envs are documented. | Add production boot gate after approval. |
| R5 | Observability has contracts but no telemetry backend. | Medium | Open | Logging, metrics, error catalog, and route audits exist. | Add Sentry and structured logging transport. |
| R6 | Legacy execution/publishing/social routes require deeper live negative tests. | High | Open | Release validation and guardrail contracts exist. | Build non-mutating negative test harness for those routes. |
| R7 | Graph ingestion is not production-ready. | High | Controlled | Graph writes are blocked except explicit test-write gate. | Keep blocked until entity upserts, approval, audit, and auth are enforced. |
| R8 | Real embeddings and vector search are absent. | Medium | Accepted | Placeholder-safe graph planning avoids fake embeddings. | Add real embeddings only after graph write controls mature. |
| R9 | Operator intent packages may be mistaken for execution approval. | Medium | Controlled | Docs state operator intent packages only and no action execution. | Improve UI labels and approval state display. |
| R10 | Content preview may be mistaken for generated content. | Medium | Controlled | Draft preview docs state no generated text. | Keep preview packets visibly contract-only. |
| R11 | Tenant isolation is contract-audited but not fully enforced everywhere. | High | Open | Security audits and role contracts exist. | Tie route guards to organization and workspace scope. |
| R12 | Documentation drift as phases continue. | Medium | Open | V1 RC freeze centralizes release docs. | Update release docs only through approved release branches. |

## Highest Priority Risks

1. Auth provider selection and integration.
2. Route-level authorization enforcement.
3. Rate-limit enforcement.
4. Legacy negative tests for publishing, social, graph, and execution surfaces.
5. Startup gate enforcement.
6. Telemetry transport and redaction.

## Current Safety Controls

- Execution remains blocked.
- Publishing remains blocked.
- Social posting remains blocked.
- OpenAI calls are not introduced by RC systems.
- Graph writes remain blocked except controlled explicit test-write gates.
- Automatic approvals remain blocked.
- Operator dashboard is read-only.
- Operator actions are preview-only.
- Review and intent packages do not execute actions.

## Residual Risk

Residual risk level: `MEDIUM_HIGH`

The platform is suitable for V1 release-candidate freeze as a non-executing governed foundation. It is not suitable for production execution until the high-priority risks are closed.

