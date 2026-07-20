# G-041 — Observable Platform Behaviour

**Classification:** Observability Constraint
**Scope:** Analytics Engine (6C)

## Rule

All certified orchestration layers shall emit sufficient telemetry to enable deterministic measurement, audit, and analysis. Observability shall remain non-invasive and shall not alter execution behaviour.

## Rationale

Telemetry-driven observability provides the foundation for platform understanding, capacity planning, and operational insight. Non-invasive observability guarantees that measurement does not change the system being measured.

## Enforcement

- Verified via regression tests that confirm analytics queries return identical results for identical input event data.
- Verified via structural checks that the analytics engine does not expose execution-control methods (no `alter`, `reprioritize`, or `allocate` methods).

## Relationship to G-039 and G-040

G-039 ensures deterministic planning, G-040 ensures deterministic scheduling, and G-041 extends determinism to observability. Together they guarantee that the full planning-to-scheduling-to-observability pipeline produces reproducible results.
