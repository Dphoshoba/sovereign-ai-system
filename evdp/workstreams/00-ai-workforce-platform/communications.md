# Workstream C — Workforce Communications

## Objective

Define standardized interaction patterns that every AI worker uses. All communications are auditable through Gamma OS, enabling full traceability of every decision and action.

## Message Types

| Type | Direction | Purpose |
|---|---|---|
| request | Agent → Agent / Agent → Human | Request information or action |
| response | Agent → Agent / Agent → Human | Respond to a request |
| delegation | Manager → Subordinate | Assign a task or decision |
| escalation | Subordinate → Manager | Escalate beyond authority level |
| broadcast | One → Many | Announce to group or office |
| collaboration | Agent → Agent | Collaborative work coordination |
| approval | Human → Agent | Approval or rejection of proposed action |
| completion | Agent → Agent / Agent → Human | Task or process completed |
| exception | Agent → Agent / Agent → Human | Error or unexpected condition |

## Message Model

```yaml
WorkforceMessage:
  messageId: "msg-42"
  type: "request"          # One of 9 message types
  sender: "EO-001"
  recipient: "RO-002"
  payload: { }             # Type-specific content
  timestamp: 1710400000000
  correlationId: "conv-7"  # Threads related messages
  auditRef: "gamma-audit-001"  # Gamma OS audit reference
  priority: 3              # 1 (low) – 5 (critical)
```

## Conversation Tracking

Every message belongs to a conversation identified by `correlationId`. The first message in a conversation generates a new correlationId; responses reuse it. This enables full thread reconstruction.

## Governance Policies

| Policy | Rule | Enforcement |
|---|---|---|
| WFC-001 | All cross-agent communications must include auditRef to Gamma OS | Message validation |
| WFC-002 | Exception messages auto-escalate to the agent's manager | Platform routing |
| WFC-003 | Escalation messages must include context and attempted resolutions | Message validation |
| WFC-004 | Approval messages require human sender validation | Gamma OS Governance Gate |
