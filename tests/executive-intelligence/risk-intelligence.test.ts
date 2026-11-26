import { describe, it, expect } from 'vitest';
import { ExecutiveAnalysisEngine } from '../../lib/executive-intelligence/analysis-engine';
import { ExecutiveSnapshot } from '../../lib/executive-intelligence/types';

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

describe('Risk Intelligence', () => {
  const engine = new ExecutiveAnalysisEngine();

  it('returns empty array when no risks exist', () => {
    const snapshot = makeSnapshot();
    const risks = engine.enrichRisks(snapshot);
    expect(risks).toEqual([]);
  });

  it('enriches a single critical risk with all dimensions', () => {
    const snapshot = makeSnapshot({
      escalatedRisks: [
        { id: 'risk-1', office: 'Operations Office', severity: 'critical', description: 'Production system down', raisedAt: Date.now() },
      ],
    });

    const risks = engine.enrichRisks(snapshot);
    expect(risks.length).toBe(1);
    const r = risks[0];
    expect(r.source.id).toBe('risk-1');
    expect(r.likelihood).toBe('very_high');
    expect(r.organizationalImpact).toBe('office');
    expect(r.trend).toBe('stable');
    expect(r.recommendedOwner).toBe('Director of Operations');
    expect(r.recommendedAction).toContain('Escalate immediately');
    expect(r.confidence).toBeGreaterThan(0.9);
    expect(r.rationale.length).toBeGreaterThan(0);
  });

  it('maps likelihood from severity correctly', () => {
    const snapshot = makeSnapshot({
      escalatedRisks: [
        { id: 'r1', office: 'Executive Office', severity: 'critical', description: 'Critical', raisedAt: Date.now() },
        { id: 'r2', office: 'Executive Office', severity: 'high', description: 'High', raisedAt: Date.now() },
        { id: 'r3', office: 'Executive Office', severity: 'medium', description: 'Medium', raisedAt: Date.now() },
        { id: 'r4', office: 'Executive Office', severity: 'low', description: 'Low', raisedAt: Date.now() },
      ],
    });

    const risks = engine.enrichRisks(snapshot);
    expect(risks.find(r => r.source.id === 'r1')!.likelihood).toBe('very_high');
    expect(risks.find(r => r.source.id === 'r2')!.likelihood).toBe('high');
    expect(risks.find(r => r.source.id === 'r3')!.likelihood).toBe('medium');
    expect(risks.find(r => r.source.id === 'r4')!.likelihood).toBe('low');
  });

  it('detects cross-office impact when description references multiple offices', () => {
    const snapshot = makeSnapshot({
      escalatedRisks: [
        { id: 'risk-1', office: 'Operations Office', severity: 'high', description: 'Operations issue affecting Product and Research', raisedAt: Date.now() },
      ],
    });

    const risks = engine.enrichRisks(snapshot);
    expect(risks[0].organizationalImpact).toBe('cross_office');
  });

  it('detects enterprise-level impact when risk affects 3+ offices', () => {
    const snapshot = makeSnapshot({
      escalatedRisks: [
        { id: 'risk-1', office: 'Operations Office', severity: 'critical', description: 'Enterprise-wide issue affecting Product, Research, and Knowledge', raisedAt: Date.now() },
      ],
    });

    const risks = engine.enrichRisks(snapshot);
    expect(risks[0].organizationalImpact).toBe('enterprise');
  });

  it('defaults trend to stable when no history provided', () => {
    const snapshot = makeSnapshot({
      escalatedRisks: [
        { id: 'risk-1', office: 'Operations Office', severity: 'high', description: 'Issue', raisedAt: Date.now() },
      ],
    });

    const risks = engine.enrichRisks(snapshot);
    expect(risks[0].trend).toBe('stable');
  });

  it('detects new risk as worsening when previous snapshot lacks it', () => {
    const current = makeSnapshot({
      snapshotId: 'snap-2',
      escalatedRisks: [
        { id: 'risk-1', office: 'Operations Office', severity: 'high', description: 'New issue', raisedAt: Date.now() },
      ],
    });
    const previous = makeSnapshot({
      snapshotId: 'snap-1',
      escalatedRisks: [],
    });

    const risks = engine.enrichRisks(current, previous);
    expect(risks[0].trend).toBe('worsening');
  });

  it('maps recommended owner by office name', () => {
    const snapshot = makeSnapshot({
      escalatedRisks: [
        { id: 'r1', office: 'Executive Office', severity: 'high', description: 'Exec issue', raisedAt: Date.now() },
        { id: 'r2', office: 'Research Office', severity: 'high', description: 'Research issue', raisedAt: Date.now() },
        { id: 'r3', office: 'Product Office', severity: 'high', description: 'Product issue', raisedAt: Date.now() },
        { id: 'r4', office: 'Operations Office', severity: 'high', description: 'Ops issue', raisedAt: Date.now() },
        { id: 'r5', office: 'Knowledge Office', severity: 'high', description: 'Knowledge issue', raisedAt: Date.now() },
      ],
    });

    const risks = engine.enrichRisks(snapshot);
    expect(risks.find(r => r.source.id === 'r1')!.recommendedOwner).toBe('CEO');
    expect(risks.find(r => r.source.id === 'r2')!.recommendedOwner).toBe('Director of Research');
    expect(risks.find(r => r.source.id === 'r3')!.recommendedOwner).toBe('Director of Product');
    expect(risks.find(r => r.source.id === 'r4')!.recommendedOwner).toBe('Director of Operations');
    expect(risks.find(r => r.source.id === 'r5')!.recommendedOwner).toBe('Director of Knowledge');
  });

  it('action recommendation scales with severity', () => {
    const criticalSnap = makeSnapshot({
      escalatedRisks: [
        { id: 'r1', office: 'Operations Office', severity: 'critical', description: 'Critical issue', raisedAt: Date.now() },
      ],
    });
    const lowSnap = makeSnapshot({
      escalatedRisks: [
        { id: 'r2', office: 'Operations Office', severity: 'low', description: 'Minor issue', raisedAt: Date.now() },
      ],
    });

    const criticalRisks = engine.enrichRisks(criticalSnap);
    const lowRisks = engine.enrichRisks(lowSnap);

    expect(criticalRisks[0].recommendedAction).toContain('Escalate');
    expect(lowRisks[0].recommendedAction).toContain('Assign');
  });

  it('deterministic: same snapshot produces same enrichment', () => {
    const snapshot = makeSnapshot({
      escalatedRisks: [
        { id: 'risk-1', office: 'Operations Office', severity: 'high', description: 'Consistent issue', raisedAt: Date.now() },
      ],
    });

    const first = engine.enrichRisks(snapshot);
    const second = engine.enrichRisks(snapshot);
    expect(first).toEqual(second);
  });
});
