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

describe('Pattern Intelligence', () => {
  const engine = new ExecutiveAnalysisEngine();

  it('returns empty when fewer than 2 snapshots provided', () => {
    const patterns = engine.detectPatterns([makeSnap('snap-1')]);
    expect(patterns).toEqual([]);
  });

  it('detects recurring blocker appearing in consecutive snapshots', () => {
    const blocker = 'Production deployment blocked by failed gate';
    const snap1 = makeSnap('snap-1', {
      offices: {
        ...makeSnap('').offices,
        'Operations Office': {
          office: 'Operations Office', health: 'critical', agentCount: 5, activeTasks: 2,
          blockers: [blocker], recentChanges: [],
        },
      },
    });
    const snap2 = makeSnap('snap-2', {
      offices: {
        ...makeSnap('').offices,
        'Operations Office': {
          office: 'Operations Office', health: 'critical', agentCount: 5, activeTasks: 2,
          blockers: [blocker], recentChanges: [],
        },
      },
    });

    const patterns = engine.detectPatterns([snap1, snap2]);
    const recurring = patterns.filter(p => p.type === 'recurring_blocker');
    expect(recurring.length).toBeGreaterThanOrEqual(1);
    expect(recurring[0].occurrences).toBeGreaterThanOrEqual(2);
    expect(recurring[0].affectedOffices).toContain('Operations Office');
  });

  it('detects governance bottleneck when same actionType appears 3+ times', () => {
    const decision = {
      id: 'dec-1', office: 'Executive Office', actionType: 'approve-budget', urgency: 'high',
      summary: 'Approve budget', requiredApprover: 'CEO', rationale: 'Needed',
      status: 'pending' as const, requestedAt: Date.now() - 3600000,
    };
    const snap1 = makeSnap('snap-1', { pendingDecisions: [decision] });
    const snap2 = makeSnap('snap-2', { pendingDecisions: [decision] });
    const snap3 = makeSnap('snap-3', { pendingDecisions: [decision] });

    const patterns = engine.detectPatterns([snap1, snap2, snap3]);
    const bottleneck = patterns.filter(p => p.type === 'governance_bottleneck');
    expect(bottleneck.length).toBeGreaterThanOrEqual(1);
    expect(bottleneck[0].occurrences).toBeGreaterThanOrEqual(3);
  });

  it('detects incident cluster when same office has 3+ blockers across history', () => {
    const snap1 = makeSnap('snap-1', {
      offices: {
        ...makeSnap('').offices,
        'Operations Office': {
          office: 'Operations Office', health: 'attention', agentCount: 5, activeTasks: 2,
          blockers: ['Issue 1'], recentChanges: [],
        },
      },
    });
    const snap2 = makeSnap('snap-2', {
      offices: {
        ...makeSnap('').offices,
        'Operations Office': {
          office: 'Operations Office', health: 'attention', agentCount: 5, activeTasks: 2,
          blockers: ['Issue 2'], recentChanges: [],
        },
      },
    });
    const snap3 = makeSnap('snap-3', {
      offices: {
        ...makeSnap('').offices,
        'Operations Office': {
          office: 'Operations Office', health: 'attention', agentCount: 5, activeTasks: 2,
          blockers: ['Issue 3'], recentChanges: [],
        },
      },
    });

    const patterns = engine.detectPatterns([snap1, snap2, snap3]);
    const cluster = patterns.filter(p => p.type === 'incident_cluster');
    expect(cluster.length).toBeGreaterThanOrEqual(1);
    expect(cluster[0].affectedOffices).toContain('Operations Office');
  });

  it('detects research without downstream when research has blockers but product does not', () => {
    const snap1 = makeSnap('snap-1', {
      offices: {
        ...makeSnap('').offices,
        'Research Office': {
          office: 'Research Office', health: 'attention', agentCount: 3, activeTasks: 2,
          blockers: ['Research backlog growing'], recentChanges: [],
        },
        'Product Office': {
          office: 'Product Office', health: 'healthy', agentCount: 4, activeTasks: 3,
          blockers: [], recentChanges: [],
        },
      },
    });
    const snap2 = makeSnap('snap-2', {
      offices: {
        ...makeSnap('').offices,
        'Research Office': {
          office: 'Research Office', health: 'attention', agentCount: 3, activeTasks: 2,
          blockers: ['Research backlog growing'], recentChanges: [],
        },
        'Product Office': {
          office: 'Product Office', health: 'healthy', agentCount: 4, activeTasks: 3,
          blockers: [], recentChanges: [],
        },
      },
    });

    const patterns = engine.detectPatterns([snap1, snap2]);
    const rwd = patterns.filter(p => p.type === 'research_without_downstream');
    expect(rwd.length).toBeGreaterThanOrEqual(1);
    expect(rwd[0].severity).toBe('info');
    expect(rwd[0].affectedOffices).toContain('Research Office');
    expect(rwd[0].affectedOffices).toContain('Product Office');
  });

  it('each pattern has all required fields', () => {
    const snap1 = makeSnap('snap-1', {
      offices: {
        ...makeSnap('').offices,
        'Operations Office': {
          office: 'Operations Office', health: 'critical', agentCount: 5, activeTasks: 2,
          blockers: ['Recurring blocker'], recentChanges: [],
        },
      },
    });
    const snap2 = makeSnap('snap-2', {
      offices: {
        ...makeSnap('').offices,
        'Operations Office': {
          office: 'Operations Office', health: 'critical', agentCount: 5, activeTasks: 2,
          blockers: ['Recurring blocker'], recentChanges: [],
        },
      },
    });

    const patterns = engine.detectPatterns([snap1, snap2]);
    expect(patterns.length).toBeGreaterThan(0);
    for (const p of patterns) {
      expect(p.id).toBeDefined();
      expect(p.type).toBeDefined();
      expect(p.description).toBeDefined();
      expect(p.severity).toBeDefined();
      expect(p.affectedOffices.length).toBeGreaterThan(0);
      expect(p.occurrences).toBeGreaterThan(0);
      expect(p.firstObserved).toBeGreaterThan(0);
      expect(p.lastObserved).toBeGreaterThan(0);
      expect(p.evidence.length).toBeGreaterThan(0);
    }
  });

  it('deterministic: same history produces same patterns', () => {
    const snap1 = makeSnap('snap-1', {
      offices: {
        ...makeSnap('').offices,
        'Operations Office': {
          office: 'Operations Office', health: 'critical', agentCount: 5, activeTasks: 2,
          blockers: ['Recurring blocker'], recentChanges: [],
        },
      },
    });
    const snap2 = makeSnap('snap-2', {
      offices: {
        ...makeSnap('').offices,
        'Operations Office': {
          office: 'Operations Office', health: 'critical', agentCount: 5, activeTasks: 2,
          blockers: ['Recurring blocker'], recentChanges: [],
        },
      },
    });
    const history = [snap1, snap2];

    const first = engine.detectPatterns(history);
    const second = engine.detectPatterns(history);
    expect(first).toEqual(second);
  });

  it('severity escalates with occurrence count', () => {
    const blocker = 'Persistent blocker';
    const snap1 = makeSnap('snap-1', {
      offices: {
        ...makeSnap('').offices,
        'Operations Office': {
          office: 'Operations Office', health: 'critical', agentCount: 5, activeTasks: 2,
          blockers: [blocker], recentChanges: [],
        },
      },
    });
    const snap2 = makeSnap('snap-2', {
      offices: {
        ...makeSnap('').offices,
        'Operations Office': {
          office: 'Operations Office', health: 'critical', agentCount: 5, activeTasks: 2,
          blockers: [blocker], recentChanges: [],
        },
      },
    });
    const snap3 = makeSnap('snap-3', {
      offices: {
        ...makeSnap('').offices,
        'Operations Office': {
          office: 'Operations Office', health: 'critical', agentCount: 5, activeTasks: 2,
          blockers: [blocker], recentChanges: [],
        },
      },
    });

    const patterns = engine.detectPatterns([snap1, snap2, snap3]);
    const recurring = patterns.filter(p => p.type === 'recurring_blocker');
    // 3 occurrences should produce 'critical' severity
    expect(recurring[0].severity).toBe('critical');
  });

  it('public API: getPatterns returns patterns after sufficient history', () => {
    const workforce = new WorkforcePlatformImpl();
    const eis = new ExecutiveIntelligence(workforce);

    expect(eis.getPatterns()).toEqual([]);

    eis.refreshSnapshot();
    expect(eis.getPatterns()).toEqual([]);

    eis.refreshSnapshot();
    // Patterns may or may not be detected depending on snapshot content
    // but the API should function without error
    expect(Array.isArray(eis.getPatterns())).toBe(true);

    eis.refreshSnapshot();
    eis.refreshSnapshot();
    expect(Array.isArray(eis.getPatterns())).toBe(true);
  });
});
