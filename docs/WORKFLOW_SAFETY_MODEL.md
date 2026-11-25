# Workflow Safety Model

## Core Principles

Gamma Flow 1.0 enforces **5 key safety principles**:

1. **Preview-First**: All execution previewed before queuing
2. **Deterministic**: Reproducible outcomes with fixed timestamps
3. **Approval-Gated**: High-risk operations require human approval
4. **Queue-Aware**: Approval required before real execution
5. **Auditable**: Full event trail for compliance

## Safety Layers

### Layer 1: Validation

Before any execution, workflows pass through **6 independent validators**:

| Validator | Purpose | Failure Severity |
|-----------|---------|------------------|
| Schema | Required fields, type checking | Critical |
| Cycles | Acyclic DAG enforcement | Critical |
| Connector Binding | Verify all connectors exist | Critical |
| Dependencies | No orphan nodes, all connected | High |
| Safety | Approval/queue enforcement | High |
| Risk Assessment | Safety score calculation | Medium |

**Failure Result**: Workflow rejected before compilation

### Layer 2: Risk Classification

Each step is classified by risk level:

```
Risk Level: low
  ├─ No approval required
  ├─ Can run in preview
  └─ Examples: Read email, sanitize, decision

Risk Level: medium
  ├─ Optional approval recommended
  ├─ Requires preview first
  └─ Examples: Create draft, compose message

Risk Level: high
  ├─ Approval REQUIRED before queue
  ├─ Cannot run in preview for real
  └─ Examples: Send message, delete, update database
```

**Safety Score Penalty**:
- High-risk step without approval: -10 points
- High-risk step without queue: -5 points
- High-risk connector without binding: -15 points

### Layer 3: Approval Gates

High-risk operations require explicit human approval:

```
Approval Checkpoint Structure:
{
  id: 'step_approval_1',
  name: 'Manager Review',
  type: 'approval',
  approverId: 'manager@example.com',     // Single approver
  approvalTimeout: 3600000,              // 1 hour
  requiresApproval: true,
  riskLevel: 'high'
}

Approval Flow:
  pending → approver_assigned
  approver_assigned → approval_requested
  approval_requested → (wait for decision)
    ├─ → approved (continue)
    └─ → rejected (fail workflow)
```

### Layer 4: Queue Enforcement

Before real execution, workflows must pass through a queue:

```
Queue Checkpoint:
{
  id: 'step_queue_1',
  type: 'queue',
  description: 'Mark for execution'
}

Queue Flow:
  Approved (in-memory)
  → Queued (async workers, v2.0)
  → Executed (real connectors, v2.0)
  → Completed

Note: v1.0 queues in-memory only (preview-only)
```

### Layer 5: Audit Trail

Every operation is logged immutably:

```
Event Types:
  workflow_started
  workflow_completed
  workflow_failed
  step_started
  step_completed
  step_failed
  approval_requested
  approval_decided
  queued
  executed
  error

Audit Entry:
{
  id: 'evt_001',
  type: 'step_completed',
  stepId: 'step_read',
  timestamp: '2026-07-10T12:00:05Z',
  duration: 125,
  metadata: { output: {...}, error: null },
  userId: 'system'
}

Retention: Immutable (cannot be modified after creation)
Access: GET /api/flow/workflows/{id}/audit
Compliance: Full timeline for regulatory review
```

## Safety Scores

### Calculation Formula

```
Base Safety Score = 100

Deductions:
  -15 points: Each high-risk step missing approval gate
  -10 points: Each high-risk step missing queue checkpoint
  -5 points: Each connector without verified binding
  -3 points: Each cycle detected
  -2 points: Each orphan node

Final Score = max(0, min(100, Base - Deductions))

Interpretation:
  90-100: Safe for production
  70-89: Review before deploy
  50-69: Major concerns, remediate
  <50: Blocked, fix issues
```

### Readiness Score

Measures workflow readiness for execution:

```
Base Readiness = 100

Penalties:
  -20: Validation errors (any)
  -10: Warnings present (multiple)
  -5: Missing connector bindings
  -3: Approval timeout <1 hour

Interpretation:
  95-100: Ready to execute
  80-94: Minor issues, likely ok
  60-79: Review, may have gaps
  <60: Not ready, fix issues
```

## High-Risk Operations

Operations requiring approval:

### 1. Sending Messages
```typescript
{
  type: 'connector',
  connectorName: 'slack',
  actionId: 'send_message',
  riskLevel: 'high',  // Requires approval
  requiresApproval: true
}
```

### 2. Creating/Updating Data
```typescript
{
  type: 'connector',
  connectorName: 'notion',
  actionId: 'create_page',
  riskLevel: 'high',
  requiresApproval: true
}
```

### 3. Deletions
```typescript
{
  type: 'connector',
  actionId: 'delete_item',
  riskLevel: 'high',
  requiresApproval: true
}
```

### 4. External System Changes
```typescript
{
  type: 'connector',
  connectorName: 'github',
  actionId: 'create_issue',
  riskLevel: 'high',
  requiresApproval: true
}
```

## Approval Timeout Enforcement

```
Timeout: ms (milliseconds)

Minimum: 60000 ms (1 minute)
Recommended: 3600000 ms (1 hour)
Maximum: 86400000 ms (24 hours)

Behavior:
  workflow_started
  approval_requested
  wait(timeout)
  ├─ decision made → proceed
  └─ timeout expired → fail with "approval timeout"
```

## Connector Security

### Verified Connectors (v1.0)
- ✓ Gmail (read-only in preview, draft composition)
- ✓ Slack (preview messages, no actual send)
- ✓ GitHub (preview issues, no actual creation)
- ✓ Notion (preview pages, no actual creation)

### Preview-Mode Mocking
```
In Preview Mode:
  Gmail.read_message → Mock email data (deterministic)
  Slack.send_message → Mock confirmation (no send)
  GitHub.create_issue → Mock response (no creation)

All connector outputs are deterministic and mocked.
```

## Error Handling

### Graceful Degradation

```
Step Failure Scenarios:

1. Connector Unavailable
   → Step fails
   → Edge type 'failure' triggered
   → Audit logged as "connector_unavailable"
   → Workflow continues if error edge defined

2. Condition Evaluation Failed
   → Default to 'condition_false'
   → Continue via that edge
   → Log warning in audit

3. Approval Timeout
   → Step fails
   → Workflow fails
   → Audit logged as "approval_timeout"
   → Notification sent to approver

4. Data Mapping Error
   → Step fails with detailed error
   → Invalid path: "$.step.nonexistent"
   → Audit includes error details
```

## Testing for Safety

### Validation Testing

```bash
# Test safety score calculation
POST /api/flow/validate
{
  "definition": { /* workflow */ }
}

Response includes:
  - safetyScore: 0-100
  - approvalCoverage: % of high-risk steps with approval
  - queueCoverage: % of high-risk steps with queue
```

### Preview Execution

```bash
# Test without risk
POST /api/flow/preview
{
  "definition": { /* workflow */ },
  "executionId": "test_execution_1"
}

Preview provides:
  - Same flow as real execution
  - Mock connector outputs
  - Auto-approved approvals
  - All without actual external changes
```

### Audit Review

```bash
# Get full audit trail
GET /api/flow/workflows/{id}/audit

Review for:
  - All steps executed in order
  - All approvals recorded
  - All errors captured
  - Compliance timestamps
```

## Compliance & Regulations

### Audit Trail Requirements
- ✓ Immutable event log
- ✓ Timestamps on all operations
- ✓ User attribution (who approved)
- ✓ Detailed error messages
- ✓ 90-day retention (configurable)

### Access Control
- ✓ Approval restricted to approverId
- ✓ Only assigned approvers can decide
- ✓ All access logged
- ✓ Separation of duties enforced

### Data Privacy
- ✓ Preview mode never exposes real data
- ✓ Sanitization step recommended for PII
- ✓ Approval gates prevent accidental leaks
- ✓ Audit logs don't retain sensitive data

## Migration to v2.0

**Current (v1.0)**: Preview-only with approval gates  
**v2.0 Additions**:
- Real connector execution after approval
- Persistent job queue (Redis/PostgreSQL)
- Webhook notifications
- Retry policies per step
- Rate limiting per connector
- Advanced error recovery

---

**Questions?** See `GAMMA_FLOW_ARCHITECTURE.md` for technical details  
**For operators**: See `GAMMA_FLOW_OPERATIONS.md`  
**Running workflows?** See `WORKFLOW_DEFINITION_GUIDE.md`
