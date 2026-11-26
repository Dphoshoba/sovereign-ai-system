/**
 * Workflow Templates
 * 
 * Three complete deterministic workflow templates for Gamma Flow 1.0
 * All preview-mode only, approval-gated, queue-aware
 */

import type { WorkflowTemplate } from './types';

const BASE_TIME = new Date('2026-07-10T12:00:00Z');

/**
 * Template 1: Gmail Triage Preview
 * Gmail → Read → Sanitize → Decision → Compose → Approval → Queue → Complete
 */
export const GMAIL_TRIAGE_TEMPLATE: WorkflowTemplate = {
  id: 'gmail_triage_template_v1',
  name: 'Gmail Triage',
  description: 'Automatically triage incoming emails and create draft responses',
  category: 'email',
  baseWorkflow: {
    id: 'wf_gmail_triage_v1',
    name: 'Gmail Triage Preview Workflow',
    version: '1.0.0',
    description: 'Triage emails and create response drafts',
    creator: 'system',
    createdAt: BASE_TIME,
    updatedAt: BASE_TIME,
    previewMode: true,
    enableAudit: true,
    trigger: {
      id: 'trigger_gmail_read',
      type: 'connector_event',
      connectorName: 'gmail',
      eventType: 'new_message',
      description: 'Triggered when new email arrives',
    },
    steps: [
      {
        id: 'step_read_message',
        name: 'Read Message',
        type: 'connector',
        connectorName: 'gmail',
        actionId: 'read_message',
        description: 'Read full email content and metadata',
        requiresApproval: false,
        runInPreview: true,
        riskLevel: 'low',
      },
      {
        id: 'step_sanitize',
        name: 'Sanitize Content',
        type: 'transform',
        description: 'Remove sensitive data and normalize content',
        transform: {
          id: 'transform_sanitize',
          type: 'script',
          input: '$.step_read_message.body',
          output: 'sanitized_content',
        },
        requiresApproval: false,
        runInPreview: true,
        riskLevel: 'low',
      },
      {
        id: 'step_classify',
        name: 'Classify Email',
        type: 'decision',
        description: 'Determine if response is needed',
        condition: {
          id: 'cond_reply_needed',
          operator: 'contains',
          left: '$.step_sanitize.sanitized_content',
          right: 'question|request|help',
        },
        requiresApproval: false,
        runInPreview: true,
        riskLevel: 'low',
      },
      {
        id: 'step_compose_draft',
        name: 'Compose Draft Response',
        type: 'connector',
        connectorName: 'gmail',
        actionId: 'create_draft',
        description: 'Create draft response email',
        requiresApproval: false,
        runInPreview: true,
        riskLevel: 'low',
        inputMapping: {
          to: '$.step_read_message.from',
          subject: '"Re: " + $.step_read_message.subject',
        },
      },
      {
        id: 'step_approval',
        name: 'Human Approval',
        type: 'approval',
        description: 'Human must approve before sending',
        requiresApproval: true,
        approverId: 'admin@example.com',
        approvalTimeout: 3600000, // 1 hour
        riskLevel: 'high',
      },
      {
        id: 'step_queue',
        name: 'Queue for Execution',
        type: 'queue',
        description: 'Queue draft for sending',
        requiresApproval: false,
        runInPreview: true,
        riskLevel: 'low',
      },
      {
        id: 'step_complete',
        name: 'Execution Complete',
        type: 'sink',
        description: 'Workflow completed',
        requiresApproval: false,
        runInPreview: true,
      },
    ],
    edges: [
      { id: 'e1', from: 'trigger_gmail_read', to: 'step_read_message', type: 'always' },
      { id: 'e2', from: 'step_read_message', to: 'step_sanitize', type: 'success' },
      { id: 'e3', from: 'step_sanitize', to: 'step_classify', type: 'success' },
      { id: 'e4', from: 'step_classify', to: 'step_compose_draft', type: 'condition_true' },
      { id: 'e5', from: 'step_compose_draft', to: 'step_approval', type: 'success' },
      { id: 'e6', from: 'step_approval', to: 'step_queue', type: 'approved' },
      { id: 'e7', from: 'step_queue', to: 'step_complete', type: 'always' },
    ],
    maxRetries: 3,
    timeoutMs: 60000,
  },
  parameters: [
    {
      id: 'param_approval_timeout',
      name: 'Approval Timeout',
      type: 'number',
      description: 'How long to wait for approval (ms)',
      required: false,
      defaultValue: 3600000,
      validation: { minValue: 60000, maxValue: 86400000 },
    },
  ],
  createdAt: BASE_TIME,
  createdBy: 'system',
  downloads: 0,
  tags: ['email', 'triage', 'draft', 'approval'],
};

/**
 * Template 2: Gmail to Slack Priority Preview
 * Gmail → Read → Sanitize → Decision → Create Slack → Approval → Queue → Complete
 */
export const GMAIL_TO_SLACK_TEMPLATE: WorkflowTemplate = {
  id: 'gmail_to_slack_template_v1',
  name: 'Gmail to Slack Priority',
  description: 'Forward high-priority emails to Slack with instant notification',
  category: 'notification',
  baseWorkflow: {
    id: 'wf_gmail_to_slack_v1',
    name: 'Gmail to Slack Preview Workflow',
    version: '1.0.0',
    description: 'Forward priority emails to Slack',
    creator: 'system',
    createdAt: BASE_TIME,
    updatedAt: BASE_TIME,
    previewMode: true,
    enableAudit: true,
    trigger: {
      id: 'trigger_gmail_priority',
      type: 'connector_event',
      connectorName: 'gmail',
      eventType: 'new_message',
      description: 'Triggered on new email with priority flags',
    },
    steps: [
      {
        id: 'step_read_email',
        name: 'Read Email',
        type: 'connector',
        connectorName: 'gmail',
        actionId: 'read_message',
        description: 'Read email content',
        requiresApproval: false,
        runInPreview: true,
        riskLevel: 'low',
      },
      {
        id: 'step_sanitize_email',
        name: 'Sanitize Content',
        type: 'transform',
        description: 'Remove PII and normalize',
        transform: {
          id: 'transform_slack_format',
          type: 'template',
          input: '$.step_read_email',
          output: 'slack_message',
        },
        requiresApproval: false,
        runInPreview: true,
        riskLevel: 'low',
      },
      {
        id: 'step_check_priority',
        name: 'Check Priority',
        type: 'decision',
        description: 'Is this high-priority?',
        condition: {
          id: 'cond_priority',
          operator: 'or',
          left: 'priority_check',
          conditions: [
            {
              id: 'cond_starred',
              operator: 'equals',
              left: '$.step_read_email.starred',
              right: 'true',
            },
            {
              id: 'cond_urgent',
              operator: 'contains',
              left: '$.step_read_email.subject',
              right: 'URGENT|CRITICAL|EMERGENCY',
            },
          ],
        },
        requiresApproval: false,
        runInPreview: true,
        riskLevel: 'low',
      },
      {
        id: 'step_create_notification',
        name: 'Create Slack Message',
        type: 'connector',
        connectorName: 'slack',
        actionId: 'send_message',
        description: 'Send notification to Slack',
        requiresApproval: false,
        runInPreview: true,
        riskLevel: 'medium',
        inputMapping: {
          channel: '#alerts',
          text: '$.step_sanitize_email.slack_message',
        },
      },
      {
        id: 'step_approval_send',
        name: 'Approve Notification',
        type: 'approval',
        description: 'Approve Slack message before sending',
        requiresApproval: true,
        approverId: 'admin@example.com',
        riskLevel: 'high',
      },
      {
        id: 'step_queue_send',
        name: 'Queue Slack Send',
        type: 'queue',
        description: 'Queue message for sending',
        requiresApproval: false,
        runInPreview: true,
      },
      {
        id: 'step_done',
        name: 'Complete',
        type: 'sink',
        requiresApproval: false,
      },
    ],
    edges: [
      { id: 'e1', from: 'trigger_gmail_priority', to: 'step_read_email', type: 'always' },
      { id: 'e2', from: 'step_read_email', to: 'step_sanitize_email', type: 'success' },
      { id: 'e3', from: 'step_sanitize_email', to: 'step_check_priority', type: 'success' },
      { id: 'e4', from: 'step_check_priority', to: 'step_create_notification', type: 'condition_true' },
      { id: 'e5', from: 'step_create_notification', to: 'step_approval_send', type: 'success' },
      { id: 'e6', from: 'step_approval_send', to: 'step_queue_send', type: 'approved' },
      { id: 'e7', from: 'step_queue_send', to: 'step_done', type: 'always' },
    ],
    maxRetries: 2,
    timeoutMs: 30000,
  },
  parameters: [],
  createdAt: BASE_TIME,
  createdBy: 'system',
  downloads: 0,
  tags: ['email', 'slack', 'notification', 'priority'],
};

/**
 * Template 3: Weekly Executive Brief Preview
 * Scheduled → Read metrics → Transform summary → Validate → Approval → Queue → Complete
 */
export const WEEKLY_BRIEF_TEMPLATE: WorkflowTemplate = {
  id: 'weekly_brief_template_v1',
  name: 'Weekly Executive Brief',
  description: 'Generate weekly executive brief from mission metrics',
  category: 'reporting',
  baseWorkflow: {
    id: 'wf_weekly_brief_v1',
    name: 'Weekly Executive Brief Preview Workflow',
    version: '1.0.0',
    description: 'Generate weekly executive summary',
    creator: 'system',
    createdAt: BASE_TIME,
    updatedAt: BASE_TIME,
    previewMode: true,
    enableAudit: true,
    trigger: {
      id: 'trigger_scheduled',
      type: 'scheduled',
      schedule: '0 9 * * 1', // Every Monday 9 AM
      description: 'Triggered every Monday at 9 AM',
    },
    steps: [
      {
        id: 'step_fetch_metrics',
        name: 'Fetch Mission Metrics',
        type: 'connector',
        connectorName: 'github',
        actionId: 'list_repos',
        description: 'Fetch key metrics from mission data',
        requiresApproval: false,
        runInPreview: true,
        riskLevel: 'low',
      },
      {
        id: 'step_transform_summary',
        name: 'Generate Executive Summary',
        type: 'transform',
        description: 'Transform metrics into readable summary',
        transform: {
          id: 'transform_brief',
          type: 'template',
          input: '$.step_fetch_metrics',
          output: 'executive_brief',
        },
        requiresApproval: false,
        runInPreview: true,
        riskLevel: 'low',
      },
      {
        id: 'step_validate_summary',
        name: 'Validate Summary',
        type: 'decision',
        description: 'Ensure summary is complete',
        condition: {
          id: 'cond_valid_summary',
          operator: 'is_not_null',
          left: '$.step_transform_summary.executive_brief',
        },
        requiresApproval: false,
        runInPreview: true,
        riskLevel: 'low',
      },
      {
        id: 'step_approval_brief',
        name: 'Approve Brief',
        type: 'approval',
        description: 'Executive must approve brief content',
        requiresApproval: true,
        approverId: 'executive@example.com',
        approvalTimeout: 7200000, // 2 hours
        riskLevel: 'high',
      },
      {
        id: 'step_queue_brief',
        name: 'Queue Distribution',
        type: 'queue',
        description: 'Queue brief for distribution',
        requiresApproval: false,
        runInPreview: true,
      },
      {
        id: 'step_completed',
        name: 'Completed',
        type: 'sink',
        requiresApproval: false,
      },
    ],
    edges: [
      { id: 'e1', from: 'trigger_scheduled', to: 'step_fetch_metrics', type: 'always' },
      { id: 'e2', from: 'step_fetch_metrics', to: 'step_transform_summary', type: 'success' },
      { id: 'e3', from: 'step_transform_summary', to: 'step_validate_summary', type: 'success' },
      { id: 'e4', from: 'step_validate_summary', to: 'step_approval_brief', type: 'condition_true' },
      { id: 'e5', from: 'step_approval_brief', to: 'step_queue_brief', type: 'approved' },
      { id: 'e6', from: 'step_queue_brief', to: 'step_completed', type: 'always' },
    ],
    maxRetries: 1,
    timeoutMs: 120000,
  },
  parameters: [
    {
      id: 'param_email_recipients',
      name: 'Email Recipients',
      type: 'string',
      description: 'Comma-separated list of executive emails',
      required: false,
      defaultValue: 'executive@example.com,leadership@example.com',
    },
  ],
  createdAt: BASE_TIME,
  createdBy: 'system',
  downloads: 0,
  tags: ['reporting', 'scheduled', 'executive', 'weekly'],
};

export const WORKFLOW_TEMPLATES = [GMAIL_TRIAGE_TEMPLATE, GMAIL_TO_SLACK_TEMPLATE, WEEKLY_BRIEF_TEMPLATE];
