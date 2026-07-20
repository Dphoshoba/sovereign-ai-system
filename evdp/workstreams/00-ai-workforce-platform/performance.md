# Workstream F — Performance & Learning

## Objective

Each AI worker maintains operational metrics enabling consistent performance measurement, quality tracking, and continuous improvement across the entire workforce.

## Metrics Model

```yaml
AgentMetrics:
  agentId: "EO-001"
  periodStart: 1710000000000    # Start of measurement period
  periodEnd: 1710400000000      # End of measurement period
  tasksCompleted: 142
  averageResponseTimeMs: 3200
  qualityScore: 0.94
  escalationFrequency: 0.02      # Fraction of tasks escalated
  collaborationEffectiveness: 0.88
  utilization: 0.76              # Fraction of available time utilized
  governanceCompliance: 0.99     # Fraction of actions within policy
```

## Performance Goals

```yaml
PerformanceGoal:
  metric: "qualityScore"
  target: 0.90
  weight: 0.5            # Importance weighting for composite score
```

Goals can be set per-agent or per-office. Agents are evaluated against goals at defined intervals.

## Measurement Cadence

| Level | Cadence | Responsible |
|---|---|---|
| Per-task | Immediate | Platform records on task completion |
| Daily | Aggregated daily | Platform auto-computes |
| Weekly | Office-level review | Office manager agent |
| Monthly | Workforce-wide review | AI Operations human lead |

## Governance Policies

| Policy | Rule | Enforcement |
|---|---|---|
| WFF-001 | Metrics are recorded per agent per period | Platform metric enforcement |
| WFF-002 | Quality scores below 0.7 trigger performance review | Platform alert |
| WFF-003 | Governance compliance below 0.95 triggers governance review | Gamma OS Governance Gate |
| WFF-004 | Escalation frequency above 0.1 triggers role scope review | Platform alert to manager |
