import { WorkflowDefinition } from "./workflow-graph";
import { WorkflowExecutionPolicy } from "./workflow-governance";

// ── Provider Capability Metadata ──

export interface ProviderCapability {
  readonly providerId: string;
  readonly operation: string;
  readonly estimatedCost: number;
  readonly estimatedLatencyMs: number;
  readonly confidence: number;
}

// ── Planning Context ──

export interface PlanningContext {
  readonly workflowId: string;
  readonly version: string;
  readonly executionId: string;
  readonly costCeiling: number | null;
  readonly latencyObjectiveMs: number | null;
  readonly preferredProviders: readonly string[];
  readonly jurisdiction: string | null;
}

// ── Planning Request ──

export interface PlanningRequest {
  readonly definition: WorkflowDefinition;
  readonly context: PlanningContext;
  readonly capabilities: readonly ProviderCapability[];
  readonly policy: WorkflowExecutionPolicy | null;
}

// ── Provider Assignment ──

export interface ProviderAssignment {
  readonly stepId: string;
  readonly providerId: string;
  readonly operation: string;
  readonly cost: number;
  readonly latencyMs: number;
  readonly confidence: number;
}

// ── Ranked Plan ──

export interface RankedPlan {
  readonly rank: number;
  readonly score: number;
  readonly explanation: string;
  readonly assignments: readonly ProviderAssignment[];
  readonly totalCost: number;
  readonly totalLatencyMs: number;
  readonly violations: readonly string[];
  readonly strategy: string;
}

// ── Planning Result ──

export interface PlanningResult {
  readonly workflowId: string;
  readonly executionId: string;
  readonly selectedPlan: RankedPlan;
  readonly alternatives: readonly RankedPlan[];
  readonly providerMetadataSnapshot: readonly ProviderCapability[];
}

// ── Planning Engine ──

export interface PlanningEngine {
  plan(request: PlanningRequest): PlanningResult;
}
