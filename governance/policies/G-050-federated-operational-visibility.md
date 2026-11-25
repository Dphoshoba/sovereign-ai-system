# G-050 — Federated Operational Visibility

**Classification:** Design Constraint
**Scope:** Federated Observability (8D)

## Rule

1. **Node-Bound Health Reporting** — Health reports must be attributed to a registered node. Reports for unknown nodes must be rejected.
2. **Deterministic Aggregation** — `getDistributedHealth()`, `getAnalytics()`, `getDashboard()`, and `getGlobalSummary()` must produce deterministic results from identical health reports and telemetry.
3. **Passive Aggregation** — The observability layer aggregates reported data only. It must not poll, probe, or initiate health checks on nodes.
4. **Telemetry Attribution** — Every telemetry event must be attributed to a source node. `reportTelemetry` for unknown nodes must be rejected.

## Rationale

Federated observability provides cross-platform visibility without assuming control over individual nodes. Nodes report their own health and telemetry; the federation layer aggregates and presents. This preserves node autonomy while enabling global operational awareness.

## Enforcement

- Verified via tests that health reports for unknown nodes throw `FederatedObservabilityError`.
- Verified via tests that distributed health correctly aggregates healthy/degraded/unreachable statuses.
- Verified via tests that analytics derive deterministically from telemetry data.
- Verified via tests that the dashboard and global summary produce consistent snapshots.

## Relationship to G-047 through G-049

- G-047 provides the node identity basis for health and telemetry attribution.
- G-048 provides the execution tracking data that feeds telemetry.
- G-049 provides the governance context that observability reports alongside health.
- G-050 provides the visibility layer that closes the federation loop: membership → coordination → governance → observability.
