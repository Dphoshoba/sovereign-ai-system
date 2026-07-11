# GAMMA OS CONSTITUTION
## Immutable Engineering Rules (Highest Authority)

## Purpose
Gamma OS exists to provide **governed orchestration** across the Gamma platform while preventing architectural duplication, uncontrolled side effects, and bypassed policy controls.

Gamma OS is the **coordination and governance layer**:
- It plans and routes workflow steps deterministically.
- It enforces governance constraints (approval / audit / review / security / organization).
- It integrates with existing platform systems through adapters and registries.

Relationship to the rest of the platform:
- Gamma OS is **not** a replacement for existing “source-of-truth” business logic.
- Gamma OS consumes platform capabilities/readers and produces **orchestration plans** only.
- Downstream execution remains owned by existing runtime modules and connector SDK boundaries.

> **This Constitution is authoritative.** If any guideline conflicts, follow this document first.

---

## Scope
### What this Constitution governs
This Constitution governs **all future engineering changes** to Gamma OS, including:
- orchestration logic (planning, routing, approval/audit gating)
- adapter/service registry integration
- deterministic capability discovery and dispatch ordering
- policy enforcement and contract shapes
- runtime/execution boundary design and governance overrides

### What this Constitution does *not* govern
This Constitution does not govern:
- connector implementations or connector-specific OAuth/API internals
- analytics formula correctness (already owned by analytics systems)
- workflow runtime implementation details inside execution modules
- persistence model design owned by existing runtime/persistence systems

---

## Immutable Engineering Principles
These rules are non-negotiable.

### Rule #1 — Orchestration ownership vs implementation
**Gamma OS owns orchestration, never implementation.**

Gamma OS may coordinate and route across modules, but must not replace business logic owned elsewhere.

### Rule #2 — Governance-first dispatch gating
**All dispatch must pass through the Governance Policy Engine.**

No dispatchable route may be produced without governance checks (including preview-only constraints, approvals, audit requirements, connector restrictions, organization/security rules).

### Rule #3 — Source-of-truth preservation
**Existing modules remain the sole source of truth.**

Gamma OS may adapt/aggregate/projection, but must not redefine or duplicate business logic that already exists.

### Rule #4 — No direct connector execution
**Gamma OS never executes connectors directly.**

Connector interactions must remain behind Connector SDK boundaries and must not be invoked from orchestration planning/routing code paths.

### Rule #5 — Deterministic planning
**Planning must be deterministic.**

Given identical inputs (and identical policy outcomes), Gamma OS must produce identical plans:
- stable ordering
- stable mapping resolution
- stable dependency graph construction

### Rule #6 — Runtime state is separate from execution
**Runtime state is separate from execution.**

Gamma OS must treat “plan / route / status projection” as separate from any execution side effects and persistent runtime writes.

### Rule #7 — Adapter-first integration (never rewrite-first)
**Integration is adapter-first, never rewrite-first.**

When integrating new subsystems:
- use adapters + service registry + capability mapping
- preserve existing API shapes
- integrate via interfaces/registries rather than rewriting modules

### Rule #8 — No persistence ownership
**No persistence belongs inside Gamma OS.**

Gamma OS may read and aggregate; it must not introduce new persistence ownership or “Gamma OS becomes the database” patterns.

### Rule #9 — No autonomous publishing
**No autonomous publishing.**

Gamma OS must never enable autonomous publishing; it may only produce governed orchestration outcomes that require human governance when publishing is at stake.

### Rule #10 — Human governance overrides automation
**Human governance always overrides automation.**

When approval, human review, audit, or security gates require human intent, Gamma OS must route through the required checkpoints.

---

## Prohibited Patterns
The following are explicitly prohibited:

1) **Direct connector execution**
- Calling connector SDK “execute” paths directly from orchestration/routing code.

2) **Bypassing GovernancePolicyEngine**
- Any dispatch route generation without policy checks.
- Any route that does not reflect governance-required blockers/warnings.

3) **Duplicated business logic**
- Reimplementing module logic (analytics formulas, workflow runtime semantics, connector OAuth/API specifics).

4) **Connector-specific OAuth/API implementation in Gamma OS**
- OAuth token logic, API client wiring, connector-specific scopes, connector-specific retries/timeouts.

5) **Analytics recalculation / redefinition**
- Recomputing analytics formulas owned by analytics/executive modules.

6) **New persistence ownership**
- Introducing new persistence adapters or database responsibilities inside Gamma OS.

7) **Network ownership**
- Establishing new network execution responsibilities in Gamma OS (beyond calling existing readers/config).

8) **Filesystem ownership**
- Introducing writeFile/readFile or filesystem persistence into Gamma OS.

9) **Autonomous publishing enablement**
- Producing execution outcomes that bypass approval/human governance.

10) **Hidden side effects**
- Any orchestration planning/routing step that performs side effects beyond deterministic plan construction.

11) **Non-deterministic planning**
- Using non-stable data sources for plan ordering without deterministic normalization.

---

## Source-of-Truth Contract
Gamma OS consumes—but never owns—the existing platform modules.

Gamma OS must treat these as authoritative:
- Connector SDK and connector SDK boundaries
- Gamma Flow (workflow definitions/templates/schema)
- Mission Control
- Shared Knowledge / Second Brain
- Search/Graph/Relationship/Metadata readers
- Organization / Permissions / Approval workflow readers/queues
- Plugin platform / registry / module marketplace readers
- Analytics and executive dashboard readers
- Queue / Approval / Execution / Audit readers

Gamma OS can:
- aggregate and project unified status/health
- resolve capabilities via adapters
- map orchestration steps into existing module routes

Gamma OS cannot:
- replace module business logic
- claim new ownership of runtime execution or persistence
- introduce autonomous publishing or live execution side effects

---

## Integration Contract
When integrating any new subsystem into Gamma OS:

1) **Existing APIs remain unchanged by default**
- Backward compatibility is the default expectation.

2) **Adapter-first integration**
- Use interfaces/adapters/registries; do not rewrite existing modules.

3) **Backward compatibility**
- Integrations must not require breaking changes to existing platform modules.

4) **No ownership transfer**
- Gamma OS never becomes the new “system of record” for persistence or runtime execution.

---

## Governance Contract
Every future Gamma OS subsystem must pass through:

**Contracts → Interfaces → Registry → Policies → Bindings → Orchestrator → (downstream runtime only via existing readers/routes)**

Interpretation:
- Contracts define plan shape and stable interfaces.
- Registry resolves services and capability mappings deterministically.
- Policies enforce governance constraints before any dispatchable routing result exists.
- Bindings translate abstract capabilities into existing platform routes/readers.
- Orchestrator composes the final orchestration plan, which downstream runtimes interpret.

---

## Change Control
To modify Gamma OS:

1) Architecture review
- Confirm the change preserves ownership and source-of-truth rules.

2) Deterministic validation
- Ensure ordering and plan stability.

3) Boundary validation
- Confirm no forbidden patterns are introduced (direct connector execution, bypassing policy, persistence ownership, network ownership, filesystem ownership, autonomous publishing enablement).

4) Regression testing
- Run Gamma OS tests (policies/bindings/orchestrator) and combined Gamma OS suite.

If any gate fails:
- fix only Gamma OS Stage 1–4 files or their tests
- do not touch unrelated platform modules
- rerun the failed check and then combined regression

---

## Enforcement Checklist (Required for Every PR / AI-generated change)
Every change to Gamma OS must satisfy:

- [ ] No source-of-truth module is reclassified as Gamma OS-owned implementation.
- [ ] No duplicated runtime responsibility is assigned to Gamma OS.
- [ ] No new persistence/storage responsibility is introduced in Gamma OS.
- [ ] No live execution ownership is introduced in Gamma OS.
- [ ] No autonomous publishing ownership is introduced in Gamma OS.
- [ ] Connector interactions remain behind Connector SDK boundaries.
- [ ] All dispatch routing is governance-gated via Governance Policy Engine.
- [ ] Planning is deterministic for identical inputs.
- [ ] Runtime state remains separate from execution side effects.
- [ ] No connector-specific OAuth/API implementation is added to Gamma OS.
- [ ] No analytics recalculation/redefinition is added to Gamma OS.
- [ ] Integration is adapter-first; no rewrite-first module changes.

---

## Consistency Note vs `GAMMA_OS_BOUNDARIES.md`
- `GAMMA_OS_BOUNDARIES.md` is **explanatory** and operationalizes boundaries.
- This Constitution is the **highest authority**: immutable engineering rules and prohibited patterns.

> If a reader finds any conflict between the two documents, the Constitution overrides.
