import { FederationRegistry } from "./federation-registry";

// ── Health ──

export type NodeHealthStatus = 'healthy' | 'degraded' | 'unreachable' | 'unknown';

export interface NodeHealthReport {
  readonly nodeId: string;
  readonly status: NodeHealthStatus;
  readonly uptimeMs: number;
  readonly lastReportedAt: number;
  readonly activeWorkflows: number;
  readonly errorRate: number;
  readonly latencyMs: number;
}

export interface DistributedHealthSummary {
  readonly totalNodes: number;
  readonly healthyNodes: number;
  readonly degradedNodes: number;
  readonly unreachableNodes: number;
  readonly overallStatus: 'healthy' | 'degraded' | 'critical';
}

// ── Telemetry ──

export interface TelemetryEvent {
  readonly id: string;
  readonly nodeId: string;
  readonly type: string;
  readonly value: number;
  readonly timestamp: number;
  readonly labels: Readonly<Record<string, string>>;
}

// ── Analytics ──

export interface WorkflowTypeCount {
  readonly workflowType: string;
  readonly count: number;
}

export interface FederationAnalytics {
  readonly totalExecutions: number;
  readonly successRate: number;
  readonly avgLatencyMs: number;
  readonly activeNodes: number;
  readonly topWorkflowTypes: readonly WorkflowTypeCount[];
}

// ── Dashboard ──

export interface FederationDashboard {
  readonly generatedAt: number;
  readonly health: DistributedHealthSummary;
  readonly analytics: FederationAnalytics;
  readonly recentTelemetry: readonly TelemetryEvent[];
}

// ── Summary ──

export interface GlobalOperationalSummary {
  readonly generatedAt: number;
  readonly registeredNodes: number;
  readonly activeNodes: number;
  readonly degradedNodes: number;
  readonly totalExecutions: number;
  readonly overallHealth: 'healthy' | 'degraded' | 'critical';
}

// ── Interface ──

export interface FederatedObservability {
  reportNodeHealth(nodeId: string, report: NodeHealthReport): void;
  getNodeHealth(nodeId: string): NodeHealthReport | undefined;
  getAllNodeHealth(): readonly NodeHealthReport[];
  getDistributedHealth(): DistributedHealthSummary;

  reportTelemetry(nodeId: string, events: readonly TelemetryEvent[]): void;
  getNodeTelemetry(nodeId: string, limit?: number): readonly TelemetryEvent[];
  getFederationTelemetry(limit?: number): readonly TelemetryEvent[];

  getAnalytics(): FederationAnalytics;
  getDashboard(): FederationDashboard;
  getGlobalSummary(): GlobalOperationalSummary;
}

// ── Error ──

export class FederatedObservabilityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FederatedObservabilityError';
  }
}
