/**
 * Gmail Action Set
 *
 * Implements ActionSet from the Gamma Connector Platform SDK.
 * Actions supported: read mail, create draft. No direct send.
 *
 * SAFETY: All write actions require ENABLE_REAL_EXECUTION=true AND approval.
 * gmail.send is NOT exposed — only drafts.
 */

import type {
  ActionSet,
  ActionDefinition,
  ActionRequest,
  ActionPreview,
  ApprovedAction,
  ActionReceipt,
} from '../../platform/connector-platform-sdk';

export const GmailActionSet: ActionSet = {
  supportedActions: [
    {
      id: 'gmail_read_inbox',
      name: 'Read Inbox',
      description: 'Read messages from Gmail inbox (read-only)',
      riskLevel: 'low',
      requiresApproval: false,
      requiresFeatureFlag: false,
    },
    {
      id: 'gmail_create_draft',
      name: 'Create Draft',
      description: 'Create a Gmail draft (does not send)',
      riskLevel: 'medium',
      requiresApproval: true,
      requiresFeatureFlag: true,
      featureFlagKey: 'ENABLE_REAL_EXECUTION',
    },
    {
      id: 'gmail_update_draft',
      name: 'Update Draft',
      description: 'Update an existing Gmail draft',
      riskLevel: 'medium',
      requiresApproval: true,
      requiresFeatureFlag: true,
      featureFlagKey: 'ENABLE_REAL_EXECUTION',
    },
    {
      id: 'gmail_delete_draft',
      name: 'Delete Draft',
      description: 'Delete an existing Gmail draft',
      riskLevel: 'high',
      requiresApproval: true,
      requiresFeatureFlag: true,
      featureFlagKey: 'ENABLE_REAL_EXECUTION',
    },
  ] satisfies ActionDefinition[],

  async preview(action: ActionRequest): Promise<ActionPreview> {
    const def = GmailActionSet.supportedActions.find(a => a.id === action.actionId);

    return {
      actionId: action.actionId,
      description: def?.description ?? `Would execute ${action.actionId}`,
      affectedResources: ['Gmail Mailbox'],
      estimatedImpact: action.actionId === 'gmail_read_inbox'
        ? 'Read-only — no changes to mailbox'
        : 'Draft will be created/modified in Gmail',
      riskWarnings: def?.riskLevel === 'high'
        ? ['This action modifies Gmail data — review carefully before approving']
        : [],
      requiresApproval: def?.requiresApproval ?? true,
    };
  },

  async execute(action: ApprovedAction): Promise<ActionReceipt> {
    const realExecution = process.env.ENABLE_REAL_EXECUTION === 'true';

    if (!realExecution) {
      return {
        actionId: action.actionId,
        queueId: action.queueId,
        status: 'queued',
        result: { note: 'Queued — ENABLE_REAL_EXECUTION=false, no action taken' },
        executedAt: action.approvedAt,
        auditId: `audit_${action.queueId}`,
      };
    }

    return {
      actionId: action.actionId,
      queueId: action.queueId,
      status: 'failed',
      error: 'Gmail live action adapter is not configured; live action blocked',
      executedAt: action.approvedAt,
      auditId: `audit_${action.queueId}`,
    };
  },
};
