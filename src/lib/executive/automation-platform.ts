export interface AutomationCapability {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'failed' | 'not_configured';
  version: string;
  schedule: string;
  lastRunAt?: number;
  nextRunAt?: number;
  auditTrailCount: number;
}

export interface AutomationPlatform {
  capabilities: AutomationCapability[];
  totalActive: number;
  totalPaused: number;
  totalFailed: number;
  generatedAt: number;
}

export function buildAutomationPlatform(context: {
  actionCount: number;
  scenarioCount: number;
  predictionCount: number;
}): AutomationPlatform {
  return {
    capabilities: [
      { id: 'evidence-confidence', name: 'Evidence Confidence Engine', status: 'active', version: '1.2', schedule: 'on-demand', auditTrailCount: context.actionCount },
      { id: 'explainability', name: 'Executive Explainability', status: 'active', version: '1.3', schedule: 'on-demand', auditTrailCount: context.actionCount },
      { id: 'decision-memory', name: 'Decision Memory', status: 'active', version: '1.4', schedule: 'on-demand', auditTrailCount: context.actionCount },
      { id: 'prediction', name: 'Prediction Engine', status: 'active', version: '1.5', schedule: 'on-demand', auditTrailCount: context.predictionCount },
      { id: 'scenario-simulator', name: 'Scenario Simulator', status: 'active', version: '1.6', schedule: 'on-demand', auditTrailCount: context.scenarioCount },
      { id: 'autonomous-planning', name: 'Autonomous Planning', status: 'active', version: '1.7', schedule: 'daily', auditTrailCount: context.actionCount },
      { id: 'action-engine', name: 'Action Generation', status: 'active', version: '2.0', schedule: 'on-demand', auditTrailCount: context.actionCount },
    ],
    totalActive: 7,
    totalPaused: 0,
    totalFailed: 0,
    generatedAt: Date.now(),
  };
}
