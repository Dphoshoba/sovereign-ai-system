import { OfficeHealth } from './types';
import { AllocationBriefingSection } from './resource-allocation-types';
import { CoordinationBriefingSection } from './cross-product-types';

export type KpiCategory = 'delivery' | 'operations' | 'governance' | 'quality' | 'knowledge' | 'executive';
export type KpiStatus = 'healthy' | 'attention' | 'critical' | 'unavailable';
export type Scope = 'product' | 'enterprise' | 'unattributed';
export type DependencyStatus = 'active' | 'blocked' | 'resolved';
export type InitiativeStatus = 'planned' | 'in-progress' | 'completed' | 'blocked';

export interface PortfolioKpiTarget {
  productId: string;
  category: KpiCategory;
  metric: string;
  target: number;
  unit: string;
  description: string;
}

export interface PortfolioKpiEvidence {
  productId: string;
  category: KpiCategory;
  metric: string;
  value: number;
  unit: string;
  source: string;
  measuredAt: number;
}

export interface PortfolioKpi {
  productId: string;
  category: KpiCategory;
  metric: string;
  value: number | null;
  target: number | null;
  unit: string;
  status: KpiStatus;
  source: string;
  measuredAt: number | null;
  description: string;
}

export interface PortfolioRisk {
  id: string;
  scope: Scope;
  productId?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedOffices: string[];
  raisedAt: number;
  source: 'eis' | 'product-registration';
}

export interface PortfolioDependency {
  id: string;
  sourceProductId: string;
  targetProductId: string;
  initiativeId?: string;
  type: string;
  status: DependencyStatus;
  rationale: string;
}

export interface PortfolioInitiative {
  id: string;
  name: string;
  description: string;
  productIds: string[];
  strategicObjective: string;
  status: InitiativeStatus;
  progress: number;
  startedAt: number | null;
  completedAt: number | null;
}

export interface PortfolioHealthDimension {
  status: OfficeHealth;
  rationale: string[];
}

export interface PortfolioHealth {
  overall: OfficeHealth;
  dimensions: {
    productCoverage: PortfolioHealthDimension;
    riskExposure: PortfolioHealthDimension;
    blockerSeverity: PortfolioHealthDimension;
    governanceStatus: PortfolioHealthDimension;
    deliveryMomentum: PortfolioHealthDimension;
  };
  productHealthDistribution: Record<string, OfficeHealth>;
  productRationale: Record<string, string[]>;
}

export interface PortfolioSnapshot {
  generatedAt: number;
  executiveBriefing: Readonly<import('./types').ExecutiveBriefing>;
  productProfiles: Readonly<import('./product-profile-types').ProductDeploymentProfile[]>;
  kpiTargets: Readonly<PortfolioKpiTarget[]>;
  kpiEvidence: Readonly<PortfolioKpiEvidence[]>;
  initiatives: Readonly<PortfolioInitiative[]>;
  dependencies: Readonly<PortfolioDependency[]>;
  productRisks: Readonly<PortfolioRisk[]>;
}

export interface ProductSummary {
  productId: string;
  productName: string;
  health: OfficeHealth;
  rationale: string[];
  kpis: PortfolioKpi[];
  risks: PortfolioRisk[];
  activeInitiatives: PortfolioInitiative[];
  kpiCategoriesReported: number;
}

export interface PortfolioBriefing {
  generatedAt: number;
  portfolioHealth: PortfolioHealth;
  executiveSummary: string;
  productSummaries: ProductSummary[];
  enterpriseRisks: PortfolioRisk[];
  unattributedItems: string[];
  crossProductDependencies: PortfolioDependency[];
  strategicPriorities: PortfolioInitiative[];
  recommendedActions: {
    priority: 'low' | 'medium' | 'high' | 'critical';
    action: string;
    rationale: string;
    supportingEvidence: string[];
    productId?: string;
  }[];
  kpiSummary: {
    category: KpiCategory;
    total: number;
    healthy: number;
    attention: number;
    critical: number;
    unavailable: number;
  }[];
  allocation: AllocationBriefingSection;
  coordination: CoordinationBriefingSection;
  metrics: {
    enterpriseSummary: {
      totalDefinitions: number;
      totalMeasurements: number;
      metricsWithData: number;
      metricsWithoutData: number;
      averageConfidence: number;
    };
    categoryBreakdown: {
      category: KpiCategory;
      metricCount: number;
      averageConfidence: number;
      improving: number;
      declining: number;
      stable: number;
      insufficientData: number;
    }[];
    productComparison: {
      productId: string;
      productName: string;
      metricsReported: number;
      metricsTargetMet: number;
      metricsAttention: number;
      metricsCritical: number;
      averageConfidence: number;
    }[];
    metricsRequiringAttention: {
      definitionId: string;
      name: string;
      productId: string;
      value: number | null;
      target: number | null;
      trend: string;
      confidence: number;
      rationale: string[];
    }[];
  };
  metadata: {
    generatedAt: number;
    productCount: number;
    initiativeCount: number;
    dependencyCount: number;
    totalKpis: number;
    kpisWithEvidence: number;
  };
}
