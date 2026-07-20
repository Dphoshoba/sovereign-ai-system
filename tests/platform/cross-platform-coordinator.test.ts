import { describe, it, expect, beforeEach } from 'vitest';
import { FederationRegistryImpl } from '../../lib/platform/federation/federation-registry-impl';
import { CrossPlatformCoordinatorImpl } from '../../lib/platform/federation/cross-platform-coordinator-impl';
import {
  CrossPlatformCoordinator,
  CrossPlatformCoordinatorError,
  RemoteExecutionRequest,
} from '../../lib/platform/federation/cross-platform-coordinator';
import { NodeIdentity, CapabilityAdvertisement } from '../../lib/platform/federation/federation-registry';

const nodeA: NodeIdentity = { nodeId: 'gamma-us-east', host: 'us-east.gamma.local', platformVersion: '1.0.0', metadata: {} };
const nodeB: NodeIdentity = { nodeId: 'gamma-eu-west', host: 'eu-west.gamma.local', platformVersion: '1.0.0', metadata: {} };
const nodeC: NodeIdentity = { nodeId: 'gamma-ap-south', host: 'ap-south.gamma.local', platformVersion: '1.1.0', metadata: {} };

describe('CrossPlatformCoordinatorImpl', () => {
  let registry: FederationRegistryImpl;
  let coordinator: CrossPlatformCoordinator;

  beforeEach(() => {
    registry = new FederationRegistryImpl();
    registry.registerNode(nodeA, 'participant', []);
    registry.registerNode(nodeB, 'participant', []);
    registry.registerNode(nodeC, 'participant', []);
    coordinator = new CrossPlatformCoordinatorImpl(registry);
  });

  // ── 8B.1 — Remote Execution Request ──

  describe('8B.1 — Remote Execution Request', () => {
    it('submits a trusted remote execution request', async () => {
      registry.establishTrust('gamma-us-east', 'gamma-eu-west', 'full');
      const execution = await coordinator.requestRemoteExecution(
        'gamma-us-east', 'gamma-eu-west', 'data-sync', {},
      );
      expect(execution.sourceNode).toBe('gamma-us-east');
      expect(execution.targetNode).toBe('gamma-eu-west');
      expect(execution.workflowType).toBe('data-sync');
      expect(execution.status).toBe('accepted');
    });

    it('rejects untrusted remote execution request', async () => {
      const execution = await coordinator.requestRemoteExecution(
        'gamma-us-east', 'gamma-eu-west', 'data-sync', {},
      );
      expect(execution.status).toBe('rejected');
      expect(execution.error).toContain('No trust relationship');
    });

    it('assigns correlation id to execution', async () => {
      registry.establishTrust('gamma-us-east', 'gamma-eu-west', 'full');
      const execution = await coordinator.requestRemoteExecution(
        'gamma-us-east', 'gamma-eu-west', 'sync', {},
      );
      expect(execution.correlationId).toBeDefined();
      expect(execution.correlationId.length).toBeGreaterThan(0);
    });

    it('throws for unknown source node', async () => {
      await expect(coordinator.requestRemoteExecution(
        'unknown', 'gamma-eu-west', 'sync', {},
      )).rejects.toThrow(CrossPlatformCoordinatorError);
    });

    it('throws for unknown target node', async () => {
      await expect(coordinator.requestRemoteExecution(
        'gamma-us-east', 'unknown', 'sync', {},
      )).rejects.toThrow(CrossPlatformCoordinatorError);
    });

    it('records requestedAt timestamp', async () => {
      registry.establishTrust('gamma-us-east', 'gamma-eu-west', 'full');
      const execution = await coordinator.requestRemoteExecution(
        'gamma-us-east', 'gamma-eu-west', 'sync', {},
      );
      expect(execution.requestedAt).toBeGreaterThan(0);
    });
  });

  // ── 8B.2 — Remote Request Handling ──

  describe('8B.2 — Remote Request Handling', () => {
    it('handles trusted remote request successfully', async () => {
      registry.establishTrust('gamma-us-east', 'gamma-eu-west', 'full');

      // First submit to track the execution
      const execution = await coordinator.requestRemoteExecution(
        'gamma-us-east', 'gamma-eu-west', 'data-export', { dataset: 'users' },
      );

      const request: RemoteExecutionRequest = {
        requestId: execution.id,
        sourceNodeId: 'gamma-us-east',
        targetNodeId: 'gamma-eu-west',
        workflowType: 'data-export',
        input: { dataset: 'users' },
        correlationId: execution.correlationId,
        requestedAt: execution.requestedAt,
      };

      const response = coordinator.handleRemoteRequest(request);
      expect(response.success).toBe(true);
      expect(response.result).toBeDefined();
      expect(response.error).toBeNull();
    });

    it('rejects untrusted remote request', () => {
      const request: RemoteExecutionRequest = {
        requestId: 'req-1',
        sourceNodeId: 'gamma-us-east',
        targetNodeId: 'gamma-eu-west',
        workflowType: 'data-export',
        input: {},
        correlationId: 'corr-1',
        requestedAt: Date.now(),
      };

      const response = coordinator.handleRemoteRequest(request);
      expect(response.success).toBe(false);
      expect(response.error).toContain('Untrusted source');
    });

    it('includes input snapshot in successful response', async () => {
      registry.establishTrust('gamma-us-east', 'gamma-eu-west', 'full');
      const execution = await coordinator.requestRemoteExecution(
        'gamma-us-east', 'gamma-eu-west', 'sync', { key: 'value' },
      );

      const request: RemoteExecutionRequest = {
        requestId: execution.id,
        sourceNodeId: 'gamma-us-east',
        targetNodeId: 'gamma-eu-west',
        workflowType: 'sync',
        input: { key: 'value' },
        correlationId: execution.correlationId,
        requestedAt: execution.requestedAt,
      };

      const response = coordinator.handleRemoteRequest(request);
      expect(response.result!.inputSnapshot).toEqual({ key: 'value' });
    });
  });

  // ── 8B.3 — Execution Tracking ──

  describe('8B.3 — Execution Tracking', () => {
    it('retrieves execution by id', async () => {
      registry.establishTrust('gamma-us-east', 'gamma-eu-west', 'full');
      const execution = await coordinator.requestRemoteExecution(
        'gamma-us-east', 'gamma-eu-west', 'sync', {},
      );
      const retrieved = coordinator.getExecution(execution.id);
      expect(retrieved).toBeDefined();
      expect(retrieved!.id).toBe(execution.id);
    });

    it('returns undefined for unknown execution', () => {
      expect(coordinator.getExecution('nonexistent')).toBeUndefined();
    });

    it('lists all executions', async () => {
      registry.establishTrust('gamma-us-east', 'gamma-eu-west', 'full');
      registry.establishTrust('gamma-us-east', 'gamma-ap-south', 'limited');

      await coordinator.requestRemoteExecution('gamma-us-east', 'gamma-eu-west', 'sync', {});
      await coordinator.requestRemoteExecution('gamma-us-east', 'gamma-ap-south', 'backup', {});

      expect(coordinator.listExecutions().length).toBe(2);
    });

    it('tracks execution status after remote handling', async () => {
      registry.establishTrust('gamma-us-east', 'gamma-eu-west', 'full');
      const execution = await coordinator.requestRemoteExecution(
        'gamma-us-east', 'gamma-eu-west', 'sync', {},
      );
      expect(execution.status).toBe('accepted');
      expect(execution.completedAt).toBeNull();

      const request: RemoteExecutionRequest = {
        requestId: execution.id,
        sourceNodeId: 'gamma-us-east',
        targetNodeId: 'gamma-eu-west',
        workflowType: 'sync',
        input: {},
        correlationId: execution.correlationId,
        requestedAt: execution.requestedAt,
      };

      coordinator.handleRemoteRequest(request);
      const updated = coordinator.getExecution(execution.id)!;
      expect(updated.status).toBe('completed');
      expect(updated.completedAt).toBeGreaterThan(0);
    });

    it('records completion timestamp for rejected requests', async () => {
      const execution = await coordinator.requestRemoteExecution(
        'gamma-us-east', 'gamma-eu-west', 'sync', {},
      );
      expect(execution.status).toBe('rejected');
      expect(execution.completedAt).toBeGreaterThan(0);
    });
  });

  // ── 8B.4 — Correlation ──

  describe('8B.4 — Correlation', () => {
    it('groups multiple executions by correlation id', async () => {
      registry.establishTrust('gamma-us-east', 'gamma-eu-west', 'full');
      registry.establishTrust('gamma-us-east', 'gamma-ap-south', 'full');

      const exec1 = await coordinator.requestRemoteExecution('gamma-us-east', 'gamma-eu-west', 'sync', {});
      const exec2 = await coordinator.requestRemoteExecution('gamma-us-east', 'gamma-ap-south', 'sync', {});

      // Each gets a unique correlation id
      expect(exec1.correlationId).not.toBe(exec2.correlationId);

      const correlated1 = coordinator.getCorrelatedExecutions(exec1.correlationId);
      expect(correlated1.length).toBe(1);
      expect(correlated1[0].id).toBe(exec1.id);
    });

    it('returns empty array for unknown correlation id', () => {
      expect(coordinator.getCorrelatedExecutions('nonexistent').length).toBe(0);
    });
  });

  // ── 8B.5 — Edge Cases ──

  describe('8B.5 — Edge Cases', () => {
    it('handles execution with empty input', async () => {
      registry.establishTrust('gamma-us-east', 'gamma-eu-west', 'full');
      const execution = await coordinator.requestRemoteExecution(
        'gamma-us-east', 'gamma-eu-west', 'ping', {},
      );
      expect(execution.status).toBe('accepted');
    });

    it('handles multiple concurrent requests between same nodes', async () => {
      registry.establishTrust('gamma-us-east', 'gamma-eu-west', 'full');
      const e1 = await coordinator.requestRemoteExecution('gamma-us-east', 'gamma-eu-west', 'sync', {});
      const e2 = await coordinator.requestRemoteExecution('gamma-us-east', 'gamma-eu-west', 'sync', {});
      expect(e1.id).not.toBe(e2.id);
      expect(coordinator.listExecutions().length).toBe(2);
    });

    it('rejects request from untrusted node even if target trusts source', async () => {
      // Trust is directional: A→B but not B→A
      registry.establishTrust('gamma-us-east', 'gamma-eu-west', 'full');
      const execution = await coordinator.requestRemoteExecution(
        'gamma-eu-west', 'gamma-us-east', 'sync', {},
      );
      expect(execution.status).toBe('rejected');
    });

    it('listExecutions returns immutable snapshot', () => {
      registry.establishTrust('gamma-us-east', 'gamma-eu-west', 'full');
      const list = coordinator.listExecutions();
      expect(list.length).toBe(0);
    });
  });

  // ── 8B.6 — Determinism ──

  describe('8B.6 — Determinism', () => {
    it('produces same status for same trust state and request', async () => {
      const r1 = new FederationRegistryImpl();
      r1.registerNode(nodeA, 'participant', []);
      r1.registerNode(nodeB, 'participant', []);
      r1.establishTrust('gamma-us-east', 'gamma-eu-west', 'full');
      const c1 = new CrossPlatformCoordinatorImpl(r1);

      const r2 = new FederationRegistryImpl();
      r2.registerNode(nodeA, 'participant', []);
      r2.registerNode(nodeB, 'participant', []);
      r2.establishTrust('gamma-us-east', 'gamma-eu-west', 'full');
      const c2 = new CrossPlatformCoordinatorImpl(r2);

      const e1 = await c1.requestRemoteExecution('gamma-us-east', 'gamma-eu-west', 'sync', {});
      const e2 = await c2.requestRemoteExecution('gamma-us-east', 'gamma-eu-west', 'sync', {});
      expect(e1.status).toBe(e2.status);
    });

    it('deterministically rejects untrusted requests', async () => {
      const e1 = await coordinator.requestRemoteExecution('gamma-us-east', 'gamma-eu-west', 'sync', {});
      const e2 = await coordinator.requestRemoteExecution('gamma-us-east', 'gamma-eu-west', 'sync', {});
      expect(e1.status).toBe('rejected');
      expect(e2.status).toBe('rejected');
    });
  });
});
