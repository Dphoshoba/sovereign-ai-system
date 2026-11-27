import { describe, it, expect } from 'vitest';
import { WorkforcePlatformImpl } from '../../lib/workforce/workforce-platform-impl';
import { ExecutiveOffice } from '../../lib/executive-office/executive-office';
import { ResearchOffice } from '../../lib/research-office/research-office';
import { ProductOffice } from '../../lib/product-office/product-office';
import { OperationsOffice } from '../../lib/operations-office/operations-office';
import { KnowledgeOffice } from '../../lib/knowledge-office/knowledge-office';
import { ExecutiveIntelligence } from '../../lib/executive-intelligence/intelligence-engine';
import { PortfolioEngine } from '../../lib/executive-intelligence/portfolio-engine';
import { CrossProductEngine } from '../../lib/executive-intelligence/cross-product-engine';
import {
  MENWISE360_PROFILE, BIBLE_QUEST_PROFILE, CREATOR_AUTOMATION_PROFILE,
  VISIONCRAFT_STUDIO_PROFILE, INSPIREVOICE_PROFILE,
} from '../../lib/executive-intelligence/product-profile-types';
import type { CrossProductDependency, CrossProductConflict, CrossProductSynergy } from '../../lib/executive-intelligence/cross-product-types';

function deployAllOffices(workforce: WorkforcePlatformImpl): void {
  new ExecutiveOffice(workforce).deploy();
  new ResearchOffice(workforce).deploy();
  new ProductOffice(workforce).deploy();
  new OperationsOffice(workforce).deploy();
  new KnowledgeOffice(workforce).deploy();
}

const ALL_PROFILES = [MENWISE360_PROFILE, BIBLE_QUEST_PROFILE, CREATOR_AUTOMATION_PROFILE, VISIONCRAFT_STUDIO_PROFILE, INSPIREVOICE_PROFILE];

const MW_REQUIRES_BQ: CrossProductDependency = {
  id: 'dep-mw-bq-001', sourceProductId: 'menwise360', targetProductId: 'bible-quest',
  type: 'requires', status: 'active', rationale: 'MenWise360 health content references Bible Quest wellness research',
  evidenceIds: ['ev-research-001'],
};

const VC_ENABLES_IV: CrossProductDependency = {
  id: 'dep-vc-iv-001', sourceProductId: 'visioncraft-studio', targetProductId: 'inspirevoice',
  type: 'enables', status: 'active', rationale: 'VisionCraft visual pipeline enables InspireVoice video production',
  evidenceIds: ['ev-asset-001'],
};

const CA_BLOCKS_IV: CrossProductDependency = {
  id: 'dep-ca-iv-001', sourceProductId: 'creator-automation', targetProductId: 'inspirevoice',
  type: 'blocks', status: 'blocked', rationale: 'Creator Automation workflow templates required for InspireVoice media pipeline',
  evidenceIds: ['ev-auto-001', 'ev-auto-002', 'ev-auto-003'],
};

const TRANSITIVE_CHAIN: CrossProductDependency[] = [
  { id: 'dep-a-b', sourceProductId: 'menwise360', targetProductId: 'bible-quest', type: 'requires', status: 'active', rationale: 'MenWise360 → Bible Quest', evidenceIds: ['ev-1'] },
  { id: 'dep-b-c', sourceProductId: 'bible-quest', targetProductId: 'creator-automation', type: 'requires', status: 'active', rationale: 'Bible Quest → Creator Automation', evidenceIds: ['ev-2'] },
  { id: 'dep-c-d', sourceProductId: 'creator-automation', targetProductId: 'visioncraft-studio', type: 'requires', status: 'active', rationale: 'Creator Automation → VisionCraft Studio', evidenceIds: ['ev-3'] },
];

describe('Era 5 Phase 4 — Cross-Product Coordination', () => {

  it('directed dependencies preserve source and target', () => {
    const engine = new CrossProductEngine();
    engine.registerProducts(ALL_PROFILES);
    engine.registerDependency(MW_REQUIRES_BQ);

    const graph = engine.getDependencyGraph();
    expect(graph.edges.length).toBe(1);
    expect(graph.edges[0].source).toBe('menwise360');
    expect(graph.edges[0].target).toBe('bible-quest');
    expect(graph.edges[0].type).toBe('requires');
  });

  it('transitive dependencies are resolved deterministically', () => {
    const engine = new CrossProductEngine();
    engine.registerProducts(ALL_PROFILES);
    engine.registerDependencies(TRANSITIVE_CHAIN);

    const transitive = engine.getTransitiveDependencies('menwise360');
    expect(transitive.length).toBeGreaterThanOrEqual(3);
    expect(transitive.some(d => d.id === 'dep-a-b')).toBe(true);
    expect(transitive.some(d => d.id === 'dep-b-c')).toBe(true);
    expect(transitive.some(d => d.id === 'dep-c-d')).toBe(true);

    const result2 = engine.getTransitiveDependencies('menwise360');
    expect(result2.length).toBe(transitive.length);
    expect(result2.map(d => d.id).sort()).toEqual(transitive.map(d => d.id).sort());
  });

  it('cycles are detected and surfaced', () => {
    const engine = new CrossProductEngine();
    engine.registerProducts(ALL_PROFILES);

    engine.registerDependencies([
      { id: 'dep-cycle-1', sourceProductId: 'menwise360', targetProductId: 'bible-quest', type: 'requires', status: 'active', rationale: 'cycle', evidenceIds: [] },
      { id: 'dep-cycle-2', sourceProductId: 'bible-quest', targetProductId: 'visioncraft-studio', type: 'requires', status: 'active', rationale: 'cycle', evidenceIds: [] },
      { id: 'dep-cycle-3', sourceProductId: 'visioncraft-studio', targetProductId: 'menwise360', type: 'requires', status: 'active', rationale: 'cycle', evidenceIds: [] },
    ]);

    const cycles = engine.detectCycles();
    expect(cycles.length).toBeGreaterThanOrEqual(1);
    // Each cycle should contain the same product appearing as start/end
    const firstCycle = cycles[0];
    expect(firstCycle.length).toBeGreaterThanOrEqual(2);
    expect(firstCycle[0]).toBe(firstCycle[firstCycle.length - 1]);
  });

  it('invalid product references are rejected', () => {
    const engine = new CrossProductEngine();
    engine.registerProducts(ALL_PROFILES);

    expect(() => {
      engine.registerDependency({
        id: 'dep-invalid', sourceProductId: 'nonexistent', targetProductId: 'menwise360',
        type: 'requires', status: 'active', rationale: 'invalid', evidenceIds: [],
      });
    }).toThrow('Invalid product reference');
  });

  it('invalid initiative references are rejected', () => {
    const engine = new CrossProductEngine();
    engine.registerProducts(ALL_PROFILES);

    expect(() => {
      engine.registerDependency({
        id: 'dep-inv-init', sourceProductId: 'menwise360', targetProductId: 'bible-quest',
        sourceInitiativeId: 'nonexistent-init',
        type: 'requires', status: 'active', rationale: 'invalid init', evidenceIds: [],
      });
    }).toThrow('Invalid initiative reference');
  });

  it('dependencies are not automatically classified as conflicts', () => {
    const engine = new CrossProductEngine();
    engine.registerProducts(ALL_PROFILES);
    engine.registerDependencies([MW_REQUIRES_BQ, CA_BLOCKS_IV]);

    const conflicts = engine.getCrossProductConflicts();
    expect(conflicts.length).toBe(0);
  });

  it('capacity contention creates a conflict when supported by allocation evidence', () => {
    const engine = new CrossProductEngine();
    engine.registerProducts(ALL_PROFILES);

    const conflict: CrossProductConflict = {
      id: 'con-cap-001', productIds: ['menwise360', 'bible-quest'], initiativeIds: [],
      type: 'capacity_contention', severity: 'high',
      rationale: 'Both products competing for limited Operations Office capacity',
      evidenceIds: ['ev-cap-001', 'ev-alloc-001'],
    };
    engine.registerConflict(conflict);

    const conflicts = engine.getCrossProductConflicts();
    expect(conflicts.length).toBe(1);
    expect(conflicts[0].type).toBe('capacity_contention');
    expect(conflicts[0].productIds).toContain('menwise360');
    expect(conflicts[0].productIds).toContain('bible-quest');
  });

  it('governance conflicts are represented independently of capacity conflicts', () => {
    const engine = new CrossProductEngine();
    engine.registerProducts(ALL_PROFILES);

    engine.registerConflict({
      id: 'con-gov-001', productIds: ['inspirevoice', 'bible-quest'], initiativeIds: [],
      type: 'governance_conflict', severity: 'critical',
      rationale: 'Content sourcing standards differ between education and multimedia',
      evidenceIds: ['ev-gov-001'],
    });

    engine.registerConflict({
      id: 'con-cap-002', productIds: ['menwise360', 'creator-automation'], initiativeIds: [],
      type: 'capacity_contention', severity: 'medium',
      rationale: 'Operations Office capacity contention',
      evidenceIds: ['ev-cap-002'],
    });

    const conflicts = engine.getCrossProductConflicts();
    const govConflicts = conflicts.filter(c => c.type === 'governance_conflict');
    const capConflicts = conflicts.filter(c => c.type === 'capacity_contention');
    expect(govConflicts.length).toBe(1);
    expect(capConflicts.length).toBe(1);
  });

  it('synergies require explicit evidence', () => {
    const engine = new CrossProductEngine();
    engine.registerProducts(ALL_PROFILES);

    expect(() => {
      engine.registerSynergy({
        id: 'syn-no-evidence', productIds: ['menwise360', 'bible-quest'],
        type: 'shared_research', expectedBenefit: 'Reuse research', confidence: 0.8,
        evidenceIds: [],
      });
    }).toThrow('requires at least one evidence ID');

    const synergy: CrossProductSynergy = {
      id: 'syn-research-001', productIds: ['menwise360', 'bible-quest'],
      initiativeIds: ['init-h-001'],
      type: 'shared_research', expectedBenefit: 'Reuse wellness research across health and education',
      confidence: 0.85, evidenceIds: ['ev-research-001', 'ev-research-002'],
    };
    engine.registerSynergy(synergy);
    expect(engine.getCrossProductSynergies().length).toBe(1);
  });

  it('shared research produces a reuse opportunity', () => {
    const engine = new CrossProductEngine();
    engine.registerProducts(ALL_PROFILES);

    engine.registerSynergy({
      id: 'syn-research-002', productIds: ['menwise360', 'bible-quest'],
      type: 'shared_research', expectedBenefit: 'Share wellness research repository',
      confidence: 0.9, evidenceIds: ['ev-research-003'],
    });

    const ops = engine.getOptimizationOpportunities();
    const reuseOps = ops.filter(o => o.type === 'reuse' || o.type === 'consolidate');
    expect(reuseOps.length).toBeGreaterThanOrEqual(1);
    expect(reuseOps[0].evidenceIds.length).toBeGreaterThanOrEqual(1);
  });

  it('duplicate work produces a consolidation opportunity', () => {
    const engine = new CrossProductEngine();
    engine.registerProducts(ALL_PROFILES);

    engine.registerSynergy({
      id: 'syn-workflow-001', productIds: ['creator-automation', 'inspirevoice'],
      type: 'shared_workflow', expectedBenefit: 'Consolidate media publishing workflows',
      confidence: 0.85, evidenceIds: ['ev-workflow-001'],
    });

    const ops = engine.getOptimizationOpportunities();
    const consolidateOps = ops.filter(o => o.type === 'reuse');
    expect(consolidateOps.length).toBeGreaterThanOrEqual(1);
  });

  it('blocked upstream work affects sequencing recommendations', () => {
    const engine = new CrossProductEngine();
    engine.registerProducts(ALL_PROFILES);

    engine.registerDependency(CA_BLOCKS_IV);
    engine.registerDependency(VC_ENABLES_IV);

    const ops = engine.getOptimizationOpportunities();
    const seqOps = ops.filter(o => o.type === 'sequence');
    expect(seqOps.length).toBeGreaterThanOrEqual(1);

    const blockedDep = seqOps.find(o => o.rationale.includes('creator-automation') && o.rationale.includes('inspirevoice'));
    expect(blockedDep).toBeDefined();
    expect(blockedDep!.evidenceIds.length).toBeGreaterThanOrEqual(1);
  });

  it('recommendations cite evidence, benefits, trade-offs, and required decisions', () => {
    const engine = new CrossProductEngine();
    engine.registerProducts(ALL_PROFILES);
    engine.registerDependency(CA_BLOCKS_IV);

    engine.registerConflict({
      id: 'con-test-001', productIds: ['menwise360', 'bible-quest'], initiativeIds: [],
      type: 'capacity_contention', severity: 'critical',
      rationale: 'Critical capacity contention', evidenceIds: ['ev-cap-test'],
    });

    const ops = engine.getOptimizationOpportunities();
    for (const op of ops) {
      expect(op.rationale).toBeTruthy();
      expect(op.expectedBenefit).toBeTruthy();
      expect(op.tradeOffs.length).toBeGreaterThanOrEqual(1);
      expect(op.requiredDecision).toBeTruthy();
      expect(op.confidence).toBeGreaterThan(0);
      expect(op.evidenceIds.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('recommendations do not mutate registries', () => {
    const engine = new CrossProductEngine();
    engine.registerProducts(ALL_PROFILES);
    engine.registerDependency(CA_BLOCKS_IV);

    const depsBefore = engine.getDependencyGraph().edges.length;

    engine.getOptimizationOpportunities();

    const depsAfter = engine.getDependencyGraph().edges.length;
    expect(depsAfter).toBe(depsBefore);
  });

  it('duplicate evidence is not double-counted', () => {
    const engine = new CrossProductEngine();
    engine.registerProducts(ALL_PROFILES);

    const sharedEvidence = ['ev-shared-001'];
    engine.registerConflict({
      id: 'con-dup-001', productIds: ['menwise360', 'bible-quest'], initiativeIds: [],
      type: 'capacity_contention', severity: 'high',
      rationale: 'Contention', evidenceIds: sharedEvidence,
    });
    engine.registerSynergy({
      id: 'syn-dup-001', productIds: ['menwise360', 'bible-quest'],
      type: 'shared_research', expectedBenefit: 'Shared research',
      confidence: 0.8, evidenceIds: sharedEvidence,
    });

    // One evidence ID appears in both a conflict and a synergy, but only once each
    const conflict = engine.getCrossProductConflicts()[0];
    const synergy = engine.getCrossProductSynergies()[0];
    expect(conflict.evidenceIds.filter(e => e === 'ev-shared-001').length).toBe(1);
    expect(synergy.evidenceIds.filter(e => e === 'ev-shared-001').length).toBe(1);
  });

  it('opportunity ranking is deterministic', () => {
    const engine = new CrossProductEngine();
    engine.registerProducts(ALL_PROFILES);
    engine.registerDependency(CA_BLOCKS_IV);
    engine.registerDependency(VC_ENABLES_IV);

    const ops1 = engine.getOptimizationOpportunities();
    const ops2 = engine.getOptimizationOpportunities();

    expect(ops1.length).toBe(ops2.length);
    for (let i = 0; i < ops1.length; i++) {
      expect(ops1[i].id).toBe(ops2[i].id);
      expect(ops1[i].priority).toBe(ops2[i].priority);
    }
  });

  it('a sixth product requires registration only', () => {
    const workforce = new WorkforcePlatformImpl();
    deployAllOffices(workforce);
    const eis = new ExecutiveIntelligence(workforce);
    const portfolio = new PortfolioEngine(eis);
    portfolio.registerProducts(ALL_PROFILES);

    const briefing5 = portfolio.refreshPortfolioBriefing();
    expect(briefing5.metadata.productCount).toBe(5);

    const sixthProduct = { ...MENWISE360_PROFILE, productId: 'sixth-product', productName: 'Sixth Product' };
    portfolio.registerProduct(sixthProduct);

    const briefing6 = portfolio.refreshPortfolioBriefing();
    expect(briefing6.metadata.productCount).toBe(6);
  });

  it('PortfolioBriefing includes coordination section', () => {
    const workforce = new WorkforcePlatformImpl();
    deployAllOffices(workforce);
    const eis = new ExecutiveIntelligence(workforce);
    const portfolio = new PortfolioEngine(eis);
    portfolio.registerProducts(ALL_PROFILES);

    portfolio.registerCrossProductDependency(CA_BLOCKS_IV);
    portfolio.registerCrossProductDependency(VC_ENABLES_IV);

    const briefing = portfolio.refreshPortfolioBriefing();

    expect(briefing.coordination).toBeDefined();
    expect(briefing.coordination.dependencyGraph).toBeDefined();
    expect(briefing.coordination.conflicts).toBeDefined();
    expect(briefing.coordination.synergies).toBeDefined();
    expect(briefing.coordination.optimizationOpportunities).toBeDefined();
    expect(briefing.coordination.dependencyGraph.totalDependencies).toBe(2);
    expect(briefing.coordination.dependencyGraph.blockedDependencies).toBe(1);
  });

  it('upstream blockers identified correctly', () => {
    const engine = new CrossProductEngine();
    engine.registerProducts(ALL_PROFILES);
    engine.registerDependency(CA_BLOCKS_IV);
    engine.registerDependency(VC_ENABLES_IV);

    const blockers = engine.getUpstreamBlockers('inspirevoice');
    expect(blockers.length).toBe(1);
    expect(blockers[0].sourceProductId).toBe('creator-automation');
  });
});
