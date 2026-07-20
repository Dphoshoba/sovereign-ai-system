export interface AllocationPeriod {
  start: number;
  end: number;
  label: string;
}

export type AllocationStatus = 'proposed' | 'approved' | 'active' | 'completed' | 'cancelled';
export type ConstraintType = 'governance' | 'dependency' | 'capability' | 'capacity' | 'schedule';
export type ConstraintSeverity = 'low' | 'medium' | 'high' | 'critical';
export type RecommendationType = 'increase-allocation' | 'reduce-allocation' | 'defer-initiative' | 'resolve-constraint-first' | 'rebalance-initiatives' | 'preserve-current';

export interface CapacityRecord {
  id: string;
  officeId: string;
  capabilityId?: string;
  availableUnits: number;
  period: AllocationPeriod;
  source: string;
  measuredAt: number;
  confidence: number;
}

export interface DemandRecord {
  id: string;
  productId: string;
  initiativeId: string;
  requestingOfficeId: string;
  requiredUnits: number;
  priority: number;
  period: AllocationPeriod;
  rationale: string;
}

export interface AllocationRecord {
  id: string;
  capacityId: string;
  demandId: string;
  allocatedUnits: number;
  status: AllocationStatus;
}

export interface AllocationConstraint {
  id: string;
  type: ConstraintType;
  productId?: string;
  initiativeId?: string;
  officeId?: string;
  severity: ConstraintSeverity;
  rationale: string;
}

export interface AllocationRecommendation {
  type: RecommendationType;
  priority: 'low' | 'medium' | 'high' | 'critical';
  action: string;
  supportingEvidence: string[];
  affectedProducts: string[];
  affectedOffices: string[];
  expectedBenefit: string;
  identifiedTradeoff: string;
  confidence: number;
  requiredExecutiveDecision: string;
}

export interface AllocationBriefingSection {
  enterpriseSummary: {
    totalCapacity: number;
    totalDemand: number;
    totalAllocated: number;
    allocationRate: number;
    utilizationRate: number | null;
    unmetDemand: number;
    constraintCount: number;
  };
  capacityByOffice: {
    officeId: string;
    availableUnits: number;
    allocatedUnits: number;
    allocationRate: number;
    constrained: boolean;
  }[];
  demandByProduct: {
    productId: string;
    requiredUnits: number;
    allocatedUnits: number;
    unmetDemand: number;
  }[];
  utilizationReport: {
    officeId: string;
    allocatedUnits: number;
    consumedUnits: number | null;
    utilizationRate: number | null;
    source: string;
  }[];
  constraints: AllocationConstraint[];
  recommendations: AllocationRecommendation[];
}
