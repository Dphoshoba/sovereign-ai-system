# EV-KOS RC-3 Observability Foundation

## Purpose

RC-3 introduces read-only observability contracts for EV-KOS v1.0 release confidence. It adds health reporting, readiness metrics, logging event contracts, an error catalog, route guard audit summaries, and release confidence scoring.

## Non-Goals

- No execution controls.
- No schema changes or migrations.
- No authentication provider integration.
- No sessions or JWTs.
- No OpenAI calls.
- No publishing or social posting.
- No graph writes or deletes.
- No automatic approvals.

## Added Routes

- `/api/observability/health`
- `/api/observability/metrics`
- `/api/observability/readiness`

All routes are GET-only and read-only.

## Audited Areas

- Research
- Ontology
- Knowledge Graph
- Operator Dashboard
- Operator Intent
- Review Queue
- Approval Packages
- Campaign Engine
- Draft Preview
- Production Routes
- Security Routes
- Mission Routes
- Publishing Routes

## Health Model

The health route reports:

- Health score
- Service status
- Dependency status
- Route coverage
- Governance integrity
- Security integrity
- Execution status
- Blocked capabilities
- Critical issues
- Warnings

## Metrics Model

RC-3 metrics are readiness counters only. They do not read from the database. Graph and audit counts remain zero in this layer until persistent telemetry is approved.

## Logging Contract

The logging contract defines log levels and event shapes for audit, operator, governance, mission lifecycle, campaign, review, approval, error, and security events. No persistence is added.

## Route Guard Audit

The guard audit reports coverage for operator, mission, ontology, review, approval, production, security, content, graph, intent, and publishing route families. It identifies missing guards and recommended guards without enforcing them.

## Release Confidence

Release confidence combines architecture, governance, security, observability, operator, release readiness, and production readiness scores. RC-3 can report `READY_FOR_RC4`, but release remains blocked until auth, authorization, rate limiting, startup validation, and observability transport are enforced.

## RC-4 Recommendation

RC-4 should add automated guardrail tests and enforcement planning for authentication, authorization, rate limiting, startup validation, route guard coverage, and observability transport. Operator execution should remain blocked.
