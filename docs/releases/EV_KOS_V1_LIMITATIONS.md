# EV-KOS V1 Limitations

## Purpose

This document records the intentional limitations of the EV-KOS V1 release candidate. These limitations are part of the release safety posture and must not be treated as accidental missing features.

## Intentional Non-Execution

EV-KOS V1 RC is intentionally non-executing.

Blocked:

- Operator action execution.
- Autonomous research execution beyond preview/planning contracts.
- Draft generation execution.
- Publication execution.
- Social posting.
- OpenAI generation from release, operator, content, or graph readiness paths.
- Automatic approval.
- Automatic graph ingestion.

## Authentication And Authorization Limits

V1 RC defines authentication and authorization contracts but does not enforce them in production.

Not included:

- Auth provider integration.
- Session handling.
- JWT implementation.
- Provider-backed operator identity.
- Route-level production authorization middleware.
- Runtime permission enforcement at every route boundary.

The recommended provider path is Clerk with provider-neutral EV-KOS authorization contracts, but this is not implemented in V1 RC.

## Rate Limiting Limits

Rate-limit policies are documented but not enforced.

Not included:

- Middleware counters.
- Redis or Upstash integration.
- Vercel Edge rate limiting.
- Production throttling.
- Escalation enforcement.

## Startup Enforcement Limits

Startup validation remains report-only.

Not included:

- Production boot blocking.
- Staging-specific enforcement.
- Preview environment enforcement.
- Secret validation beyond readiness reporting.

## Observability Limits

Observability is contract-ready but not fully operationalized.

Not included:

- Persistent telemetry backend.
- Sentry integration.
- OpenTelemetry tracing.
- PostHog analytics.
- Vercel Analytics integration.
- Structured log persistence.
- Runtime redaction enforcement.

## Graph Limits

The canonical graph is selected, but broad graph ingestion is blocked.

Not included:

- Automatic graph writes from ontology.
- Automatic graph updates.
- Graph deletes.
- Production-grade entity upsert execution.
- Real embedding generation.
- Vector search.
- Persisted ingestion audit beyond existing safe review/intention packages.
- Broad graph route refactors.

The existing explicit test-write path remains tightly gated and is not an automatic ingestion path.

## Content And Publishing Limits

The content system is orchestration-ready but generation and publishing remain blocked.

Not included:

- AI draft generation.
- Draft persistence.
- Automatic campaign execution.
- Publication queue execution from EV-KOS.
- Social posting.
- Email sending.
- YouTube upload or scheduling from EV-KOS RC flows.

## Operator Limits

The operator dashboard is read-only and preview-only.

Not included:

- Execute buttons.
- Approve/reject controls from the operator dashboard.
- Publish controls.
- Graph write controls.
- Generation controls.
- Production operator session handling.

## Production Limits

EV-KOS V1 RC should not be considered production-executable until:

- Auth provider is approved and integrated.
- Authorization is enforced at route boundaries.
- Rate limiting is enforced.
- Startup gate is approved and enabled for production.
- Telemetry transport and redaction are implemented.
- Legacy publishing/social/graph route negative tests are completed.
- Approval and audit paths are verified end to end under production identity.

