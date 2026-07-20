import {
  FederatedObservability,
  NodeHealthReport,
  NodeHealthStatus,
  DistributedHealthSummary,
  TelemetryEvent,
  FederationAnalytics,
  WorkflowTypeCount,
  FederationDashboard,
  GlobalOperationalSummary,
  FederatedObservabilityError,
} from "./federated-observability";
import { FederationRegistry } from "./federation-registry";

let telemetryCounter = 0;

function nextTelemetryId(): string {
  return `tel-${++telemetryCounter}-${Date.now()}`;
}

export class FederatedObservabilityImpl implements FederatedObservability {
  private healthReports = new Map<string, NodeHealthReport>();
  private telemetry: TelemetryEvent[] = [];

  constructor(private readonly registry: FederationRegistry) {}

  // ── Health ──

  reportNodeHealth(nodeId: string, report: NodeHealthReport): void {
    if (!this.registry.getNode(nodeId)) throw new FederatedObservabilityError(`Node not found: ${nodeId}`);
    this.healthReports.set(nodeId, report);
  }

  getNodeHealth(nodeId: string): NodeHealthReport | undefined {
    return this.healthReports.get(nodeId);
  }

  getAllNodeHealth(): readonly NodeHealthReport[] {
    return [...this.healthReports.values()];
  }

  getDistributedHealth(): DistributedHealthSummary {
    const reports = this.getAllNodeHealth();
    const totalNodes = this.registry.listNodes().length;

    // Nodes registered but without health report are 'unknown'
    const reported = new Set(reports.map(r => r.nodeId));
    const registered = new Set(this.registry.listNodes().map(n => n.identity.nodeId));

    const unknownCount = [...registered].filter(id => !reported.has(id)).length;

    const healthyNodes = reports.filter(r => r.status === 'healthy').length;
    const degradedNodes = reports.filter(r => r.status === 'degraded').length;
    const unreachableNodes = reports.filter(r => r.status === 'unreachable').length;

    let overallStatus: 'healthy' | 'degraded' | 'critical';
    if (unreachableNodes > 0) {
      overallStatus = 'critical';
    } else if (degradedNodes > 0) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'healthy';
    }

    return {
      totalNodes: totalNodes + unknownCount,
      healthyNodes: healthyNodes + unknownCount,
      degradedNodes,
      unreachableNodes,
      overallStatus,
    };
  }

  // ── Telemetry ──

  reportTelemetry(nodeId: string, events: readonly TelemetryEvent[]): void {
    if (!this.registry.getNode(nodeId)) throw new FederatedObservabilityError(`Node not found: ${nodeId}`);
    for (const event of events) {
      this.telemetry.push({
        ...event,
        id: event.id || nextTelemetryId(),
        nodeId,
        timestamp: event.timestamp || Date.now(),
      });
    }
  }

  getNodeTelemetry(nodeId: string, limit?: number): readonly TelemetryEvent[] {
    const filtered = this.telemetry.filter(e => e.nodeId === nodeId);
    return limit ? filtered.slice(-limit) : filtered;
  }

  getFederationTelemetry(limit?: number): readonly TelemetryEvent[] {
    return limit ? this.telemetry.slice(-limit) : [...this.telemetry];
  }

  // ── Analytics ──

  getAnalytics(): FederationAnalytics {
    const healthReports = this.getAllNodeHealth();
    const totalTelemetry = this.telemetry.length;

    // Count execution-type events
    const executionEvents = this.telemetry.filter(e => e.type === 'execution');
    const successfulExecutions = executionEvents.filter(e => e.labels.outcome === 'success').length;
    const totalExecutions = executionEvents.length;
    const successRate = totalExecutions > 0 ? successfulExecutions / totalExecutions : 1;

    const avgLatency = healthReports.length > 0
      ? healthReports.reduce((sum, r) => sum + r.latencyMs, 0) / healthReports.length
      : 0;

    // Count workflow types
    const typeCounts = new Map<string, number>();
    for (const e of executionEvents) {
      const wfType = e.labels.workflowType || 'unknown';
      typeCounts.set(wfType, (typeCounts.get(wfType) || 0) + 1);
    }
    const top: WorkflowTypeCount[] = [...typeCounts.entries()]
      .map(([workflowType, count]) => ({ workflowType, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalExecutions,
      successRate: Math.round(successRate * 1000) / 1000,
      avgLatencyMs: Math.round(avgLatency),
      activeNodes: healthReports.filter(r => r.status !== 'unreachable').length,
      topWorkflowTypes: top,
    };
  }

  // ── Dashboard ──

  getDashboard(): FederationDashboard {
    return {
      generatedAt: Date.now(),
      health: this.getDistributedHealth(),
      analytics: this.getAnalytics(),
      recentTelemetry: this.getFederationTelemetry(20),
    };
  }

  // ── Summary ──

  getGlobalSummary(): GlobalOperationalSummary {
    const health = this.getDistributedHealth();
    const analytics = this.getAnalytics();

    return {
      generatedAt: Date.now(),
      registeredNodes: this.registry.listNodes().length,
      activeNodes: health.healthyNodes,
      degradedNodes: health.degradedNodes,
      totalExecutions: analytics.totalExecutions,
      overallHealth: health.overallStatus,
    };
  }
}
