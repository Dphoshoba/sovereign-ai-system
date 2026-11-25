# Workflow Template Guide

## Available Templates

Gamma Flow 1.0 includes **3 production-ready templates** for common workflows.

### Template 1: Gmail Triage

**ID**: `gmail_triage_template_v1`  
**Purpose**: Automatically categorize emails and create draft responses  
**Steps**: 8 (Read → Sanitize → Classify → Compose → Approval → Queue → Complete)  
**Connectors**: Gmail

#### Workflow

```
New Email
   ↓
Read Message (Gmail)
   ↓
Sanitize Content (Remove PII)
   ↓
Classify (Needs Response?)
   ↓ (Yes) → Compose Draft (Gmail)
   ↓ (No)  → Complete
   ↓
Approval Gate (Manager)
   ↓
Queue for Send
   ↓
Complete
```

#### Step Breakdown

| Step | Type | Connector | Risk | Requires Approval |
|------|------|-----------|------|-------------------|
| Read Message | connector | Gmail | Low | No |
| Sanitize | transform | - | Low | No |
| Classify | decision | - | Low | No |
| Compose Draft | connector | Gmail | Medium | No |
| Approval | approval | - | High | Yes |
| Queue for Send | queue | - | Low | No |
| Complete | sink | - | Low | No |

#### Configuration

```typescript
// Get the template
GET /api/flow/templates?search=gmail_triage

// Response
{
  "id": "gmail_triage_template_v1",
  "name": "Gmail Triage",
  "description": "Automatically triage incoming emails and create draft responses",
  "category": "email",
  "version": "1.0.0",
  "tags": ["email", "triage", "draft", "approval"],
  "baseWorkflow": { /* full definition */ }
}

// Customize before use
{
  "...baseWorkflow",
  "steps": [
    { ...// modify specific steps
    }
  ]
}
```

#### Safety Profile

- **Safety Score**: 95/100
- **Approval Coverage**: 100% (1 approval gate on 1 risky step)
- **Queue Coverage**: 100% (queue before execution)
- **Connector Coverage**: 100% (Gmail available)

---

### Template 2: Gmail to Slack Priority

**ID**: `gmail_to_slack_template_v1`  
**Purpose**: Forward high-priority emails to Slack with instant notification  
**Steps**: 8 (Read → Sanitize → Classify → Create Slack → Approval → Queue → Complete)  
**Connectors**: Gmail, Slack

#### Workflow

```
New Email
   ↓
Read Message (Gmail)
   ↓
Sanitize for Slack
   ↓
Check Priority (Starred or URGENT?)
   ↓ (High Priority)
Create Slack Message
   ↓
Approval Gate
   ↓
Queue for Send
   ↓
Complete
```

#### Use Cases

- **Urgent Alerts**: Get instant Slack notification when important emails arrive
- **Executive Alerts**: Filter for specific keywords or senders
- **Team Collaboration**: Share critical messages with team channel

#### Safety Profile

- **Safety Score**: 90/100
- **Approval Coverage**: 100%
- **Queue Coverage**: 100%
- **Cross-Connector**: Gmail → Slack (2 connectors)

---

### Template 3: Weekly Executive Brief

**ID**: `weekly_brief_template_v1`  
**Purpose**: Generate weekly executive brief from mission metrics  
**Steps**: 6 (Scheduled → Fetch → Transform → Validate → Approval → Queue → Complete)  
**Connectors**: GitHub (for metrics)  
**Schedule**: Every Monday at 9 AM

#### Workflow

```
Schedule Trigger (Monday 9 AM)
   ↓
Fetch Mission Metrics (GitHub)
   ↓
Transform to Summary
   ↓
Validate Summary
   ↓ (Valid)
Approval Gate (Executive)
   ↓
Queue for Distribution
   ↓
Complete
```

#### Key Features

- **Scheduled Execution**: Runs automatically every Monday
- **Metrics Aggregation**: Pulls data from GitHub repos
- **Executive Summary**: Transforms raw metrics to readable format
- **Approval**: Executive review before distribution
- **Extensible**: Can be extended to add email distribution

#### Configuration

```typescript
// Customize recipients
{
  parameters: [
    {
      id: "param_recipients",
      name: "Email Recipients",
      defaultValue: "executive@example.com,leadership@example.com"
    }
  ]
}

// Customize schedule
{
  trigger: {
    type: "scheduled",
    schedule: "0 10 * * 1"  // Change to Monday 10 AM
  }
}
```

#### Safety Profile

- **Safety Score**: 100/100
- **Approval Coverage**: 100%
- **Queue Coverage**: 100%
- **Deterministic**: Always runs at same time with same data

---

## Using Templates

### 1. List All Templates

```bash
GET /api/flow/templates

Response:
{
  "templates": [
    { "id": "gmail_triage_template_v1", "name": "Gmail Triage", ... },
    { "id": "gmail_to_slack_template_v1", "name": "Gmail to Slack Priority", ... },
    { "id": "weekly_brief_template_v1", "name": "Weekly Executive Brief", ... }
  ],
  "pagination": { "page": 1, "limit": 10, "total": 3 }
}
```

### 2. Get Specific Template

```bash
GET /api/flow/templates/gmail_triage_template_v1

Response:
{
  "id": "gmail_triage_template_v1",
  "baseWorkflow": { /* full WorkflowDefinition */ },
  ...
}
```

### 3. Search Templates

```bash
GET /api/flow/templates?search=gmail

Response:
{
  "templates": [
    { "id": "gmail_triage_template_v1", ... },
    { "id": "gmail_to_slack_template_v1", ... }
  ]
}
```

### 4. Filter by Tag

```bash
GET /api/flow/templates?tag=approval

Response:
{
  "templates": [
    /* all templates with 'approval' tag */
  ]
}
```

### 5. Use Template as Base

```bash
// Get template
template = GET /api/flow/templates/gmail_triage_template_v1

// Customize
customWorkflow = template.baseWorkflow
customWorkflow.id = "wf_my_gmail_triage_custom"
customWorkflow.name = "My Custom Triage"
customWorkflow.steps[4].approverId = "my-manager@example.com"  // Change approver

// Validate custom workflow
POST /api/flow/validate
{
  body: customWorkflow
}

// Compile and preview
POST /api/flow/compile
{
  body: customWorkflow
}

POST /api/flow/preview
{
  body: { definition: customWorkflow, executionId: "preview_123" }
}
```

## Customization Examples

### Example 1: Change Approval Time

```typescript
// Original: 1 hour
step_approval.approvalTimeout = 3600000

// Change to 30 minutes
step_approval.approvalTimeout = 1800000

// Change to 2 hours
step_approval.approvalTimeout = 7200000
```

### Example 2: Add Error Handling

```typescript
// Add error sink
{
  id: "sink_error",
  name: "Error Handler",
  type: "sink"
}

// Add error edge
{
  id: "e_error",
  from: "step_compose",
  to: "sink_error",
  type: "failure"
}
```

### Example 3: Multiple Approvers

```typescript
// After compose step, add second approval
{
  id: "step_approval_2",
  name: "Director Review",
  type: "approval",
  approverId: "director@example.com",
  approvalTimeout: 7200000,
  requiresApproval: true,
  riskLevel: "high"
}

// Add edge
{
  id: "e_director",
  from: "step_approval",
  to: "step_approval_2",
  type: "approved"
}
```

## Preview & Testing

### Test Template Without Risking Execution

```bash
# 1. Validate
curl -X POST http://localhost:3000/api/flow/validate \
  -H "Content-Type: application/json" \
  -d @custom_workflow.json

# 2. Compile
curl -X POST http://localhost:3000/api/flow/compile \
  -H "Content-Type: application/json" \
  -d @custom_workflow.json

# 3. Preview (uses mock connectors, no real execution)
curl -X POST http://localhost:3000/api/flow/preview \
  -H "Content-Type: application/json" \
  -d '{
    "definition": { /* workflow def */ },
    "executionId": "preview_test_123"
  }'

# Response shows:
# - success: true/false
# - stepResults: {step_id: {output, duration}}
# - approvalCheckpoints: auto-approved
# - errors: any issues
```

## Migration Path

**Gamma Flow 1.0** → **2.0**:

- All templates remain compatible
- Added execution will happen after queue checkpoint
- Approval flow expands to include timing metadata
- Webhook triggers become available
- Scheduled execution via cron workers

---

**Want to create your own template?** See `WORKFLOW_DEFINITION_GUIDE.md`  
**Questions about safety?** See `WORKFLOW_SAFETY_MODEL.md`  
**Running in production?** See `GAMMA_FLOW_OPERATIONS.md`
