import { describe, it, expect, beforeEach } from 'vitest';
import { FederationRegistryImpl } from '../../lib/platform/federation/federation-registry-impl';
import { FederatedObservabilityImpl } from '../../lib/platform/federation/federated-observability-impl';
import {
  FederatedObservability,
  FederatedObservabilityError,
  NodeHealthReport,
  TelemetryEvent,
} from '../../lib/platform/federation/federated-observability';
import { NodeIdentity } from '../../lib/platform/federation/federation-registry';

const nodeA: NodeIdentity = { nodeId: 'gamma-us-east', host: 'us-east.gamma.local', platformVersion: '1.0.0', metadata: {} };
const nodeB: NodeIdentity = { nodeId: 'gamma-eu-west', host: 'eu-west.gamma.local', platformVersion: '1.0.0', metadata: {} };
const nodeC: NodeIdentity = { nodeId: 'gamma-ap-south', host: 'ap-south.gamma.local', platformVersion: '1.1.0', metadata: {} };

describe('FederatedObservabilityImpl', () => {
  let registry: FederationRegistryImpl;
  let observability: FederatedObservability;

  beforeEach(() => {
    registry = new FederationRegistryImpl();
    registry.registerNode(nodeA, 'participant', []);
    registry.registerNode(nodeB, 'participant', []);
    registry.registerNode(nodeC, 'participant', []);
    observability = new FederatedObservabilityImpl(registry);
  });

  // ── 8D.1 — Node Health Reporting ──

  describe('8D.1 — Node Health Reporting', () => {
    it('reports health for a registered node', () => {
      observability.reportNodeHealth('gamma-us-east', {
        nodeId: 'gamma-us-east', status: 'healthy', uptimeMs: 86400000,
        lastReportedAt: Date.now(), activeWorkflows: 5, errorRate: 0.01, latencyMs: 42,
      });
      const report = observability.getNodeHealth('gamma-us-east');
      expect(report).toBeDefined();
      expect(report!.status).toBe('healthy');
      expect(report!.activeWorkflows).toBe(5);
    });

    it('throws on unknown node', () => {
      expect(() => observability.reportNodeHealth('unknown', {
        nodeId: 'unknown', status: 'healthy', uptimeMs: 0,
        lastReportedAt: Date.now(), activeWorkflows: 0, errorRate: 0, latencyMs: 0,
      })).toThrow(FederatedObservabilityError);
    });

    it('replaces previous health report on re-report', () => {
      observability.reportNodeHealth('gamma-us-east', {
        nodeId: 'gamma-us-east', status: 'degraded', uptimeMs: 1000,
        lastReportedAt: Date.now(), activeWorkflows: 3, errorRate: 0.1, latencyMs: 200,
      });
      observability.reportNodeHealth('gamma-us-east', {
        nodeId: 'gamma-us-east', status: 'healthy', uptimeMs: 2000,
        lastReportedAt: Date.now(), activeWorkflows: 5, errorRate: 0.01, latencyMs: 30,
      });
      expect(observability.getNodeHealth('gamma-us-east')!.status).toBe('healthy');
    });

    it('lists all node health reports', () => {
      for (const nodeId of ['gamma-us-east', 'gamma-eu-west']) {
        observability.reportNodeHealth(nodeId, {
          nodeId, status: 'healthy', uptimeMs: 1000,
          lastReportedAt: Date.now(), activeWorkflows: 1, errorRate: 0, latencyMs: 10,
        });
      }
      expect(observability.getAllNodeHealth().length).toBe(2);
    });
  });

  // ── 8D.2 — Distributed Health ──

  describe('8D.2 — Distributed Health', () => {
    it('reports all nodes as healthy when no health data reported', () => {
      const health = observability.getDistributedHealth();
      expect(health.totalNodes).toBeGreaterThanOrEqual(3);
      expect(health.overallStatus).toBe('healthy');
    });

    it('reports degraded when any node is degraded', () => {
      observability.reportNodeHealth('gamma-us-east', {
        nodeId: 'gamma-us-east', status: 'degraded', uptimeMs: 1000,
        lastReportedAt: Date.now(), activeWorkflows: 5, errorRate: 0.1, latencyMs: 500,
      });
      expect(observability.getDistributedHealth().overallStatus).toBe('degraded');
    });

    it('reports critical when any node is unreachable', () => {
      observability.reportNodeHealth('gamma-us-east', {
        nodeId: 'gamma-us-east', status: 'unreachable', uptimeMs: 0,
        lastReportedAt: Date.now(), activeWorkflows: 0, errorRate: 1, latencyMs: 0,
      });
      expect(observability.getDistributedHealth().overallStatus).toBe('critical');
    });
  });

  // ── 8D.3 — Telemetry ──

  describe('8D.3 — Telemetry', () => {
    it('reports telemetry events for a node', () => {
      observability.reportTelemetry('gamma-us-east', [
        { id: '', nodeId: '', type: 'execution', value: 1, timestamp: 0, labels: { outcome: 'success' } },
      ]);
      const events = observability.getNodeTelemetry('gamma-us-east');
      expect(events.length).toBe(1);
    });

    it('throws on telemetry for unknown node', () => {
      expect(() => observability.reportTelemetry('unknown', [])).toThrow(FederatedObservabilityError);
    });

    it('retrieves federation-wide telemetry', () => {
      observability.reportTelemetry('gamma-us-east', [
        { id: '', nodeId: '', type: 'execution', value: 1, timestamp: 0, labels: { outcome: 'success' } },
      ]);
      observability.reportTelemetry('gamma-eu-west', [
        { id: '', nodeId: '', type: 'execution', value: 1, timestamp: 0, labels: { outcome: 'failure' } },
      ]);
      expect(observability.getFederationTelemetry().length).toBe(2);
    });

    it('limits telemetry results', () => {
      for (let i = 0; i < 5; i++) {
        observability.reportTelemetry('gamma-us-east', [
          { id: '', nodeId: '', type: 'heartbeat', value: 1, timestamp: 0, labels: {} },
        ]);
      }
      expect(observability.getFederationTelemetry(3).length).toBe(3);
    });
  });

  // ── 8D.4 — Federation Analytics ──

  describe('8D.4 — Federation Analytics', () => {
    it('reports analytics from telemetry data', () => {
      observability.reportTelemetry('gamma-us-east', [
        { id: '', nodeId: '', type: 'execution', value: 1, timestamp: 0, labels: { outcome: 'success', workflowType: 'data-sync' } },
        { id: '', nodeId: '', type: 'execution', value: 1, timestamp: 0, labels: { outcome: 'failure', workflowType: 'data-sync' } },
        { id: '', nodeId: '', type: 'execution', value: 1, timestamp: 0, labels: { outcome: 'success', workflowType: 'backup' } },
      ]);
      const analytics = observability.getAnalytics();
      expect(analytics.totalExecutions).toBe(3);
      expect(analytics.successRate).toBeCloseTo(0.667, 2);
    });

    it('reports 100% success rate when no failures', () => {
      observability.reportTelemetry('gamma-us-east', [
        { id: '', nodeId: '', type: 'execution', value: 1, timestamp: 0, labels: { outcome: 'success', workflowType: 'sync' } },
      ]);
      expect(observability.getAnalytics().successRate).toBe(1);
    });

    it('reports 0 executions when no telemetry', () => {
      const analytics = observability.getAnalytics();
      expect(analytics.totalExecutions).toBe(0);
      expect(analytics.successRate).toBe(1);
    });

    it('identifies top workflow types', () => {
      for (let i = 0; i < 5; i++) {
        observability.reportTelemetry('gamma-us-east', [
          { id: '', nodeId: '', type: 'execution', value: 1, timestamp: 0, labels: { outcome: 'success', workflowType: 'data-sync' } },
        ]);
      }
      observability.reportTelemetry('gamma-us-east', [
        { id: '', nodeId: '', type: 'execution', value: 1, timestamp: 0, labels: { outcome: 'success', workflowType: 'backup' } },
      ]);
      const analytics = observability.getAnalytics();
      expect(analytics.topWorkflowTypes[0].workflowType).toBe('data-sync');
      expect(analytics.topWorkflowTypes[0].count).toBe(5);
    });
  });

  // ── 8D.5 — Dashboard and Summary ──

  describe('8D.5 — Dashboard and Summary', () => {
    it('generates a dashboard with health, analytics, and recent telemetry', () => {
      observability.reportNodeHealth('gamma-us-east', {
        nodeId: 'gamma-us-east', status: 'healthy', uptimeMs: 1000,
        lastReportedAt: Date.now(), activeWorkflows: 3, errorRate: 0.01, latencyMs: 30,
      });
      observability.reportTelemetry('gamma-us-east', [
        { id: '', nodeId: '', type: 'execution', value: 1, timestamp: 0, labels: { outcome: 'success' } },
      ]);
      const dash = observability.getDashboard();
      expect(dash.health.overallStatus).toBeDefined();
      expect(dash.analytics.totalExecutions).toBe(1);
      expect(dash.recentTelemetry.length).toBeGreaterThan(0);
    });

    it('generates a global operational summary', () => {
      observability.reportNodeHealth('gamma-us-east', {
        nodeId: 'gamma-us-east', status: 'healthy', uptimeMs: 1000,
        lastReportedAt: Date.now(), activeWorkflows: 3, errorRate: 0.01, latencyMs: 30,
      });
      const summary = observability.getGlobalSummary();
      expect(summary.registeredNodes).toBe(3);
      expect(summary.overallHealth).toBe('healthy');
      expect(summary.generatedAt).toBeGreaterThan(0);
    });

    it('includes recent telemetry in dashboard', () => {
      for (let i = 0; i < 25; i++) {
        observability.reportTelemetry('gamma-us-east', [
          { id: '', nodeId: '', type: 'heartbeat', value: i, timestamp: 0, labels: {} },
        ]);
      }
      expect(observability.getDashboard().recentTelemetry.length).toBe(20);
    });
  });

  // ── 8D.6 — Edge Cases ──

  describe('8D.6 — Edge Cases', () => {
    it('handles empty telemetry report', () => {
      observability.reportTelemetry('gamma-us-east', []);
      expect(observability.getNodeTelemetry('gamma-us-east').length).toBe(0);
    });

    it('handles node health for unreachable node', () => {
      observability.reportNodeHealth('gamma-us-east', {
        nodeId: 'gamma-us-east', status: 'unreachable', uptimeMs: 0,
        lastReportedAt: Date.now(), activeWorkflows: 0, errorRate: 1, latencyMs: 0,
      });
      expect(observability.getNodeHealth('gamma-us-east')!.status).toBe('unreachable');
    });

    it('returns undefined for unknown node health', () => {
      expect(observability.getNodeHealth('unknown')).toBeUndefined();
    });

    it('handles dashboard with no reported health', () => {
      const dash = observability.getDashboard();
      expect(dash.health.totalNodes).toBeGreaterThan(0);
      expect(dash.analytics.totalExecutions).toBe(0);
    });
  });

  // ── 8D.7 — Determinism ──

  describe('8D.7 — Determinism', () => {
    it('produces same analytics for same telemetry', () => {
      const o1 = new FederatedObservabilityImpl(registry);
      const o2 = new FederatedObservabilityImpl(registry);

      const events = [
        { id: '', nodeId: '', type: 'execution' as const, value: 1, timestamp: 0, labels: { outcome: 'success', workflowType: 'sync' } },
        { id: '', nodeId: '', type: 'execution' as const, value: 1, timestamp: 0, labels: { outcome: 'failure', workflowType: 'sync' } },
      ];

      o1.reportTelemetry('gamma-us-east', events);
      o2.reportTelemetry('gamma-us-east', events);

      expect(o1.getAnalytics().totalExecutions).toBe(o2.getAnalytics().totalExecutions);
      expect(o1.getAnalytics().successRate).toBe(o2.getAnalytics().successRate);
    });
  });
});
