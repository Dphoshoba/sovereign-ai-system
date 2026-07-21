export interface WorkspaceDashboard {
  generatedAt: number;
  health: { score: number; status: string; trend: string };
  portfolioStatus: string;
  activeProgrammes: string[];
  executiveActionsPending: number;
  decisionsPending: number;
  risksActive: number;
  opportunitiesTracked: number;
  plansGenerated: number;
  scenariosAvailable: number;
  confidenceOverall: number;
  lastBriefingAt: string;
  nextRecommendation: string;
}

export function buildWorkspaceDashboard(params: {
  healthScore: number;
  recommendationCount: number;
  riskCount: number;
  opportunityCount: number;
  actionCount: number;
  decisionCount: number;
  planCount: number;
  scenarioCount: number;
  confidenceOverall: number;
  briefingTimestamp: string;
}): WorkspaceDashboard {
  const status = params.healthScore >= 80 ? 'Healthy' : params.healthScore >= 60 ? 'Stable' : 'Attention Required';
  const trend = params.healthScore >= 75 ? 'improving' : params.healthScore >= 50 ? 'stable' : 'declining';

  const nextRec = params.riskCount > 0
    ? `Address ${params.riskCount} active risk(s) with ${params.actionCount} queued actions`
    : `Capitalize on ${params.opportunityCount} tracked opportunities`;

  return {
    generatedAt: Date.now(),
    health: { score: params.healthScore, status, trend },
    portfolioStatus: `${params.opportunityCount} opportunities, ${params.riskCount} risks, ${params.decisionCount} decisions`,
    activeProgrammes: [
      'Executive Intelligence',
      'Action Generation',
      'Autonomous Planning',
      'Scenario Simulation',
      'Prediction Engine',
      'Decision Memory',
      'Enterprise Knowledge Graph',
    ],
    executiveActionsPending: params.actionCount,
    decisionsPending: params.decisionCount,
    risksActive: params.riskCount,
    opportunitiesTracked: params.opportunityCount,
    plansGenerated: params.planCount,
    scenariosAvailable: params.scenarioCount,
    confidenceOverall: params.confidenceOverall,
    lastBriefingAt: params.briefingTimestamp,
    nextRecommendation: nextRec,
  };
}
