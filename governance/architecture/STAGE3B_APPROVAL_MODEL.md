# Stage 3B Approval Model

**Status:** PLANNING
**Parent:** Stage 3A frozen at `05631b9`

## Approval Levels

| Level | Description | Examples |
|---|---|---|
| `NONE` | No approval required; safe operations | Copy, Dry-run, Read-only |
| `STANDARD` | Default approval for mutations | Upload, Update, Rename, Trash |
| `HEIGHTENED` | Sensitive operations requiring review | Permission changes, Bulk operations |
| `CRITICAL` | Destructive operations requiring board approval | Permanent delete, Owner transfer, Data destruction |

## Approval Flow

```
Pre-Execution Validation
  ↓
Evaluate operation risk level
  ↓
Map risk level to approval requirement
  ↓
If approval required:
  → Check for existing approval token
  → If missing → Store as pending approval → Return EXECUTION_BLOCKED
  → If present → Validate approval (not expired, correct scope)
  → If valid → Proceed to EXECUTING
  → If invalid → Return EXECUTION_BLOCKED (classification: APPROVAL_MISSING)
If no approval required:
  → Proceed to EXECUTING
```

## Automatic Approval Rules

Operations at `NONE` level may execute automatically if:
1. The connector supports the operation
2. The governance decision is not expired
3. No blocking reasons exist
4. The operation is idempotent or replay-protected

Operations at `STANDARD` level may execute automatically if:
1. All automatic rules pass AND
2. The operator has pre-authorized the operation type for the session

Operations at `HEIGHTENED` and `CRITICAL` always require explicit approval.

## Emergency Stop

An emergency stop (`KILL_SWITCH_ACTIVE`) may be triggered at any time:

| Scope | Effect | Recovery |
|---|---|---|
| Per-connector | Blocks all execution for that connector | Operator override |
| Per-stage | Blocks all Stage 3B execution | Governance board override |
| Global | Blocks all execution across all stages | Governance board override + incident review |

When an emergency stop is active:
- New executions are blocked at the approval gate
- In-progress executions are allowed to complete but rollback is recommended
- The kill switch reason is recorded in all affected audit records

## Approval Token

```typescript
interface ApprovalToken {
  approvalId: string;
  decisionId: string;
  operationId: string;
  level: 'STANDARD' | 'HEIGHTENED' | 'CRITICAL';
  grantedBy: string;
  grantedAt: string;    // deterministic timestamp
  expiresAt: string;    // deterministic timestamp
  scope: string[];      // approved operations
  conditions: string[]; // approval conditions
  signature: string;    // governance signature
}
```

## Audit of Approvals

Every approval check is recorded in the audit record regardless of outcome:

- Approval ID (or absence)
- Approval level required vs. granted
- Approval validity check result
- Gate decision (proceed / block)
- Timestamps
