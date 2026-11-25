/**
 * Gamma Flow 1.0 Mock Data
 * 
 * Deterministic test fixtures for workflows
 */

import type {
  WorkflowDefinition,
  WorkflowExecution,
  WorkflowTemplate,
  ApprovalCheckpoint,
  QueuedWorkflowItem,
  WorkflowAuditEvent,
} from './types';

export const BASE_TIME = new Date('2026-07-10T12:00:00Z');

export const MOCK_WORKFLOW_DEFINITIONS: Record<string, WorkflowDefinition> = {
  gmail_triage_preview: {
    id: 'wf_gmail_triage_001',
    name: 'Gmail Triage Preview',
    description: 'Triage incoming Gmail messages and compose responses',
    version: '1.0.0',
    
    trigger: {
      id: 'trigger_gmail_new',
      type: 'connector_event',
      connectorName: 'gmail',
      eventType: 'new_message',
      description: 'Triggers on new Gmail message',
    },
    
    steps: [
      {
        id: 'step_read_gmail',
        type: 'connector',
        name: 'Read Gmail Message',
        connectorName: 'gmail',
        actionId: 'read_message',
        outputVariable: 'message',
        runInPreview: true,
        riskLevel: 'low',
      },
      {
        id: 'step_decide_reply',
        type: 'decision',
        name: 'Needs Reply?',
        condition: {
          id: 'cond_has_question',
          operator: 'contains',
          left: '$.message.body',
          right: '?',
        },
      },
      {
        id: 'step_compose_draft',
        type: 'connector',
        name: 'Compose Draft',
        connectorName: 'gmail',
        actionId: 'create_draft',
        inputMapping: { to: '$.message.from', subject: '$.message.subject' },
        outputVariable: 'draft',
        runInPreview: true,
        riskLevel: 'low',
      },
      {
        id: 'step_approval_send',
        type: 'approval',
        name: 'Approve Send',
        approverId: 'user_001',
        approvalRequired: true,
        approvalTimeout: 3600000,
        requiresApproval: true,
      },
      {
        id: 'step_queue_send',
        type: 'queue',
        name: 'Queue Send',
        requiresQueue: true,
      },
      {
        id: 'step_sink_completed',
        type: 'sink',
        name: 'Completed',
      },
    ],
    
    edges: [
      {
        id: 'edge_1',
        from: 'step_read_gmail',
        to: 'step_decide_reply',
        type: 'always',
      },
      {
        id: 'edge_2',
        from: 'step_decide_reply',
        to: 'step_compose_draft',
        type: 'condition_true',
      },
      {
        id: 'edge_3',
        from: 'step_decide_reply',
        to: 'step_sink_completed',
        type: 'condition_false',
      },
      {
        id: 'edge_4',
        from: 'step_compose_draft',
        to: 'step_approval_send',
        type: 'success',
      },
      {
        id: 'edge_5',
        from: 'step_approval_send',
        to: 'step_queue_send',
        type: 'approved',
      },
      {
        id: 'edge_6',
        from: 'step_queue_send',
        to: 'step_sink_completed',
        type: 'always',
      },
    ],
    
    creator: 'system',
    createdAt: BASE_TIME,
    updatedAt: BASE_TIME,
    tags: ['gmail', 'preview', 'triage'],
    
    requiresApprovalBeforeExecution: true,
    enableAudit: true,
    previewMode: true,
  },

  gmail_to_slack_preview: {
    id: 'wf_gmail_slack_001',
    name: 'Gmail to Slack Preview',
    description: 'Forward important emails to Slack',
    version: '1.0.0',
    
    trigger: {
      id: 'trigger_gmail_important',
      type: 'connector_event',
      connectorName: 'gmail',
      eventType: 'new_message',
    },
    
    steps: [
      {
        id: 'step_read_msg',
        type: 'connector',
        name: 'Read Message',
        connectorName: 'gmail',
        actionId: 'read_message',
        outputVariable: 'msg',
        runInPreview: true,
        riskLevel: 'low',
      },
      {
        id: 'step_filter_priority',
        type: 'decision',
        name: 'High Priority?',
        condition: {
          id: 'cond_priority',
          operator: 'contains',
          left: '$.msg.labels',
          right: 'IMPORTANT',
        },
      },
      {
        id: 'step_slack_notify',
        type: 'connector',
        name: 'Slack Notification',
        connectorName: 'slack',
        actionId: 'send_message',
        inputMapping: { channel: '#notifications', text: '$.msg.subject' },
        runInPreview: true,
        riskLevel: 'low',
      },
      {
        id: 'step_approval_slack',
        type: 'approval',
        name: 'Approve Slack Send',
        requiresApproval: true,
      },
      {
        id: 'step_queue_slack',
        type: 'queue',
        name: 'Queue',
        requiresQueue: true,
      },
      {
        id: 'step_done',
        type: 'sink',
        name: 'Done',
      },
    ],
    
    edges: [
      { id: 'e1', from: 'step_read_msg', to: 'step_filter_priority', type: 'always' },
      { id: 'e2', from: 'step_filter_priority', to: 'step_slack_notify', type: 'condition_true' },
      { id: 'e3', from: 'step_filter_priority', to: 'step_done', type: 'condition_false' },
      { id: 'e4', from: 'step_slack_notify', to: 'step_approval_slack', type: 'success' },
      { id: 'e5', from: 'step_approval_slack', to: 'step_queue_slack', type: 'approved' },
      { id: 'e6', from: 'step_queue_slack', to: 'step_done', type: 'always' },
    ],
    
    creator: 'system',
    createdAt: BASE_TIME,
    updatedAt: BASE_TIME,
    tags: ['gmail', 'slack', 'notification'],
    
    requiresApprovalBeforeExecution: true,
    enableAudit: true,
    previewMode: true,
  },
};

export const MOCK_WORKFLOW_EXECUTIONS: Record<string, WorkflowExecution> = {
  exec_triage_preview: {
    id: 'exec_001',
    workflowId: 'wf_gmail_triage_001',
    workflowVersionNumber: 1,
    state: 'running_preview',
    
    triggerData: {
      messageId: 'msg_123',
      from: 'john@example.com',
      subject: 'Meeting this week?',
    },
    triggeredAt: new Date(BASE_TIME.getTime() + 0),
    triggeredBy: 'user_001',
    
    startedAt: new Date(BASE_TIME.getTime() + 1000),
    currentStepId: 'step_approval_send',
    
    stepStates: {
      step_read_gmail: {
        stepId: 'step_read_gmail',
        state: 'completed',
        output: { body: 'Meeting this week?', from: 'john@example.com' },
        completedAt: new Date(BASE_TIME.getTime() + 100),
      },
      step_decide_reply: {
        stepId: 'step_decide_reply',
        state: 'completed',
        output: { result: true },
        completedAt: new Date(BASE_TIME.getTime() + 200),
      },
      step_compose_draft: {
        stepId: 'step_compose_draft',
        state: 'completed',
        output: { draftId: 'draft_001' },
        completedAt: new Date(BASE_TIME.getTime() + 500),
      },
      step_approval_send: {
        stepId: 'step_approval_send',
        state: 'waiting_approval',
      },
    },
    
    isPreview: true,
    previewOutputs: {
      step_read_gmail: { body: 'Meeting this week?' },
      step_decide_reply: true,
      step_compose_draft: { draftId: 'draft_001' },
    },
    
    pendingApprovals: [
      {
        id: 'appr_001',
        executionId: 'exec_001',
        stepId: 'step_approval_send',
        requiredApprovalLevel: 'medium',
        approverId: 'user_001',
        requestedAt: new Date(BASE_TIME.getTime() + 600),
        timeoutAt: new Date(BASE_TIME.getTime() + 3600000 + 600),
      },
    ],
    
    queuedItems: [],
    
    auditEvents: [
      {
        id: 'audit_001',
        executionId: 'exec_001',
        eventType: 'workflow_started',
        actor: 'system',
        timestamp: new Date(BASE_TIME.getTime() + 1000),
        details: { trigger: 'connector_event' },
        severity: 'info',
      },
    ],
  },

  exec_slack_preview: {
    id: 'exec_002',
    workflowId: 'wf_gmail_slack_001',
    workflowVersionNumber: 1,
    state: 'completed_preview',
    
    triggerData: { messageId: 'msg_456' },
    triggeredAt: BASE_TIME,
    triggeredBy: 'system',
    
    startedAt: BASE_TIME,
    completedAt: new Date(BASE_TIME.getTime() + 2000),
    
    stepStates: {
      step_read_msg: { stepId: 'step_read_msg', state: 'completed', output: {} },
      step_filter_priority: { stepId: 'step_filter_priority', state: 'completed', output: true },
      step_slack_notify: { stepId: 'step_slack_notify', state: 'completed', output: {} },
      step_approval_slack: { stepId: 'step_approval_slack', state: 'approved' },
      step_queue_slack: { stepId: 'step_queue_slack', state: 'queued' },
      step_done: { stepId: 'step_done', state: 'completed' },
    },
    
    isPreview: true,
    previewOutputs: {},
    pendingApprovals: [],
    queuedItems: [],
    
    result: { status: 'preview_completed', itemsQueued: 1 },
    
    auditEvents: [],
  },
};

export const MOCK_WORKFLOW_TEMPLATES: Record<string, WorkflowTemplate> = {
  gmail_triage: {
    id: 'tmpl_gmail_triage_001',
    name: 'Gmail Triage',
    description: 'Template for triaging and composing Gmail responses',
    category: 'gmail',
    baseWorkflow: MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview,
    createdAt: BASE_TIME,
    createdBy: 'system',
    downloads: 42,
    rating: 4.8,
    tags: ['gmail', 'automation', 'popular'],
    documentation: '# Gmail Triage Template\n\nUse this to automatically...',
    exampleScenarios: [
      'Reply to meeting requests',
      'Handle support questions',
      'Acknowledge important emails',
    ],
    parameters: [
      {
        id: 'param_approval_user',
        name: 'Approval User',
        type: 'string',
        description: 'User ID who must approve sends',
        required: true,
        defaultValue: 'user_001',
      },
    ],
  },
};
