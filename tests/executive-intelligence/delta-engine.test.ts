import { describe, it, expect } from 'vitest';
import { ExecutiveAnalysisEngine } from '../../lib/executive-intelligence/analysis-engine';
import { ExecutiveIntelligence } from '../../lib/executive-intelligence/intelligence-engine';
import { WorkforcePlatformImpl } from '../../lib/workforce/workforce-platform-impl';
import { ExecutiveSnapshot } from '../../lib/executive-intelligence/types';

function makeSnap(id: string, overrides?: Partial<ExecutiveSnapshot>): ExecutiveSnapshot {
  return {
    snapshotId: id,
    timestamp: Date.now(),
    offices: {
      'Executive Office': { office: 'Executive Office', health: 'healthy', agentCount: 2, activeTasks: 1, blockers: [], recentChanges: [] },
      'Research Office': { office: 'Research Office', health: 'healthy', agentCount: 3, activeTasks: 2, blockers: [], recentChanges: [] },
      'Product Office': { office: 'Product Office', health: 'healthy', agentCount: 4, activeTasks: 3, blockers: [], recentChanges: [] },
      'Operations Office': { office: 'Operations Office', health: 'healthy', agentCount: 5, activeTasks: 2, blockers: [], recentChanges: [] },
      'Knowledge Office': { office: 'Knowledge Office', health: 'healthy', agentCount: 2, activeTasks: 1, blockers: [], recentChanges: [] },
    },
    pendingDecisions: [],
    escalatedRisks: [],
    crossOfficeDependencies: [],
    ...overrides,
  };
}

describe('Delta Engine', () => {
  const engine = new ExecutiveAnalysisEngine();

  it('detects new blockers between snapshots', () => {
    const prev = makeSnap('snap-1');
    const curr = makeSnap('snap-2', {
      offices: {
        ...makeSnap('').offices,
        'Operations Office': {
          office: 'Operations Office', health: 'critical', agentCount: 5, activeTasks: 2,
          blockers: ['Production deployment blocked'], recentChanges: [],
        },
      },
    });

    const delta = engine.computeDelta(prev, curr);
    expect(delta.newBlockers.length).toBe(1);
    expect(delta.newBlockers[0].blocker).toBe('Production deployment blocked');
    expect(delta.resolvedBlockers).toEqual([]);
  });

  it('detects resolved blockers between snapshots', () => {
    const prev = makeSnap('snap-1', {
      offices: {
        ...makeSnap('').offices,
        'Operations Office': {
          office: 'Operations Office', health: 'critical', agentCount: 5, activeTasks: 2,
          blockers: ['Production deployment blocked'], recentChanges: [],
        },
      },
    });
    const curr = makeSnap('snap-2');

    const delta = engine.computeDelta(prev, curr);
    expect(delta.resolvedBlockers.length).toBe(1);
    expect(delta.resolvedBlockers[0].blocker).toBe('Production deployment blocked');
    expect(delta.newBlockers).toEqual([]);
  });

  it('detects new and resolved risks', () => {
    const prev = makeSnap('snap-1', {
      escalatedRisks: [
        { id: 'risk-1', office: 'Operations Office', severity: 'high', description: 'Old risk', raisedAt: Date.now() },
      ],
    });
    const curr = makeSnap('snap-2', {
      escalatedRisks: [
        { id: 'risk-2', office: 'Product Office', severity: 'critical', description: 'New risk', raisedAt: Date.now() },
      ],
    });

    const delta = engine.computeDelta(prev, curr);
    expect(delta.newRisks.length).toBe(1);
    expect(delta.newRisks[0].id).toBe('risk-2');
    expect(delta.resolvedRisks).toEqual(['risk-1']);
  });

  it('detects new pending decisions', () => {
    const prev = makeSnap('snap-1');
    const curr = makeSnap('snap-2', {
      pendingDecisions: [
        { id: 'dec-1', office: 'Executive Office', actionType: 'approve-plan', urgency: 'high',
          summary: 'Approve plan', requiredApprover: 'CEO', rationale: 'Needed', status: 'pending',
          requestedAt: Date.now() },
      ],
    });

    const delta = engine.computeDelta(prev, curr);
    expect(delta.newPendingDecisions.length).toBe(1);
    expect(delta.newPendingDecisions[0].id).toBe('dec-1');
  });

  it('detects resolved pending decisions', () => {
    const prev = makeSnap('snap-1', {
      pendingDecisions: [
        { id: 'dec-1', office: 'Executive Office', actionType: 'approve-plan', urgency: 'high',
          summary: 'Approve plan', requiredApprover: 'CEO', rationale: 'Needed', status: 'pending',
          requestedAt: Date.now() },
      ],
    });
    const curr = makeSnap('snap-2');

    const delta = engine.computeDelta(prev, curr);
    expect(delta.resolvedPendingDecisions).toEqual(['dec-1']);
  });

  it('detects office health changes', () => {
    const prev = makeSnap('snap-1');
    const curr = makeSnap('snap-2', {
      offices: {
        ...makeSnap('').offices,
        'Operations Office': {
          office: 'Operations Office', health: 'critical', agentCount: 5, activeTasks: 2,
          blockers: ['Production deployment blocked'], recentChanges: [],
        },
      },
    });

    const delta = engine.computeDelta(prev, curr);
    expect(delta.officeHealthChanges.length).toBe(1);
    expect(delta.officeHealthChanges[0].office).toBe('Operations Office');
    expect(delta.officeHealthChanges[0].previous).toBe('healthy');
    expect(delta.officeHealthChanges[0].current).toBe('critical');
  });

  it('detects new and resolved dependencies', () => {
    const prev = makeSnap('snap-1');
    const curr = makeSnap('snap-2', {
      crossOfficeDependencies: [
        { id: 'dep-1', sourceOffice: 'Product Office', targetOffice: 'Operations Office',
          description: 'Blocked by gate', status: 'blocked' },
      ],
    });

    const delta = engine.computeDelta(prev, curr);
    expect(delta.newDependencies.length).toBe(1);
    expect(delta.newDependencies[0].id).toBe('dep-1');
  });

  it('no material changes returns appropriate summary', () => {
    const prev = makeSnap('snap-1');
    const curr = makeSnap('snap-2');

    const delta = engine.computeDelta(prev, curr);
    expect(delta.summary).toBe('No material changes detected');
  });

  it('summary concatenates multiple change types', () => {
    const prev = makeSnap('snap-1');
    const curr = makeSnap('snap-2', {
      escalatedRisks: [
        { id: 'risk-1', office: 'Operations Office', severity: 'critical', description: 'New issue', raisedAt: Date.now() },
      ],
      offices: {
        ...makeSnap('').offices,
        'Operations Office': {
          office: 'Operations Office', health: 'critical', agentCount: 5, activeTasks: 2,
          blockers: ['New blocker'], recentChanges: [],
        },
      },
    });

    const delta = engine.computeDelta(prev, curr);
    expect(delta.summary).toContain('new risk');
    expect(delta.summary).toContain('new blocker');
  });

  it('preserves snapshot IDs in delta', () => {
    const prev = makeSnap('snap-alpha');
    const curr = makeSnap('snap-beta');

    const delta = engine.computeDelta(prev, curr);
    expect(delta.previousSnapshotId).toBe('snap-alpha');
    expect(delta.currentSnapshotId).toBe('snap-beta');
  });

  it('deterministic: same two snapshots produce same delta', () => {
    const prev = makeSnap('snap-1');
    const curr = makeSnap('snap-2', {
      escalatedRisks: [
        { id: 'risk-1', office: 'Operations Office', severity: 'high', description: 'Risk', raisedAt: Date.now() },
      ],
    });

    const first = engine.computeDelta(prev, curr);
    const second = engine.computeDelta(prev, curr);
    expect(first).toEqual(second);
  });

  it('public API: getDelta returns null until second refresh', () => {
    const workforce = new WorkforcePlatformImpl();
    const eis = new ExecutiveIntelligence(workforce);

    expect(eis.getDelta()).toBeNull();
    eis.refreshSnapshot();
    expect(eis.getDelta()).toBeNull();
    eis.refreshSnapshot();
    expect(eis.getDelta()).not.toBeNull();
  });
});
