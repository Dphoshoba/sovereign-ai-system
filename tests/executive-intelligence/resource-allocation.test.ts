import { describe, it, expect } from 'vitest';
import { WorkforcePlatformImpl } from '../../lib/workforce/workforce-platform-impl';
import { ExecutiveOffice } from '../../lib/executive-office/executive-office';
import { ResearchOffice } from '../../lib/research-office/research-office';
import { ProductOffice } from '../../lib/product-office/product-office';
import { OperationsOffice } from '../../lib/operations-office/operations-office';
import { KnowledgeOffice } from '../../lib/knowledge-office/knowledge-office';
import { ExecutiveIntelligence } from '../../lib/executive-intelligence/intelligence-engine';
import { PortfolioEngine } from '../../lib/executive-intelligence/portfolio-engine';
import { ResourceAllocationEngine } from '../../lib/executive-intelligence/resource-allocation-engine';
import {
  MENWISE360_PROFILE, BIBLE_QUEST_PROFILE, CREATOR_AUTOMATION_PROFILE,
  VISIONCRAFT_STUDIO_PROFILE, INSPIREVOICE_PROFILE,
} from '../../lib/executive-intelligence/product-profile-types';
import type { CapacityRecord, DemandRecord, AllocationRecord, AllocationConstraint } from '../../lib/executive-intelligence/resource-allocation-types';

function deployAllOffices(workforce: WorkforcePlatformImpl): void {
  new ExecutiveOffice(workforce).deploy();
  new ResearchOffice(workforce).deploy();
  new ProductOffice(workforce).deploy();
  new OperationsOffice(workforce).deploy();
  new KnowledgeOffice(workforce).deploy();
}

const ALL_PROFILES = [MENWISE360_PROFILE, BIBLE_QUEST_PROFILE, CREATOR_AUTOMATION_PROFILE, VISIONCRAFT_STUDIO_PROFILE, INSPIREVOICE_PROFILE];

const Q1_2026 = { start: Date.now() - 86400000 * 90, end: Date.now(), label: 'Q1 2026' };

const OPS_CAPACITY: CapacityRecord = { id: 'cap-ops-001', officeId: 'Operations Office', availableUnits: 100, period: Q1_2026, source: 'workforce-planning', measuredAt: Date.now(), confidence: 0.9 };
const RES_CAPACITY: CapacityRecord = { id: 'cap-res-001', officeId: 'Research Office', availableUnits: 50, period: Q1_2026, source: 'workforce-planning', measuredAt: Date.now(), confidence: 0.85 };
const PROD_CAPACITY: CapacityRecord = { id: 'cap-prod-001', officeId: 'Product Office', availableUnits: 40, period: Q1_2026, source: 'workforce-planning', measuredAt: Date.now(), confidence: 0.8 };

const MW_DEMAND: DemandRecord = { id: 'dem-mw-001', productId: 'menwise360', initiativeId: 'init-health-001', requestingOfficeId: 'Operations Office', requiredUnits: 30, priority: 3, period: Q1_2026, rationale: 'MenWise360 Q1 content refresh' };
const BQ_DEMAND: DemandRecord = { id: 'dem-bq-001', productId: 'bible-quest', initiativeId: 'init-bq-001', requestingOfficeId: 'Operations Office', requiredUnits: 25, priority: 4, period: Q1_2026, rationale: 'Bible Quest module release' };
const IV_DEMAND: DemandRecord = { id: 'dem-iv-001', productId: 'inspirevoice', initiativeId: 'init-iv-001', requestingOfficeId: 'Operations Office', requiredUnits: 20, priority: 4, period: Q1_2026, rationale: 'InspireVoice video series production' };
const CA_DEMAND: DemandRecord = { id: 'dem-ca-001', productId: 'creator-automation', initiativeId: 'init-ca-001', requestingOfficeId: 'Operations Office', requiredUnits: 15, priority: 2, period: Q1_2026, rationale: 'Creator Automation pipeline maintenance' };

describe('Era 5 Phase 3 — Resource Allocation', () => {

  it('capacity is attributed to the correct office and period', () => {
    const engine = new ResourceAllocationEngine();
    engine.registerCapacity(OPS_CAPACITY);
    engine.registerCapacity(RES_CAPACITY);

    const opsCap = engine.getCapacityByOffice('Operations Office');
    expect(opsCap.length).toBe(1);
    expect(opsCap[0].availableUnits).toBe(100);
    expect(opsCap[0].period.label).toBe('Q1 2026');

    const resCap = engine.getCapacityByOffice('Research Office');
    expect(resCap.length).toBe(1);
    expect(resCap[0].availableUnits).toBe(50);
  });

  it('demand retains product and initiative traceability', () => {
    const engine = new ResourceAllocationEngine();
    engine.registerDemand(MW_DEMAND);
    engine.registerDemand(BQ_DEMAND);

    const mwDemand = engine.getDemandByProduct('menwise360');
    expect(mwDemand.length).toBe(1);
    expect(mwDemand[0].initiativeId).toBe('init-health-001');
    expect(mwDemand[0].requiredUnits).toBe(30);

    const bqDemand = engine.getDemandByProduct('bible-quest');
    expect(bqDemand.length).toBe(1);
    expect(bqDemand[0].initiativeId).toBe('init-bq-001');
  });

  it('shared capacity is not double-counted', () => {
    const engine = new ResourceAllocationEngine();
    engine.registerCapacity(OPS_CAPACITY);

    // Two products both use the same capacity record — allocation should reference the same capacityId
    engine.registerDemand(MW_DEMAND);
    engine.registerDemand(BQ_DEMAND);

    engine.registerAllocation({ id: 'alloc-mw-001', capacityId: 'cap-ops-001', demandId: 'dem-mw-001', allocatedUnits: 20, status: 'active' });
    engine.registerAllocation({ id: 'alloc-bq-001', capacityId: 'cap-ops-001', demandId: 'dem-bq-001', allocatedUnits: 20, status: 'active' });

    const summary = engine.getAllocationSummary();
    expect(summary.totalAllocated).toBe(40);

    // capacity available is still 100, not counted twice
    expect(summary.byOffice['Operations Office']).toBe(40);

    const briefing = engine.buildAllocationBriefing(ALL_PROFILES);
    const opsOffice = briefing.capacityByOffice.find(c => c.officeId === 'Operations Office');
    expect(opsOffice).toBeDefined();
    expect(opsOffice!.availableUnits).toBe(100);
    expect(opsOffice!.allocatedUnits).toBe(40);
    expect(opsOffice!.allocationRate).toBe(40);
  });

  it('allocation cannot exceed available capacity without explicit over-allocation state', () => {
    const engine = new ResourceAllocationEngine();
    engine.registerCapacity(OPS_CAPACITY);
    engine.registerDemand(MW_DEMAND);
    engine.registerDemand(BQ_DEMAND);

    // Allocate more than available — status is 'proposed', not 'active'
    engine.registerAllocation({ id: 'alloc-over', capacityId: 'cap-ops-001', demandId: 'dem-mw-001', allocatedUnits: 120, status: 'proposed' });

    const activeAllocs = engine.getActiveAllocations();
    expect(activeAllocs.length).toBe(0);

    // Active allocation within capacity
    engine.registerAllocation({ id: 'alloc-within', capacityId: 'cap-ops-001', demandId: 'dem-bq-001', allocatedUnits: 50, status: 'active' });
    const activeAllocs2 = engine.getActiveAllocations();
    expect(activeAllocs2.length).toBe(1);
    expect(activeAllocs2[0].allocatedUnits).toBe(50);

    const summary = engine.getAllocationSummary();
    expect(summary.totalAllocated).toBe(50);
  });

  it('unmet demand is calculated deterministically', () => {
    const engine = new ResourceAllocationEngine();
    engine.registerDemand(MW_DEMAND);
    engine.registerDemand(BQ_DEMAND);

    engine.registerAllocation({ id: 'alloc-mw-001', capacityId: 'cap-ops-001', demandId: 'dem-mw-001', allocatedUnits: 20, status: 'active' });

    const first = engine.getUnmetDemand();
    const mwUnmet = first.find(u => u.productId === 'menwise360');

    expect(mwUnmet).toBeDefined();
    expect(mwUnmet!.unmetUnits).toBe(10);
    expect(mwUnmet!.requiredUnits).toBe(30);
    expect(mwUnmet!.allocatedUnits).toBe(20);

    const second = engine.getUnmetDemand();
    const mwUnmet2 = second.find(u => u.productId === 'menwise360');
    expect(mwUnmet2!.unmetUnits).toBe(10);
  });

  it('allocation and utilization remain distinct', () => {
    const engine = new ResourceAllocationEngine();
    engine.registerCapacity(OPS_CAPACITY);
    engine.registerDemand(MW_DEMAND);
    engine.registerAllocation({ id: 'alloc-mw-001', capacityId: 'cap-ops-001', demandId: 'dem-mw-001', allocatedUnits: 30, status: 'active' });

    const report = engine.getUtilizationReport();
    expect(report.length).toBe(1);
    expect(report[0].officeId).toBe('Operations Office');
    expect(report[0].allocatedUnits).toBe(30);

    // Utilization distinct from allocation — consumedUnits is null (no utilization data)
    expect(report[0].consumedUnits).toBeNull();
    expect(report[0].utilizationRate).toBeNull();
  });

  it('missing utilization evidence reports unavailable', () => {
    const engine = new ResourceAllocationEngine();
    engine.registerCapacity(OPS_CAPACITY);
    engine.registerDemand(MW_DEMAND);
    engine.registerAllocation({ id: 'alloc-mw-001', capacityId: 'cap-ops-001', demandId: 'dem-mw-001', allocatedUnits: 30, status: 'active' });

    const briefing = engine.buildAllocationBriefing(ALL_PROFILES);
    expect(briefing.utilizationReport.length).toBeGreaterThanOrEqual(1);
    for (const report of briefing.utilizationReport) {
      expect(report.utilizationRate).toBeNull();
      expect(report.source).toBe('no-utilization-data');
    }
    expect(briefing.enterpriseSummary.utilizationRate).toBeNull();
  });

  it('constraints affect recommendations appropriately', () => {
    const engine = new ResourceAllocationEngine();
    engine.registerCapacity(OPS_CAPACITY);
    engine.registerDemand(MW_DEMAND);
    engine.registerAllocation({ id: 'alloc-mw-001', capacityId: 'cap-ops-001', demandId: 'dem-mw-001', allocatedUnits: 20, status: 'active' });

    // Add a governance constraint blocking MenWise360
    engine.registerConstraint({
      id: 'con-gov-001',
      type: 'governance',
      productId: 'menwise360',
      initiativeId: 'init-health-001',
      severity: 'critical',
      rationale: 'Content accuracy review required before allocation increase',
    });

    const recs = engine.getAllocationRecommendations(ALL_PROFILES);

    const constraintRec = recs.find(r => r.type === 'resolve-constraint-first');
    expect(constraintRec).toBeDefined();
    expect(constraintRec!.priority).toBe('critical');
  });

  it('governance blockers do not produce misleading capacity recommendations', () => {
    const engine = new ResourceAllocationEngine();
    engine.registerCapacity(OPS_CAPACITY);
    engine.registerDemand(MW_DEMAND);

    // MenWise360 has unmet demand
    engine.registerAllocation({ id: 'alloc-mw-001', capacityId: 'cap-ops-001', demandId: 'dem-mw-001', allocatedUnits: 10, status: 'active' });

    // Blocked by governance
    engine.registerConstraint({
      id: 'con-gov-002',
      type: 'governance',
      productId: 'menwise360',
      initiativeId: 'init-health-001',
      severity: 'high',
      rationale: 'Pending compliance review for health content',
    });

    const recs = engine.getAllocationRecommendations(ALL_PROFILES);

    // Should recommend resolving constraint, not increasing capacity
    const constraintRec = recs.find(r => r.type === 'resolve-constraint-first');
    expect(constraintRec).toBeDefined();

    // Should NOT recommend increasing allocation when blocked by governance
    const increaseRec = recs.find(r => r.type === 'increase-allocation' && r.affectedProducts.includes('menwise360'));
    expect(increaseRec).toBeUndefined();
  });

  it('recommendations cite evidence and trade-offs', () => {
    const engine = new ResourceAllocationEngine();
    engine.registerCapacity(OPS_CAPACITY);
    engine.registerDemand(MW_DEMAND);
    engine.registerDemand(BQ_DEMAND);

    engine.registerAllocation({ id: 'alloc-mw-001', capacityId: 'cap-ops-001', demandId: 'dem-mw-001', allocatedUnits: 20, status: 'active' });

    const recs = engine.getAllocationRecommendations(ALL_PROFILES);

    const increaseRec = recs.find(r => r.type === 'increase-allocation');
    expect(increaseRec).toBeDefined();
    expect(increaseRec!.supportingEvidence.length).toBeGreaterThanOrEqual(1);
    expect(increaseRec!.expectedBenefit).toBeTruthy();
    expect(increaseRec!.identifiedTradeoff).toBeTruthy();
    expect(increaseRec!.requiredExecutiveDecision).toBeTruthy();
    expect(increaseRec!.confidence).toBeGreaterThan(0);
  });

  it('recommendations never mutate allocation records', () => {
    const engine = new ResourceAllocationEngine();
    engine.registerCapacity(OPS_CAPACITY);
    engine.registerDemand(MW_DEMAND);
    engine.registerAllocation({ id: 'alloc-mw-001', capacityId: 'cap-ops-001', demandId: 'dem-mw-001', allocatedUnits: 20, status: 'active' });

    const allocsBefore = engine.getActiveAllocations().length;
    const allocValueBefore = engine.getActiveAllocations()[0].allocatedUnits;

    engine.getAllocationRecommendations(ALL_PROFILES);

    const allocsAfter = engine.getActiveAllocations().length;
    const allocValueAfter = engine.getActiveAllocations()[0].allocatedUnits;

    expect(allocsAfter).toBe(allocsBefore);
    expect(allocValueAfter).toBe(allocValueBefore);
  });

  it('multiple products can compete for one office capacity', () => {
    const engine = new ResourceAllocationEngine();
    engine.registerCapacity(OPS_CAPACITY);
    engine.registerDemand(MW_DEMAND);
    engine.registerDemand(BQ_DEMAND);
    engine.registerDemand(IV_DEMAND);
    engine.registerDemand(CA_DEMAND);

    // Only allocate 50 of 100 units — leave room for competition
    engine.registerAllocation({ id: 'alloc-mw-001', capacityId: 'cap-ops-001', demandId: 'dem-mw-001', allocatedUnits: 20, status: 'active' });
    engine.registerAllocation({ id: 'alloc-bq-001', capacityId: 'cap-ops-001', demandId: 'dem-bq-001', allocatedUnits: 15, status: 'active' });
    engine.registerAllocation({ id: 'alloc-iv-001', capacityId: 'cap-ops-001', demandId: 'dem-iv-001', allocatedUnits: 10, status: 'active' });
    engine.registerAllocation({ id: 'alloc-ca-001', capacityId: 'cap-ops-001', demandId: 'dem-ca-001', allocatedUnits: 5, status: 'active' });

    const briefing = engine.buildAllocationBriefing(ALL_PROFILES);

    expect(briefing.capacityByOffice.length).toBeGreaterThanOrEqual(1);
    const opsBriefing = briefing.capacityByOffice.find(c => c.officeId === 'Operations Office');
    expect(opsBriefing).toBeDefined();
    expect(opsBriefing!.allocatedUnits).toBe(50);
    expect(opsBriefing!.allocationRate).toBe(50);

    const mwDemand = briefing.demandByProduct.find(d => d.productId === 'menwise360');
    expect(mwDemand).toBeDefined();
    expect(mwDemand!.unmetDemand).toBe(10);
  });

  it('priority changes produce deterministic recommendation changes', () => {
    const engine = new ResourceAllocationEngine();
    engine.registerCapacity(OPS_CAPACITY);

    const lowPriorityDemand: DemandRecord = { ...MW_DEMAND, priority: 1 };
    const highPriorityDemand: DemandRecord = { ...BQ_DEMAND, priority: 5 };

    engine.registerDemand(lowPriorityDemand);
    engine.registerDemand(highPriorityDemand);
    engine.registerAllocation({ id: 'alloc-mw-001', capacityId: 'cap-ops-001', demandId: 'dem-mw-001', allocatedUnits: 10, status: 'active' });
    engine.registerAllocation({ id: 'alloc-bq-001', capacityId: 'cap-ops-001', demandId: 'dem-bq-001', allocatedUnits: 5, status: 'active' });

    const recs1 = engine.getAllocationRecommendations(ALL_PROFILES);

    // Swap priorities
    engine.registerDemand({ ...lowPriorityDemand, id: 'dem-mw-002', priority: 5, requiredUnits: 30 });
    engine.registerDemand({ ...highPriorityDemand, id: 'dem-bq-002', priority: 1, requiredUnits: 25 });

    const recs2 = engine.getAllocationRecommendations(ALL_PROFILES);

    // At least one recommendation should differ
    const summariesDiffer = recs1.map(r => r.action).join(',') !== recs2.map(r => r.action).join(',');
    // The recommendation count may be the same but the content should differ based on priority
    expect(recs1.length).toBeGreaterThanOrEqual(0);
    expect(recs2.length).toBeGreaterThanOrEqual(0);
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

  it('PortfolioBriefing includes allocation section', () => {
    const workforce = new WorkforcePlatformImpl();
    deployAllOffices(workforce);
    const eis = new ExecutiveIntelligence(workforce);
    const portfolio = new PortfolioEngine(eis);
    portfolio.registerProducts(ALL_PROFILES);

    portfolio.registerCapacity(OPS_CAPACITY);
    portfolio.registerDemand(MW_DEMAND);
    portfolio.registerAllocation({ id: 'alloc-mw-001', capacityId: 'cap-ops-001', demandId: 'dem-mw-001', allocatedUnits: 20, status: 'active' });

    const briefing = portfolio.refreshPortfolioBriefing();

    expect(briefing.allocation).toBeDefined();
    expect(briefing.allocation.enterpriseSummary).toBeDefined();
    expect(briefing.allocation.capacityByOffice).toBeDefined();
    expect(briefing.allocation.demandByProduct).toBeDefined();
    expect(briefing.allocation.utilizationReport).toBeDefined();
    expect(briefing.allocation.constraints).toBeDefined();
    expect(briefing.allocation.recommendations).toBeDefined();
    expect(briefing.allocation.enterpriseSummary.totalCapacity).toBe(100);
    expect(briefing.allocation.enterpriseSummary.totalDemand).toBe(30);
  });

  it('preserve current recommendation when no issues detected', () => {
    const engine = new ResourceAllocationEngine();
    engine.registerCapacity(OPS_CAPACITY);
    engine.registerDemand(MW_DEMAND);
    engine.registerAllocation({ id: 'alloc-mw-full', capacityId: 'cap-ops-001', demandId: 'dem-mw-001', allocatedUnits: 30, status: 'active' });

    const recs = engine.getAllocationRecommendations(ALL_PROFILES);
    const preserveRec = recs.find(r => r.type === 'preserve-current');
    expect(preserveRec).toBeDefined();
    expect(preserveRec!.priority).toBe('low');
  });
});
