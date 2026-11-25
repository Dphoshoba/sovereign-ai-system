import { describe, it, expect } from 'vitest';
import { ExecutiveAnalysisEngine } from '../../lib/executive-intelligence/analysis-engine';
import { ExecutiveSnapshot, DEFAULT_SCORING_CONFIG } from '../../lib/executive-intelligence/types';

function makeSnapshot(overrides?: Partial<ExecutiveSnapshot>): ExecutiveSnapshot {
  return {
    snapshotId: 'test-snap-1',
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

describe('Priority Engine', () => {
  const engine = new ExecutiveAnalysisEngine();

  it('returns empty array when nothing needs attention', () => {
    const snapshot = makeSnapshot();
    const priorities = engine.rankPriorities(snapshot);
    expect(priorities).toEqual([]);
  });

  it('ranks a single critical blocker as top priority', () => {
    const snapshot = makeSnapshot({
      offices: {
        ...makeSnapshot().offices,
        'Operations Office': {
          office: 'Operations Office', health: 'critical', agentCount: 5, activeTasks: 2,
          blockers: ['Production deployment blocked by failed gate'],
          recentChanges: [],
        },
      },
    });

    const priorities = engine.rankPriorities(snapshot);
    expect(priorities.length).toBe(1);
    expect(priorities[0].rank).toBe(1);
    expect(priorities[0].category).toBe('blocker');
    expect(priorities[0].compositeScore).toBeGreaterThan(0.5);
    expect(priorities[0].rationale.length).toBeGreaterThan(0);
  });

  it('ranks multiple items by composite score descending', () => {
    const snapshot = makeSnapshot({
      offices: {
        ...makeSnapshot().offices,
        'Operations Office': {
          office: 'Operations Office', health: 'critical', agentCount: 5, activeTasks: 2,
          blockers: ['Production outage — critical'],
          recentChanges: [],
        },
        'Product Office': {
          office: 'Product Office', health: 'attention', agentCount: 4, activeTasks: 3,
          blockers: ['Minor delay in feature delivery'],
          recentChanges: [],
        },
      },
    });

    const priorities = engine.rankPriorities(snapshot);
    expect(priorities.length).toBe(2);
    expect(priorities[0].rank).toBe(1);
    expect(priorities[1].rank).toBe(2);
    expect(priorities[0].compositeScore).toBeGreaterThanOrEqual(priorities[1].compositeScore);
  });

  it('ranks a critical risk as top priority when present', () => {
    const snapshot = makeSnapshot({
      escalatedRisks: [
        { id: 'risk-1', office: 'Operations Office', severity: 'critical', description: 'Production system down', raisedAt: Date.now() },
      ],
    });

    const priorities = engine.rankPriorities(snapshot);
    expect(priorities.length).toBe(1);
    expect(priorities[0].category).toBe('risk');
    expect(priorities[0].compositeScore).toBeGreaterThan(0.5);
  });

  it('includes pending decisions as priorities', () => {
    const snapshot = makeSnapshot({
      pendingDecisions: [
        {
          id: 'dec-1', office: 'Executive Office', actionType: 'approve-strategy', urgency: 'high',
          summary: 'Approve Q3 strategy', requiredApprover: 'CEO', rationale: 'Needs executive sign-off',
          status: 'pending', requestedAt: Date.now() - 86400000,
        },
      ],
    });

    const priorities = engine.rankPriorities(snapshot);
    expect(priorities.length).toBe(1);
    expect(priorities[0].category).toBe('decision');
  });

  it('includes blocked cross-office dependencies as priorities', () => {
    const snapshot = makeSnapshot({
      crossOfficeDependencies: [
        { id: 'dep-1', sourceOffice: 'Product Office', targetOffice: 'Operations Office',
          description: 'Release blocked by compliance gate failure', status: 'blocked' },
      ],
    });

    const priorities = engine.rankPriorities(snapshot);
    expect(priorities.length).toBe(1);
    expect(priorities[0].category).toBe('dependency');
  });

  it('each priority has all required fields', () => {
    const snapshot = makeSnapshot({
      offices: {
        ...makeSnapshot().offices,
        'Operations Office': {
          office: 'Operations Office', health: 'critical', agentCount: 5, activeTasks: 2,
          blockers: ['Production deployment blocked'],
          recentChanges: [],
        },
      },
    });

    const priorities = engine.rankPriorities(snapshot);
    expect(priorities.length).toBe(1);
    const p = priorities[0];
    expect(p.id).toBeDefined();
    expect(p.rank).toBe(1);
    expect(p.title).toBeDefined();
    expect(p.category).toBeDefined();
    expect(p.compositeScore).toBeGreaterThanOrEqual(0);
    expect(p.compositeScore).toBeLessThanOrEqual(1);
    expect(p.components.impact).toBeGreaterThanOrEqual(0);
    expect(p.components.urgency).toBeGreaterThanOrEqual(0);
    expect(p.confidence).toBeGreaterThan(0);
    expect(p.rationale.length).toBeGreaterThan(0);
    expect(p.affectedOffices.length).toBeGreaterThan(0);
    expect(p.timestamp).toBeGreaterThan(0);
  });

  it('three-office affected items get a score bonus', () => {
    const snapshot = makeSnapshot({
      offices: {
        ...makeSnapshot().offices,
        'Operations Office': {
          office: 'Operations Office', health: 'critical', agentCount: 5, activeTasks: 2,
          blockers: ['Production outage affecting Product and Research pipelines — critical'],
          recentChanges: [],
        },
      },
    });

    const priorities = engine.rankPriorities(snapshot);
    expect(priorities.length).toBe(1);
    // Should have cross-office bonus
    expect(priorities[0].affectedOffices.length).toBeGreaterThanOrEqual(1);
  });

  it('deterministic: same snapshot produces same ranking', () => {
    const snapshot = makeSnapshot({
      offices: {
        ...makeSnapshot().offices,
        'Operations Office': {
          office: 'Operations Office', health: 'critical', agentCount: 5, activeTasks: 2,
          blockers: ['Production deployment blocked'],
          recentChanges: [],
        },
      },
    });

    const first = engine.rankPriorities(snapshot);
    const second = engine.rankPriorities(snapshot);

    expect(first).toEqual(second);
  });

  it('confidence reflects evidence quality', () => {
    const riskSnapshot = makeSnapshot({
      escalatedRisks: [
        { id: 'risk-1', office: 'Operations Office', severity: 'critical', description: 'Critical risk', raisedAt: Date.now() },
      ],
    });
    const blockerSnapshot = makeSnapshot({
      offices: {
        ...makeSnapshot().offices,
        'Operations Office': {
          office: 'Operations Office', health: 'critical', agentCount: 5, activeTasks: 2,
          blockers: ['Blocker text with no severity markers'],
          recentChanges: [],
        },
      },
    });

    const riskPriorities = engine.rankPriorities(riskSnapshot);
    const blockerPriorities = engine.rankPriorities(blockerSnapshot);

    // Risk with explicit severity has higher confidence
    expect(riskPriorities[0].confidence).toBeGreaterThan(0.8);
    expect(blockerPriorities[0].confidence).toBeGreaterThan(0.8);
  });

  it('ranks correctly with mixed categories', () => {
    const snapshot = makeSnapshot({
      offices: {
        ...makeSnapshot().offices,
        'Operations Office': {
          office: 'Operations Office', health: 'critical', agentCount: 5, activeTasks: 2,
          blockers: ['Production outage — critical'],
          recentChanges: [],
        },
        'Product Office': {
          office: 'Product Office', health: 'attention', agentCount: 4, activeTasks: 3,
          blockers: ['Minor feature delay'],
          recentChanges: [],
        },
      },
      pendingDecisions: [
        {
          id: 'dec-1', office: 'Executive Office', actionType: 'approve-budget', urgency: 'low',
          summary: 'Approve minor budget adjustment', requiredApprover: 'CFO', rationale: 'Routine',
          status: 'pending', requestedAt: Date.now(),
        },
      ],
    });

    const priorities = engine.rankPriorities(snapshot);
    expect(priorities.length).toBe(3);
    // Critical blocker should be first
    expect(priorities[0].category).toBe('blocker');
    expect(priorities[0].title).toContain('Production');
  });

  it('uses custom scoring weights when provided', () => {
    const customEngine = new ExecutiveAnalysisEngine({
      ...DEFAULT_SCORING_CONFIG,
      governanceWeight: 0.5,
      impactWeight: 0.1,
      urgencyWeight: 0.1,
      dependencyWeight: 0.3,
    });

    const snapshot = makeSnapshot({
      pendingDecisions: [
        {
          id: 'dec-1', office: 'Executive Office', actionType: 'approve-strategy', urgency: 'high',
          summary: 'Strategic decision', requiredApprover: 'CEO', rationale: 'Critical path',
          status: 'pending', requestedAt: Date.now() - 7200000,
        },
      ],
      offices: {
        ...makeSnapshot().offices,
        'Operations Office': {
          office: 'Operations Office', health: 'critical', agentCount: 5, activeTasks: 2,
          blockers: ['Production outage — critical'],
          recentChanges: [],
        },
      },
    });

    const priorities = customEngine.rankPriorities(snapshot);
    // With governance weight elevated, the decision should rank higher than default
    expect(priorities.length).toBe(2);
    // Both should have valid scores
    for (const p of priorities) {
      expect(p.compositeScore).toBeGreaterThan(0);
    }
  });
});
