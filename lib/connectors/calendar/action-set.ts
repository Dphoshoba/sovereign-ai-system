/**
 * Calendar Action Set
 */
import type { ActionSet, ActionDefinition, ActionRequest, ActionPreview, ApprovedAction, ActionReceipt } from '../../platform/connector-platform-sdk';

export const CalendarActions: ActionSet = {
  supportedActions: [
    {
      id: 'calendar_read',
      name: 'Read Calendar Resources',
      description: 'Read resources from Google Calendar',
      riskLevel: 'low',
      requiresApproval: false,
      requiresFeatureFlag: false,
    },
    {
      id: 'calendar_create',
      name: 'Create Calendar Resource',
      description: 'Create a new resource in Google Calendar',
      riskLevel: 'medium',
      requiresApproval: true,
      requiresFeatureFlag: true,
      featureFlagKey: 'ENABLE_REAL_EXECUTION',
    },
  ] satisfies ActionDefinition[],
  async preview(action: ActionRequest): Promise<ActionPreview> {
    return {
      actionId: action.actionId,
      description: 'Would execute ' + action.actionId,
      affectedResources: [],
      estimatedImpact: 'None (preview only)',
      riskWarnings: [],
      requiresApproval: true,
    };
  },
  async execute(action: ApprovedAction): Promise<ActionReceipt> {
    const realExecution = process.env.ENABLE_REAL_EXECUTION === 'true';
    if (!realExecution) {
      return {
        actionId: action.actionId,
        queueId: action.queueId,
        status: 'queued',
        executedAt: action.approvedAt,
        auditId: 'audit_' + action.queueId,
      };
    }
    throw new Error('Real execution not yet implemented');
  },
};
