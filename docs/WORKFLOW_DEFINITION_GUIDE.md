# Workflow Definition Guide

## Quick Start

A minimal workflow definition:

```json
{
  "id": "wf_example_001",
  "name": "Example Workflow",
  "version": "1.0.0",
  "creator": "admin@example.com",
  "createdAt": "2026-07-10T12:00:00Z",
  "updatedAt": "2026-07-10T12:00:00Z",
  "trigger": {
    "id": "trigger_1",
    "type": "manual",
    "description": "Manual trigger"
  },
  "steps": [
    {
      "id": "step_1",
      "name": "First Step",
      "type": "connector",
      "connectorName": "gmail",
      "actionId": "read_message"
    },
    {
      "id": "sink_1",
      "name": "Complete",
      "type": "sink"
    }
  ],
  "edges": [
    { "id": "e1", "from": "trigger_1", "to": "step_1", "type": "always" },
    { "id": "e2", "from": "step_1", "to": "sink_1", "type": "success" }
  ]
}
```

## Core Concepts

### Trigger Types

```typescript
type TriggerType = 'manual' | 'scheduled' | 'connector_event' | 'webhook' | 'form_submission';

// Manual Trigger
{
  id: 'trigger_manual',
  type: 'manual',
  description: 'User initiates workflow'
}

// Scheduled Trigger (cron)
{
  id: 'trigger_scheduled',
  type: 'scheduled',
  schedule: '0 9 * * 1',  // Every Monday at 9 AM
  description: 'Weekly execution'
}

// Connector Event Trigger
{
  id: 'trigger_event',
  type: 'connector_event',
  connectorName: 'gmail',
  eventType: 'new_message',
  description: 'On new Gmail message'
}

// Webhook Trigger
{
  id: 'trigger_webhook',
  type: 'webhook',
  path: '/webhooks/custom',
  description: 'External system trigger'
}

// Form Submission Trigger
{
  id: 'trigger_form',
  type: 'form_submission',
  formId: 'form_abc123',
  description: 'Form submitted'
}
```

### Step Types

#### 1. Connector Step

Calls an external connector (Gmail, Slack, GitHub, etc.):

```typescript
{
  id: 'step_connector_1',
  name: 'Read Email',
  type: 'connector',
  connectorName: 'gmail',        // Must exist in registry
  actionId: 'read_message',      // Specific action
  description: 'Read latest email',
  requiresApproval: false,
  runInPreview: true,
  riskLevel: 'low',
  inputMapping: {                // Optional
    messageId: '$.trigger.messageId'
  }
}
```

#### 2. Transform Step

Transform data using scripts or templates:

```typescript
{
  id: 'step_transform_1',
  name: 'Sanitize Content',
  type: 'transform',
  description: 'Remove PII',
  transform: {
    id: 'transform_sanitize',
    type: 'script',             // or 'template'
    input: '$.step_read.body',  // Path to input
    output: 'sanitized'         // Output field name
  },
  requiresApproval: false,
  runInPreview: true,
  riskLevel: 'low'
}
```

#### 3. Decision Step

Conditional branching:

```typescript
{
  id: 'step_decision_1',
  name: 'Check Priority',
  type: 'decision',
  description: 'Is this urgent?',
  condition: {
    id: 'cond_priority',
    operator: 'contains',         // contains, equals, greater_than, etc.
    left: '$.step_read.subject',  // Field to test
    right: 'URGENT'               // Value to match
  },
  requiresApproval: false,
  runInPreview: true,
  riskLevel: 'low'
}
```

#### 4. Approval Step

Human approval gate:

```typescript
{
  id: 'step_approval_1',
  name: 'Manager Approval',
  type: 'approval',
  description: 'Requires manager sign-off',
  approverId: 'manager@example.com',        // Who can approve
  approvalTimeout: 3600000,                 // 1 hour in ms
  requiresApproval: true,
  riskLevel: 'high'
}
```

#### 5. Queue Step

Mark for queued execution:

```typescript
{
  id: 'step_queue_1',
  name: 'Queue for Sending',
  type: 'queue',
  description: 'Queue this for execution',
  requiresApproval: false,
  runInPreview: true,
  riskLevel: 'low'
}
```

#### 6. Delay Step

Pause execution:

```typescript
{
  id: 'step_delay_1',
  name: 'Wait 5 Minutes',
  type: 'delay',
  delayMs: 300000,                // 5 minutes
  description: 'Pause before next step'
}
```

#### 7. Notification Step

Send notification:

```typescript
{
  id: 'step_notification_1',
  name: 'Send Alert',
  type: 'notification',
  channel: 'email',               // email, slack, etc.
  recipients: ['admin@example.com'],
  message: 'Workflow {{workflowId}} completed',
  description: 'Notify on completion'
}
```

#### 8. Sink Step

Workflow completion marker:

```typescript
{
  id: 'sink_final',
  name: 'Completed',
  type: 'sink',
  description: 'Workflow finished successfully'
}
```

### Edge Types

```typescript
type EdgeType = 'always' | 'success' | 'failure' | 'approved' | 'rejected' | 'condition_true' | 'condition_false';

// Always execute
{ id: 'e1', from: 'step_1', to: 'step_2', type: 'always' }

// On previous step success
{ id: 'e2', from: 'step_1', to: 'step_2', type: 'success' }

// On previous step failure
{ id: 'e3', from: 'step_1', to: 'error_handler', type: 'failure' }

// On approval decision
{ id: 'e4', from: 'step_approval', to: 'step_execute', type: 'approved' }
{ id: 'e5', from: 'step_approval', to: 'step_reject', type: 'rejected' }

// On decision condition result
{ id: 'e6', from: 'step_decision', to: 'step_if_true', type: 'condition_true' }
{ id: 'e7', from: 'step_decision', to: 'step_if_false', type: 'condition_false' }
```

## Validation Requirements

Your workflow definition must pass these checks:

### Schema Requirements
- ✓ `id` (string, unique)
- ✓ `name` (string)
- ✓ `version` (semver)
- ✓ `creator` (email or username)
- ✓ `createdAt` / `updatedAt` (ISO 8601)
- ✓ `trigger` (required TriggerDefinition)
- ✓ `steps` (1+ steps required)
- ✓ `edges` (edges must connect existing steps)

### Dependency Requirements
- ✓ All edge `from`/`to` IDs must reference existing steps
- ✓ Trigger must connect to at least one step
- ✓ All steps must be reachable from trigger (no orphan nodes)
- ✓ All steps must reach a sink (no dangling paths)

### Safety Requirements
- ✓ All connectors must exist (Gmail, Slack, GitHub, Notion)
- ✓ High-risk steps (`riskLevel: 'high'`) must have approval gates
- ✓ Connector operations must have approval before queue
- ✓ Approval gates must have timeout > 60000 ms

### Structural Requirements
- ✓ Must be acyclic (no loops, except via explicit feedback)
- ✓ All edges must have valid type
- ✓ Decision steps must have conditions
- ✓ Trigger must be reachable to at least one step

## Input Mapping

Reference previous step outputs using path syntax:

```typescript
// Reference entire step output
inputMapping: {
  message: '$.step_read_email'
}

// Reference nested field
inputMapping: {
  subject: '$.step_read_email.subject',
  body: '$.step_read_email.body'
}

// Reference trigger input
inputMapping: {
  userId: '$.trigger.userId'
}

// Multiple fields
inputMapping: {
  to: '$.step_read_email.from',
  subject: '"Re: " + $.step_read_email.subject',
  body: '$.step_sanitize.cleaned_body'
}
```

## Complete Example: Gmail Triage

```json
{
  "id": "wf_gmail_triage_complete",
  "name": "Gmail Triage with Response",
  "version": "1.0.0",
  "creator": "system",
  "createdAt": "2026-07-10T12:00:00Z",
  "updatedAt": "2026-07-10T12:00:00Z",
  "trigger": {
    "id": "trigger_new_email",
    "type": "connector_event",
    "connectorName": "gmail",
    "eventType": "new_message",
    "description": "On new email"
  },
  "steps": [
    {
      "id": "step_read",
      "name": "Read Email",
      "type": "connector",
      "connectorName": "gmail",
      "actionId": "read_message",
      "requiresApproval": false,
      "runInPreview": true,
      "riskLevel": "low"
    },
    {
      "id": "step_sanitize",
      "name": "Sanitize Content",
      "type": "transform",
      "transform": {
        "id": "sanitize",
        "type": "script",
        "input": "$.step_read.body",
        "output": "clean_body"
      },
      "requiresApproval": false,
      "runInPreview": true,
      "riskLevel": "low"
    },
    {
      "id": "step_classify",
      "name": "Classify Email",
      "type": "decision",
      "condition": {
        "id": "needs_response",
        "operator": "contains",
        "left": "$.step_sanitize.clean_body",
        "right": "help|question|request"
      },
      "requiresApproval": false,
      "runInPreview": true,
      "riskLevel": "low"
    },
    {
      "id": "step_compose",
      "name": "Compose Response",
      "type": "connector",
      "connectorName": "gmail",
      "actionId": "create_draft",
      "requiresApproval": false,
      "runInPreview": true,
      "riskLevel": "medium",
      "inputMapping": {
        "to": "$.step_read.from",
        "subject": "$.step_read.subject"
      }
    },
    {
      "id": "step_approval",
      "name": "Approve Draft",
      "type": "approval",
      "approverId": "user@example.com",
      "approvalTimeout": 3600000,
      "requiresApproval": true,
      "riskLevel": "high"
    },
    {
      "id": "step_queue",
      "name": "Queue for Send",
      "type": "queue",
      "requiresApproval": false,
      "runInPreview": true,
      "riskLevel": "low"
    },
    {
      "id": "sink_complete",
      "name": "Completed",
      "type": "sink"
    }
  ],
  "edges": [
    { "id": "e1", "from": "trigger_new_email", "to": "step_read", "type": "always" },
    { "id": "e2", "from": "step_read", "to": "step_sanitize", "type": "success" },
    { "id": "e3", "from": "step_sanitize", "to": "step_classify", "type": "success" },
    { "id": "e4", "from": "step_classify", "to": "step_compose", "type": "condition_true" },
    { "id": "e5", "from": "step_compose", "to": "step_approval", "type": "success" },
    { "id": "e6", "from": "step_approval", "to": "step_queue", "type": "approved" },
    { "id": "e7", "from": "step_queue", "to": "sink_complete", "type": "always" }
  ]
}
```

## Testing Your Definition

```bash
# Validate
curl -X POST http://localhost:3000/api/flow/validate \
  -H "Content-Type: application/json" \
  -d @workflow.json

# Expected response:
{
  "valid": true,
  "errors": [],
  "warnings": [],
  "safetyScore": 95,
  "readinessScore": 100,
  "metrics": {
    "nodeCount": 7,
    "edgeCount": 7,
    "connectorCount": 2,
    "approvalPointCount": 1,
    "queuePointCount": 1,
    "cycleCount": 0,
    "orphanNodeCount": 0
  }
}
```

## Common Patterns

### With Error Handling
```json
{ "id": "e_error", "from": "step_read", "to": "error_sink", "type": "failure" }
```

### Conditional Branches
```json
[
  { "id": "e_urgent", "from": "step_priority", "to": "step_fast_track", "type": "condition_true" },
  { "id": "e_normal", "from": "step_priority", "to": "step_standard", "type": "condition_false" }
]
```

### Multi-Approval
```json
[
  { "id": "step_approval_1", "name": "Manager", "type": "approval", "approverId": "manager@..." },
  { "id": "step_approval_2", "name": "Director", "type": "approval", "approverId": "director@..." },
]
```

---

**For more on templates, see**: `WORKFLOW_TEMPLATE_GUIDE.md`  
**For safety model details, see**: `WORKFLOW_SAFETY_MODEL.md`
