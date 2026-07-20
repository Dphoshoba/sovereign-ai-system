export type LearningArtifactType =
  | 'lesson' | 'pattern' | 'playbook' | 'workflow_template'
  | 'governance_pattern' | 'best_practice' | 'executive_insight';

export type ArtifactStatus = 'draft' | 'candidate' | 'approved' | 'superseded' | 'archived';

export type ValidationStatus = 'current' | 'needs_review' | 'declining' | 'superseded';

export interface ValidationRecord {
  timestamp: number;
  status: ValidationStatus;
  reviewer: string;
  rationale: string;
}

export interface LearningArtifact {
  id: string;
  type: LearningArtifactType;
  title: string;
  description: string;
  status: ArtifactStatus;
  version: number;
  evidenceIds: string[];
  supersedes?: string;
  supersededBy?: string;
  confidence: number;
  productCoverage: string[];
  initiativeCoverage: string[];
  createdAt: number;
  lastValidated: number;
  approvedBy?: string;
  approvedAt?: number;
  rationale: string;
  validationStatus: ValidationStatus;
  validationHistory: ValidationRecord[];
  validationConfidence: number;
}

export interface ValidationAlert {
  artifactId: string;
  artifactTitle: string;
  alertType: 'needs_review' | 'confidence_declining' | 'superseded';
  previousValidationStatus: ValidationStatus;
  currentValidationStatus: ValidationStatus;
  lastValidated: number;
  rationale: string;
}

export interface InsightRecommendation {
  id: string;
  insightId: string;
  recommendation: string;
  rationale: string;
  evidenceIds: string[];
  confidence: number;
}

export interface LearningBriefingSection {
  newLessons: LearningArtifact[];
  emergingPatterns: LearningArtifact[];
  promotionCandidates: LearningArtifact[];
  recentlyApprovedStandards: LearningArtifact[];
  governanceRefinements: LearningArtifact[];
  validationAlerts: ValidationAlert[];
  supersededStandards: LearningArtifact[];
  executiveRecommendations: InsightRecommendation[];
}
