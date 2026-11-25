# Workstream E — Human Collaboration

## Objective

Every AI worker must know when to ask, when to recommend, when to act autonomously, when to escalate, and when to stop. This workstream defines the collaboration modes and rules that govern human–AI interaction.

## Collaboration Modes

| Mode | Agent Action | Human Role | Example |
|---|---|---|---|
| inform | Acts, then notifies | Informed, can override | Routine daily briefing |
| consult | Requests input, then acts | Provides guidance | Research methodology selection |
| recommend | Proposes action, waits for decision | Decides | Strategic recommendation |
| act-autonomously | Acts within defined scope | Monitors via dashboards | Content publishing within brand guidelines |
| escalate | Passes to human for resolution | Resolves | Customer complaint escalation |
| stop | Ceases activity, awaits direction | Provides direction | Governance boundary violation |

## Mode Selection Logic

1. Agent identifies the action type.
2. Agent looks up the CollaborationRule for that action type.
3. Agent applies the default mode.
4. If the action involves a risk score above threshold, mode upgrades one level (e.g., inform → consult).
5. If the action involves a new/unseen context, mode upgrades to consult or recommend.

## Human Collaboration Model

```yaml
CollaborationRule:
  actionType: "publish-content"
  defaultMode: "act-autonomously"
  escalateAfterMs: 3600000    # 1 hour without response

HumanCollaborationRequest:
  requestId: "review-42"
  agentId: "EO-001"
  actionType: "publish-content"
  context: { draft: "..." }
  mode: "recommend"
  requestedAt: 1710400000000
  resolvedAt: null
  resolution: null
  resolvedBy: null
```

## Governance Policies

| Policy | Rule | Enforcement |
|---|---|---|
| WFH-001 | Every action type must have a defined collaboration mode | Platform rule validation |
| WFH-002 | Mode upgrades are automatic based on risk thresholds | Platform mode enforcement |
| WFH-003 | Human review requests must be resolved within escalation timeout | Platform escalation trigger |
| WFH-004 | Agents operating in 'stop' mode cannot proceed without human direction | Gamma OS Governance Gate |
| WFH-005 | All collaboration decisions are logged for audit | Platform audit enforcement |
