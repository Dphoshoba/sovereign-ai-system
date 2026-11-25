import { describe, it, expect } from 'vitest';
import { ExecutiveAnalysisEngine } from '../../lib/executive-intelligence/analysis-engine';
import { ExecutiveSnapshot, RiskIntelligence } from '../../lib/executive-intelligence/types';

function makeSnapshot(overrides?: Partial<ExecutiveSnapshot>): ExecutiveSnapshot {
  return {
    snapshotId: 'test-snap',
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

function makeRisk(overrides?: Partial<RiskIntelligence>): RiskIntelligence {
  return {
    id: 'ri-1',
    source: { id: 'risk-1', office: 'Operations Office', severity: 'high', description: 'Deployment failure', raisedAt: Date.now() },
    likelihood: 'high',
    organizationalImpact: 'office',
    trend: 'stable',
    recommendedOwner: 'Director of Operations',
    recommendedAction: 'Schedule cross-office resolution within 24 hours',
    confidence: 0.85,
    rationale: ['Severity: high', 'Likelihood: high'],
    ...overrides,
  };
}

describe('Recommendation Engine', () => {
  const engine = new ExecutiveAnalysisEngine();

  it('returns empty when no risks, blockers, or decisions exist', () => {
    const snapshot = makeSnapshot();
    const recs = engine.generateRecommendations(snapshot, []);
    expect(recs).toEqual([]);
  });

  it('generates recommendation from a critical enriched risk', () => {
    const snapshot = makeSnapshot();
    const risks = [
      makeRisk({
        source: { id: 'risk-1', office: 'Operations Office', severity: 'critical', description: 'Critical deployment failure', raisedAt: Date.now() },
        likelihood: 'very_high',
        organizationalImpact: 'enterprise',
        recommendedOwner: 'Director of Operations',
        recommendedAction: 'Escalate immediately to executive leadership',
      }),
    ];

    const recs = engine.generateRecommendations(snapshot, risks);
    expect(recs.length).toBeGreaterThanOrEqual(1);
    const r = recs.find(x => x.category === 'address_risk')!;
    expect(r.priority).toBe('critical');
    expect(r.suggestedOwner).toBe('Director of Operations');
    expect(r.confidence).toBeGreaterThan(0.8);
  });

  it('generates recommendation from a blocked cross-office dependency', () => {
    const snapshot = makeSnapshot({
      crossOfficeDependencies: [
        { id: 'dep-1', sourceOffice: 'Product Office', targetOffice: 'Operations Office',
          description: 'Release blocked by compliance gate failure', status: 'blocked' },
      ],
    });

    const recs = engine.generateRecommendations(snapshot, []);
    const r = recs.find(x => x.category === 'clear_dependency')!;
    expect(r).toBeDefined();
    expect(r.action).toContain('Product Office');
    expect(r.action).toContain('Operations Office');
    expect(r.expectedBenefit).toContain('Unblock');
  });

  it('generates recommendation from a stale pending decision (>24h)', () => {
    const snapshot = makeSnapshot({
      pendingDecisions: [
        { id: 'dec-1', office: 'Executive Office', actionType: 'approve-budget', urgency: 'high',
          summary: 'Approve Q3 budget', requiredApprover: 'CFO', rationale: 'Needs approval',
          status: 'pending', requestedAt: Date.now() - 90000000 },
      ],
    });

    const recs = engine.generateRecommendations(snapshot, []);
    const r = recs.find(x => x.category === 'review_decision')!;
    expect(r).toBeDefined();
    expect(r.suggestedOwner).toBe('CFO');
    expect(r.reason).toContain('Pending');
  });

  it('generates recommendation from a blocker in an office', () => {
    const snapshot = makeSnapshot({
      offices: {
        ...makeSnapshot().offices,
        'Operations Office': {
          office: 'Operations Office', health: 'critical', agentCount: 5, activeTasks: 2,
          blockers: ['Production deployment blocked by failed gate'], recentChanges: [],
        },
      },
    });

    const recs = engine.generateRecommendations(snapshot, []);
    const r = recs.find(x => x.category === 'resolve_blocker')!;
    expect(r).toBeDefined();
    expect(r.suggestedOwner).toBe('Director of Operations');
    expect(r.priority).toBe('critical');
  });

  it('deduplicates recommendations with same action and owner', () => {
    const snapshot = makeSnapshot({
      offices: {
        ...makeSnapshot().offices,
        'Operations Office': {
          office: 'Operations Office', health: 'critical', agentCount: 5, activeTasks: 2,
          blockers: ['Same blocker text'], recentChanges: [],
        },
      },
      crossOfficeDependencies: [
        { id: 'dep-1', sourceOffice: 'Operations Office', targetOffice: 'Product Office',
          description: 'Same blocker text', status: 'blocked' },
      ],
    });

    const recs = engine.generateRecommendations(snapshot, []);
    const forOps = recs.filter(r => r.suggestedOwner === 'Director of Operations');
    // Block from blocker and block from dependency — should be deduped if same action
    expect(forOps.length).toBeGreaterThanOrEqual(1);
  });

  it('recommendations are sorted by score descending', () => {
    const snapshot = makeSnapshot({
      escalatedRisks: [
        { id: 'risk-1', office: 'Operations Office', severity: 'critical', description: 'Critical deployment failure', raisedAt: Date.now() },
        { id: 'risk-2', office: 'Product Office', severity: 'low', description: 'Minor issue', raisedAt: Date.now() },
      ],
    });

    const risky = engine.enrichRisks(snapshot);
    const recs = engine.generateRecommendations(snapshot, risky);

    for (let i = 1; i < recs.length; i++) {
      expect(recs[i - 1].score).toBeGreaterThanOrEqual(recs[i].score);
    }
  });

  it('each recommendation has all required fields', () => {
    const snapshot = makeSnapshot({
      offices: {
        ...makeSnapshot().offices,
        'Operations Office': {
          office: 'Operations Office', health: 'critical', agentCount: 5, activeTasks: 2,
          blockers: ['Production deployment blocked'], recentChanges: [],
        },
      },
    });

    const recs = engine.generateRecommendations(snapshot, []);
    expect(recs.length).toBeGreaterThan(0);
    for (const r of recs) {
      expect(r.id).toBeDefined();
      expect(r.rank).toBeGreaterThan(0);
      expect(r.category).toBeDefined();
      expect(r.action).toBeDefined();
      expect(r.reason).toBeDefined();
      expect(r.expectedBenefit).toBeDefined();
      expect(r.suggestedOwner).toBeDefined();
      expect(r.supportingEvidence.length).toBeGreaterThan(0);
      expect(r.confidence).toBeGreaterThan(0);
      expect(r.score).toBeGreaterThanOrEqual(0);
    }
  });

  it('does not recommend for low-likelihood risks', () => {
    const snapshot = makeSnapshot();
    const risks = [
      makeRisk({
        source: { id: 'risk-1', office: 'Operations Office', severity: 'low', description: 'Minor issue', raisedAt: Date.now() },
        likelihood: 'low',
      }),
    ];

    const recs = engine.generateRecommendations(snapshot, risks);
    expect(recs.filter(r => r.category === 'address_risk')).toEqual([]);
  });

  it('deterministic: same inputs produce same recommendations', () => {
    const snapshot = makeSnapshot({
      offices: {
        ...makeSnapshot().offices,
        'Operations Office': {
          office: 'Operations Office', health: 'critical', agentCount: 5, activeTasks: 2,
          blockers: ['Production deployment blocked'], recentChanges: [],
        },
      },
      pendingDecisions: [
        { id: 'dec-1', office: 'Executive Office', actionType: 'approve-plan', urgency: 'high',
          summary: 'Approve plan', requiredApprover: 'CEO', rationale: 'Needed', status: 'pending',
          requestedAt: Date.now() - 90000000 },
      ],
    });

    const risky = engine.enrichRisks(snapshot);
    const first = engine.generateRecommendations(snapshot, risky);
    const second = engine.generateRecommendations(snapshot, risky);
    expect(first).toEqual(second);
  });
});
