# Release Observability Checklist

## Health

- [ ] `/api/observability/health` reports health score.
- [ ] Blocked capabilities remain explicit.
- [ ] Critical issues are visible.
- [ ] Governance and security integrity are included.

## Metrics

- [ ] `/api/observability/metrics` reports readiness counters.
- [ ] Metrics route remains database-free until telemetry persistence is approved.
- [ ] Release readiness is included.
- [ ] Graph write metrics do not imply graph writes.

## Logging

- [ ] Log levels are defined.
- [ ] Audit events are defined.
- [ ] Operator events are defined.
- [ ] Governance events are defined.
- [ ] Mission lifecycle events are defined.
- [ ] Campaign events are defined.
- [ ] Review and approval events are defined.
- [ ] Security and error events are defined.

## Route Guards

- [ ] Operator route guard gaps are documented.
- [ ] Mission route guard gaps are documented.
- [ ] Ontology and graph guard gaps are documented.
- [ ] Publishing route guard gaps are documented.
- [ ] Approval and audit coverage are scored.

## Release Confidence

- [ ] Release confidence route remains GET-only.
- [ ] No execution is added.
- [ ] No OpenAI calls are added.
- [ ] No publishing or social posting is added.
- [ ] No graph writes/deletes are added.
- [ ] No automatic approvals are added.
