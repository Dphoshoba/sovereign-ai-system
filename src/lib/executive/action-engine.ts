import { ReasoningChain, buildReasoning } from './evidence-confidence';

export type ActionType = 'approve' | 'schedule' | 'delegate' | 'monitor' | 'complete' | 'learn';
export type ActionStatus = 'queued' | 'in_progress' | 'completed' | 'cancelled' | 'rolled_back';

export interface ExecutiveAction {
  id: string;
  title: string;
  actionType: ActionType;
  status: ActionStatus;
  priority: 'low' | 'medium' | 'high' | 'critical';
  reasoning: ReasoningChain;
  assignedTo: string;
  deadline: string;
  successCriteria: string;
  rollbackPlan: string;
  learningApplied: string[];
  createdAt: number;
}

export function generateActionsFromRecommendations(
  recommendations: Array<{ title: string; action: string; priority: string; confidence: number }>,
  riskCount: number
): ExecutiveAction[] {
  const actions: ExecutiveAction[] = [];
  const now = Date.now();

  for (let i = 0; i < Math.min(10, recommendations.length); i++) {
    const rec = recommendations[i];
    const actionType: ActionType = i < 3 ? 'approve' : i < 6 ? 'schedule' : 'delegate';

    actions.push({
      id: `action-${now}-${i}`,
      title: rec.action,
      actionType,
      status: 'queued',
      priority: rec.priority as ExecutiveAction['priority'],
      reasoning: buildReasoning({
        summary: `Action derived from recommendation: ${rec.title} (confidence ${rec.confidence})`,
        evidenceIds: [`rec-${i}`],
        confidenceScore: rec.confidence,
        sourceCount: 1,
        dataFreshnessHours: 0,
        missingEvidence: [],
        hasConflictingEvidence: false,
        decisionFactors: [`Recommendation: ${rec.title}`, `Confidence: ${rec.confidence}`, `Risk context: ${riskCount} active risks`],
      }),
      assignedTo: actionType === 'delegate' ? 'Operations' : 'Executive',
      deadline: `${Math.ceil((i + 1) * 7)} days`,
      successCriteria: `Action ${i + 1} completed with measurable outcome`,
      rollbackPlan: 'Re-evaluate recommendation and revert if conditions change',
      learningApplied: [],
      createdAt: now,
    });
  }

  return actions;
}

export interface ActionQueue {
  total: number;
  byType: Record<ActionType, number>;
  byPriority: Record<string, number>;
  actions: ExecutiveAction[];
  generatedAt: number;
}

export function buildActionQueue(actions: ExecutiveAction[]): ActionQueue {
  const byType: Record<string, number> = {};
  const byPriority: Record<string, number> = {};
  for (const a of actions) {
    byType[a.actionType] = (byType[a.actionType] || 0) + 1;
    byPriority[a.priority] = (byPriority[a.priority] || 0) + 1;
  }
  return {
    total: actions.length,
    byType: byType as Record<ActionType, number>,
    byPriority,
    actions,
    generatedAt: Date.now(),
  };
}
