export type DependencyType = 'requires' | 'blocks' | 'enables' | 'shares_asset' | 'shares_capability' | 'release_sequence';
export type DependencyStatus = 'proposed' | 'active' | 'blocked' | 'resolved';
export type ConflictType = 'capacity_contention' | 'priority_collision' | 'schedule_collision' | 'governance_conflict' | 'asset_conflict';
export type ConflictSeverity = 'low' | 'medium' | 'high' | 'critical';
export type SynergyType = 'shared_research' | 'shared_asset' | 'shared_workflow' | 'shared_capability' | 'coordinated_release' | 'knowledge_reuse';
export type OpportunityType = 'sequence' | 'consolidate' | 'reuse' | 'rebalance' | 'coordinate' | 'resolve_conflict';

export interface CrossProductDependency {
  id: string;
  sourceProductId: string;
  sourceInitiativeId?: string;
  targetProductId: string;
  targetInitiativeId?: string;
  type: DependencyType;
  status: DependencyStatus;
  rationale: string;
  evidenceIds: string[];
}

export interface CrossProductConflict {
  id: string;
  productIds: string[];
  initiativeIds: string[];
  type: ConflictType;
  severity: ConflictSeverity;
  rationale: string;
  evidenceIds: string[];
}

export interface CrossProductSynergy {
  id: string;
  productIds: string[];
  initiativeIds?: string[];
  type: SynergyType;
  expectedBenefit: string;
  confidence: number;
  evidenceIds: string[];
}

export interface OptimizationOpportunity {
  id: string;
  type: OpportunityType;
  affectedProductIds: string[];
  affectedInitiativeIds: string[];
  priority: number;
  rationale: string;
  evidenceIds: string[];
  expectedBenefit: string;
  tradeOffs: string[];
  requiredDecision: string;
  confidence: number;
}

export interface CoordinationBriefingSection {
  dependencyGraph: {
    totalDependencies: number;
    activeDependencies: number;
    blockedDependencies: number;
    resolvedDependencies: number;
    cyclicDependencyIds: string[];
    transitiveExpansions: number;
  };
  conflicts: CrossProductConflict[];
  synergies: CrossProductSynergy[];
  optimizationOpportunities: OptimizationOpportunity[];
}
