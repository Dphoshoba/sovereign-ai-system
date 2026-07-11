# GAMMA OS BOUNDARIES

## Purpose
This document defines strict boundaries for Gamma OS to prevent architectural duplication.

## Gamma OS Rule #1
**Gamma OS owns orchestration, not implementation.**

Gamma OS coordinates existing systems and does not replace their business logic.

---

## 1) What Gamma OS owns

Gamma OS owns cross-system coordination concerns only:

- Orchestration across existing platform modules
- Governance and policy enforcement before dispatch
- Service coordination between subsystems
- Capability discovery and capability routing
- Policy evaluation (approval/audit/review/security/org constraints)
- Adapter resolution (mapping Gamma OS abstractions to existing modules)
- Unified status and health projection (aggregation only)

Gamma OS may expose a unified platform facade, but it must remain adapter-first and non-invasive.

---

## 2) What Gamma OS explicitly does not own

Gamma OS does **not** own or duplicate:

- Connector execution
- Memory storage
- Workflow runtime implementation
- Analytics calculations
- Plugin business logic
- Approval engines
- Queue engines
- Connector-specific OAuth/API logic
- Autonomous publishing

Additional prohibitions:

- No new persistence layer implied by Gamma OS
- No replacement of existing source-of-truth readers/runtimes
- No mutation of existing module API/function signatures as part of integration
- No direct connector internals bypassing Connector SDK boundaries

---

## 3) Existing modules that remain source of truth

The following existing modules remain authoritative and must be reused through adapters.

### Connector SDK (execution/auth boundary)
- `lib/connectors/sdk/base-authenticator.ts`
- `lib/connectors/sdk/base-connector.ts`
- `lib/connectors/sdk/connector-types.ts`
- `lib/connectors/sdk/index.ts`

### Gamma Flow (workflow definitions/templates/schema)
- `src/lib/gamma-flow/types.ts`
- `src/lib/gamma-flow/schema.ts`
- `src/lib/gamma-flow/mock-data.ts`
- `src/lib/gamma-flow/workflow-templates.ts`
- `lib/gamma/flow-registry-reader.ts`

### Mission Control
- `lib/gamma/mission-control-reader.ts`

### Second Brain / Shared Knowledge
- `lib/gamma/second-brain-reader.ts`
- `lib/gamma/shared-knowledge-reader.ts`

### Search / Graph / Relationship / Metadata readers
- `lib/gamma/search-reader.ts`
- `lib/gamma/graph-reader.ts`
- `lib/gamma/relationship-reader.ts`
- `lib/gamma/metadata-reader.ts`

### Organization / Tenant / Permissions / Approval readers
- `lib/gamma/organization-reader.ts`
- `lib/gamma/tenant-reader.ts`
- `lib/gamma/permissions-reader.ts`
- `lib/gamma/approval-workflow-reader.ts`
- `lib/gamma/approval-queue-reader.ts`
- `lib/gamma/human-review-reader.ts`

### Plugin System / Registry / Module Marketplace
- `lib/gamma/plugin-system-reader.ts`
- `lib/gamma/registry-reader.ts`
- `lib/gamma/module-marketplace-reader.ts`

### Planner / Review / Workflow / Queue / Execution / Audit readers
- `lib/gamma/planner-reader.ts`
- `lib/gamma/review-reader.ts`
- `lib/gamma/workflow-reader.ts`
- `lib/gamma/workflow-engine-reader.ts`
- `lib/gamma/runtime-queue-reader.ts`
- `lib/gamma/execution-reader.ts`
- `lib/gamma/execution-simulator-reader.ts`
- `lib/gamma/runtime-audit-reader.ts`

### Executive Dashboard / Analytics readers
- `lib/gamma/executive-dashboard-reader.ts`
- `lib/gamma/analytics-reader.ts`

---

## 4) Architecture rules (mandatory)

1. **Rule #1**: Gamma OS owns orchestration, not implementation.
2. **Adapter-first integration is required**:
   - Gamma OS integrates by adapting to existing modules.
   - Existing business logic remains in source systems.
3. **Existing API and function signatures remain unchanged**:
   - Integration cannot force broad refactors of source-of-truth modules.
4. **All new dispatch must pass Governance Policy Engine before orchestration**:
   - Required policy checks include approval, preview-only constraints, audit requirements, human review requirements, connector restrictions, org policies, and security policies.
5. **Mission Control and Gamma OS dashboards aggregate existing metrics**:
   - They do not recalculate or redefine analytics formulas already owned by analytics/executive systems.

---

## 5) Required Gamma OS abstraction layer (before runtime integration)

Before any Milestone 1 runtime integration, define only the thin abstraction layer:

- `src/lib/gamma-os/interfaces.ts`
- `src/lib/gamma-os/adapters.ts`
- `src/lib/gamma-os/service-registry.ts`
- `src/lib/gamma-os/capabilities.ts`

Governance policy engine modules (new, central gate):

- `src/lib/gamma-os/policies/policy-engine.ts`
- `src/lib/gamma-os/policies/policy-types.ts`
- `src/lib/gamma-os/policies/policy-registry.ts`

---

## 6) Consistency guardrails checklist

Use this checklist in every Gamma OS change review:

- [ ] No source-of-truth module is reclassified as Gamma OS-owned implementation.
- [ ] No duplicated runtime responsibility is assigned to Gamma OS.
- [ ] No new persistence/storage responsibility is introduced in Gamma OS.
- [ ] No live execution ownership is introduced in Gamma OS.
- [ ] No autonomous publishing ownership is introduced in Gamma OS.
- [ ] Connector interactions remain behind Connector SDK boundaries.
- [ ] Existing module metrics are aggregated, not recalculated in Gamma OS.
