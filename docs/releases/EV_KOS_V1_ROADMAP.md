# EV-KOS V1 Roadmap

## Purpose

This document summarizes the recommended path after the V1 release candidate freeze.

## Current Candidate Position

EV-KOS V1 RC is a governed, non-executing platform foundation.

Current milestone: `V1_RC_FREEZE`

Recommended next milestone: `RC-7 Guard Enforcement Prototype`

## Near-Term Roadmap

### RC-7 - Guard Enforcement Prototype

Goal:

Add report-only and test-only guard prototypes that prove how authentication, authorization, route guards, rate limits, startup checks, and telemetry redaction will be enforced.

Must remain blocked:

- Execution.
- Publishing.
- Social posting.
- Graph writes beyond explicit test-write controls.
- OpenAI generation.
- Sessions.
- JWTs.
- Auth provider integration unless separately approved.

Exit criteria:

- Route guard prototype covers operator, ontology, content, research, release, production, security, and observability route families.
- Guard failures return consistent read-only findings.
- Negative tests remain non-mutating.
- Release score improves without changing business behavior.

### RC-8 - Auth Provider Decision And Integration Plan

Goal:

Finalize provider choice and implementation plan for production operator identity.

Recommended direction:

- Clerk for first production operator identity.
- Provider-neutral EV-KOS role and permission layer.
- Organization and workspace scoping as mandatory authorization context.

Exit criteria:

- Provider selected.
- Environment requirements finalized.
- Session and JWT strategy approved or explicitly avoided.
- Route enforcement rollout plan approved.

### RC-9 - Rate Limit And Startup Gate Implementation Plan

Goal:

Turn RC-6 policy recommendations into implementation-ready work packages.

Recommended direction:

- Middleware-level policies.
- Upstash-backed production counters.
- In-memory local fallback only.
- Production-only startup boot gate.

Exit criteria:

- Enforcement design approved.
- Failure modes documented.
- Rollback plan defined.

### RC-10 - Telemetry And Redaction Implementation Plan

Goal:

Prepare persistent observability without leaking sensitive tenant, operator, or research data.

Recommended direction:

- Sentry plus structured logs first.
- OpenTelemetry after route guard enforcement.
- Explicit redaction map for payloads, prompts, claims, citations, tenant ids, and operator metadata.

Exit criteria:

- Event taxonomy approved.
- Redaction policy approved.
- Transport provider approved.

## Post-RC V1 Production Enablement

Before any production execution:

- Integrate approved auth provider.
- Enforce authorization at route boundaries.
- Enforce rate limits.
- Enable production startup gate.
- Add telemetry transport and redaction.
- Complete live non-mutating negative tests.
- Confirm tenant and workspace scoping on all high-risk routes.
- Confirm approval and audit paths with production identity.

## Later V1 Enhancements

After production guardrails are active:

- Persist governed ingestion audit.
- Mature review queue UI.
- Add graph write approval flow.
- Add entity upsert execution.
- Add real embedding generation behind approval.
- Add vector search behind tenant scoping.
- Add draft generation preview-to-execution pipeline behind approval.
- Add publication queue integration behind approval.

## What Must Not Be Built Yet

- Unrestricted autonomous execution.
- Automatic graph ingestion.
- Automatic publishing.
- Automatic social posting.
- Automatic approvals.
- Direct OpenAI generation from operator preview routes.
- Broad graph rewrites.
- New graph layer replacing the canonical tenant semantic graph.
- Auth/session/JWT shortcuts that bypass EV-KOS roles and permissions.

