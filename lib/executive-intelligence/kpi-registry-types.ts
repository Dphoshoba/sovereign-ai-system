import { KpiCategory } from './portfolio-types';
import { OfficeName } from './workflow-types';

export type TargetType = 'higher_is_better' | 'lower_is_better' | 'target_value';
export type MeasurementStatus = 'available' | 'estimated' | 'unavailable';
export type KpiTrendDirection = 'improving' | 'stable' | 'declining' | 'insufficient_data';

export interface KpiDefinition {
  id: string;
  category: KpiCategory;
  name: string;
  description: string;
  unit: string;
  measurementMethod: string;
  targetType: TargetType;
  ownerOffice: OfficeName;
  applicableProducts: string[];
  targetValue?: number;
}

export interface KpiMeasurement {
  measurementId: string;
  definitionId: string;
  productId: string;
  value: number;
  measuredAt: number;
  confidence: number;
  evidenceSource: string;
  status: MeasurementStatus;
}

export interface KpiTrendResult {
  definitionId: string;
  productId: string;
  direction: KpiTrendDirection;
  currentValue: number | null;
  previousValue: number | null;
  changePercent: number | null;
  confidence: number;
  period: { start: number; end: number };
  rationale: string[];
}

export interface MetricBriefingSection {
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
    trend: KpiTrendDirection;
    confidence: number;
    rationale: string[];
  }[];
}
