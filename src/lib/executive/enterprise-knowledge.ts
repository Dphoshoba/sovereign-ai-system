export interface KnowledgeRelation {
  source: string;
  target: string;
  relation: string;
  strength: number;
  evidenceIds: string[];
}

export interface KnowledgeGraphSummary {
  nodeCount: number;
  relationCount: number;
  entityTypes: string[];
  strongestRelations: KnowledgeRelation[];
  generatedAt: number;
}

export function buildEnterpriseKnowledgeSummary(context: {
  clientCount: number;
  projectCount: number;
  decisionCount: number;
  goalCount: number;
  riskCount: number;
}): KnowledgeGraphSummary {
  return {
    nodeCount: context.clientCount + context.projectCount + context.decisionCount + context.goalCount + context.riskCount,
    relationCount: context.projectCount * 2 + context.decisionCount + context.riskCount,
    entityTypes: ['Client', 'Project', 'Decision', 'Goal', 'Risk'],
    strongestRelations: [],
    generatedAt: Date.now(),
  };
}
