# Workstream G — Workforce Governance

## Objective

Extend organizational governance with workforce-specific policies covering onboarding, role assignment, capability approval, delegation limits, audit, retirement, succession, and version control.

## Workforce Policies

```yaml
WorkforcePolicy:
  policyId: "WP-001"
  name: "Advisory Agent Cannot Deploy"
  scope: "identity"          # identity | skills | communications | tasks | collaboration | performance | lifecycle
  effect: "deny"             # allow | deny | require-approval
  condition: "authorityLevel == 'advisory' && action == 'deploy'"
  description: "Advisory-level agents cannot deploy changes to production"
```

## Agent Lifecycle Events

```yaml
AgentLifecycleEvent:
  eventId: "evt-1"
  agentId: "EO-001"
  eventType: "onboarded"      # See full list below
  timestamp: 1710400000000
  performedBy: "AI-Ops-Human"
  detail: "Initial deployment with advisory authority"
```

### Lifecycle Event Types

| Event Type | Description | Authority Required |
|---|---|---|
| onboarded | Agent first deployed | AI Operations human |
| role-changed | Role or office changed | Office manager |
| capability-added | New skill or capability assigned | Capability owner |
| capability-removed | Skill or capability removed | Capability owner |
| suspended | Agent temporarily disabled | AI Operations human |
| reactivated | Agent restored after suspension | AI Operations human |
| retired | Agent permanently decommissioned | AI Operations human + office manager |
| version-updated | Agent version changed | Agent owner |

## Delegation Limits

| Authority Level | Max Delegation Depth | Max Subordinates |
|---|---|---|
| advisory | 0 (cannot delegate) | 0 |
| operational | 1 | 3 |
| supervisory | 2 | 10 |
| managerial | 3 | 25 |

## Governance Policies

| Policy | Rule | Enforcement |
|---|---|---|
| WGG-001 | Every AI worker must go through onboarding lifecycle | Platform lifecycle enforcement |
| WGG-002 | Capability additions require capability owner approval | Gamma OS Governance Gate |
| WGG-003 | Retirement requires dual authorization (AI Ops + office manager) | Gamma OS Governance Gate |
| WGG-004 | Agent versions are immutable; updates create new version | Platform version enforcement |
| WGG-005 | Suspended agents cannot receive or process tasks | Platform status enforcement |
| WGG-006 | Delegation limits are enforced by authority level | Platform delegation validation |
