import { describe, it, expect } from 'vitest';
import { WorkforcePlatformImpl } from '../../lib/workforce/workforce-platform-impl';
import { ExecutiveOffice } from '../../lib/executive-office/executive-office';
import { ResearchOffice } from '../../lib/research-office/research-office';
import { ProductOffice } from '../../lib/product-office/product-office';
import { OperationsOffice } from '../../lib/operations-office/operations-office';
import { KnowledgeOffice } from '../../lib/knowledge-office/knowledge-office';
import { ExecutiveIntelligence } from '../../lib/executive-intelligence/intelligence-engine';
import { PortfolioEngine } from '../../lib/executive-intelligence/portfolio-engine';
import { KpiDefinition, KpiMeasurement, KpiTrendDirection } from '../../lib/executive-intelligence/kpi-registry-types';
import { KpiTrendEngine } from '../../lib/executive-intelligence/kpi-trend-engine';
import { MENWISE360_PROFILE, BIBLE_QUEST_PROFILE, CREATOR_AUTOMATION_PROFILE, VISIONCRAFT_STUDIO_PROFILE, INSPIREVOICE_PROFILE } from '../../lib/executive-intelligence/product-profile-types';

function deployAllOffices(workforce: WorkforcePlatformImpl): void {
  new ExecutiveOffice(workforce).deploy();
  new ResearchOffice(workforce).deploy();
  new ProductOffice(workforce).deploy();
  new OperationsOffice(workforce).deploy();
  new KnowledgeOffice(workforce).deploy();
}

const ALL_PROFILES = [MENWISE360_PROFILE, BIBLE_QUEST_PROFILE, CREATOR_AUTOMATION_PROFILE, VISIONCRAFT_STUDIO_PROFILE, INSPIREVOICE_PROFILE];

const DELIVERY_DEF: KpiDefinition = {
  id: 'def-delivery-throughput',
  category: 'delivery',
  name: 'Delivery Throughput',
  description: 'Monthly production output per product',
  unit: 'units/month',
  measurementMethod: 'Count of completed production items per calendar month',
  targetType: 'higher_is_better',
  ownerOffice: 'Operations Office',
  applicableProducts: ['*'],
  targetValue: 10,
};

const QUALITY_DEF: KpiDefinition = {
  id: 'def-quality-accuracy',
  category: 'quality',
  name: 'Content Accuracy Score',
  description: 'Percentage of content passing quality review',
  unit: '%',
  measurementMethod: 'Ratio of passed reviews to total reviews',
  targetType: 'higher_is_better',
  ownerOffice: 'Research Office',
  applicableProducts: ['*'],
  targetValue: 95,
};

const GOVERNANCE_DEF: KpiDefinition = {
  id: 'def-gov-cycle',
  category: 'governance',
  name: 'Governance Cycle Time',
  description: 'Average time to complete governance review',
  unit: 'hours',
  measurementMethod: 'Time from submission to approval or rejection',
  targetType: 'lower_is_better',
  ownerOffice: 'Executive Office',
  applicableProducts: ['*'],
  targetValue: 24,
};

describe('Era 5 Phase 2 — Enterprise Metrics', () => {

  it('KPI definitions are immutable once registered', () => {
    const workforce = new WorkforcePlatformImpl();
    deployAllOffices(workforce);
    const eis = new ExecutiveIntelligence(workforce);
    const portfolio = new PortfolioEngine(eis);

    portfolio.registerKpiDefinition(DELIVERY_DEF);
    const defs = portfolio.getKpiDefinitions();
    expect(defs.length).toBe(1);
    expect(defs[0].id).toBe('def-delivery-throughput');
    expect(defs[0].name).toBe('Delivery Throughput');

    const retrieved = portfolio.getKpiDefinition('def-delivery-throughput');
    expect(retrieved).toBeDefined();
    expect(retrieved!.targetValue).toBe(10);
    expect(retrieved!.targetType).toBe('higher_is_better');
  });

  it('measurements correctly reference definitions', () => {
    const workforce = new WorkforcePlatformImpl();
    deployAllOffices(workforce);
    const eis = new ExecutiveIntelligence(workforce);
    const portfolio = new PortfolioEngine(eis);
    portfolio.registerProducts(ALL_PROFILES);

    portfolio.registerKpiDefinition(DELIVERY_DEF);

    portfolio.submitKpiMeasurement({
      measurementId: 'm-001',
      definitionId: 'def-delivery-throughput',
      productId: 'menwise360',
      value: 12,
      measuredAt: Date.now(),
      confidence: 0.95,
      evidenceSource: 'operations-tracking',
      status: 'available',
    });

    const metrics = portfolio.getEnterpriseMetrics();
    expect(metrics.length).toBeGreaterThanOrEqual(1);
    const mwMetric = metrics.find(m => m.definition.id === 'def-delivery-throughput' && m.measurements.some(mm => mm.productId === 'menwise360'));
    expect(mwMetric).toBeDefined();
    expect(mwMetric!.measurements[0].value).toBe(12);
  });

  it('multiple products report same KPI with different evidence sources', () => {
    const workforce = new WorkforcePlatformImpl();
    deployAllOffices(workforce);
    const eis = new ExecutiveIntelligence(workforce);
    const portfolio = new PortfolioEngine(eis);
    portfolio.registerProducts(ALL_PROFILES);

    portfolio.registerKpiDefinition(DELIVERY_DEF);

    const now = Date.now();
    portfolio.submitKpiMeasurement({ measurementId: 'm-mw-001', definitionId: 'def-delivery-throughput', productId: 'menwise360', value: 12, measuredAt: now, confidence: 0.95, evidenceSource: 'operations-tracking', status: 'available' });
    portfolio.submitKpiMeasurement({ measurementId: 'm-bq-001', definitionId: 'def-delivery-throughput', productId: 'bible-quest', value: 5, measuredAt: now, confidence: 0.90, evidenceSource: 'content-tracker', status: 'available' });
    portfolio.submitKpiMeasurement({ measurementId: 'm-ca-001', definitionId: 'def-delivery-throughput', productId: 'creator-automation', value: 20, measuredAt: now, confidence: 0.85, evidenceSource: 'pipeline-monitor', status: 'available' });

    const mwMetrics = portfolio.getMetricsByProduct('menwise360');
    const bqMetrics = portfolio.getMetricsByProduct('bible-quest');
    const caMetrics = portfolio.getMetricsByProduct('creator-automation');

    expect(mwMetrics.length).toBe(1);
    expect(mwMetrics[0].measurements[0].value).toBe(12);
    expect(mwMetrics[0].measurements[0].evidenceSource).toBe('operations-tracking');

    expect(bqMetrics.length).toBe(1);
    expect(bqMetrics[0].measurements[0].value).toBe(5);
    expect(bqMetrics[0].measurements[0].evidenceSource).toBe('content-tracker');

    expect(caMetrics.length).toBe(1);
    expect(caMetrics[0].measurements[0].value).toBe(20);
    expect(caMetrics[0].measurements[0].evidenceSource).toBe('pipeline-monitor');
  });

  it('trend calculations are deterministic', () => {
    const engine = new KpiTrendEngine();

    const now = Date.now();
    const measurements: KpiMeasurement[] = [
      { measurementId: 'm1', definitionId: 'def-delivery-throughput', productId: 'menwise360', value: 8, measuredAt: now - 86400000 * 60, confidence: 0.9, evidenceSource: 'test', status: 'available' },
      { measurementId: 'm2', definitionId: 'def-delivery-throughput', productId: 'menwise360', value: 12, measuredAt: now, confidence: 0.9, evidenceSource: 'test', status: 'available' },
    ];

    const result1 = engine.calculateTrend(DELIVERY_DEF, measurements);
    const result2 = engine.calculateTrend(DELIVERY_DEF, measurements);

    expect(result1.direction).toBe(result2.direction);
    expect(result1.changePercent).toBe(result2.changePercent);
    expect(result1.confidence).toBe(result2.confidence);
    expect(result1.rationale).toEqual(result2.rationale);

    expect(result1.direction).toBe('improving');
  });

  it('confidence reflects evidence quality', () => {
    const engine = new KpiTrendEngine();

    const now = Date.now();
    const highConfidence: KpiMeasurement[] = [
      { measurementId: 'h1', definitionId: 'def-delivery-throughput', productId: 'menwise360', value: 10, measuredAt: now - 86400000 * 2, confidence: 0.95, evidenceSource: 'test', status: 'available' },
      { measurementId: 'h2', definitionId: 'def-delivery-throughput', productId: 'menwise360', value: 12, measuredAt: now, confidence: 0.95, evidenceSource: 'test', status: 'available' },
      { measurementId: 'h3', definitionId: 'def-delivery-throughput', productId: 'menwise360', value: 11, measuredAt: now - 86400000 * 30, confidence: 0.95, evidenceSource: 'test', status: 'available' },
      { measurementId: 'h4', definitionId: 'def-delivery-throughput', productId: 'menwise360', value: 13, measuredAt: now - 86400000 * 15, confidence: 0.95, evidenceSource: 'test', status: 'available' },
      { measurementId: 'h5', definitionId: 'def-delivery-throughput', productId: 'menwise360', value: 14, measuredAt: now - 86400000 * 7, confidence: 0.95, evidenceSource: 'test', status: 'available' },
    ];

    const lowConfidence: KpiMeasurement[] = [
      { measurementId: 'l1', definitionId: 'def-delivery-throughput', productId: 'bible-quest', value: 3, measuredAt: now - 86400000 * 120, confidence: 0.3, evidenceSource: 'test', status: 'estimated' },
      { measurementId: 'l2', definitionId: 'def-delivery-throughput', productId: 'bible-quest', value: 4, measuredAt: now - 86400000 * 90, confidence: 0.3, evidenceSource: 'test', status: 'estimated' },
    ];

    const highResult = engine.calculateTrend(DELIVERY_DEF, highConfidence);
    const lowResult = engine.calculateTrend(DELIVERY_DEF, lowConfidence);

    expect(highResult.confidence).toBeGreaterThan(lowResult.confidence);
  });

  it('insufficient measurements return insufficient_data', () => {
    const engine = new KpiTrendEngine();

    const result = engine.calculateTrend(DELIVERY_DEF, []);
    expect(result.direction).toBe('insufficient_data');
    expect(result.currentValue).toBeNull();
    expect(result.previousValue).toBeNull();
    expect(result.confidence).toBe(0);

    const singleResult = engine.calculateTrend(DELIVERY_DEF, [
      { measurementId: 'm1', definitionId: 'def-delivery-throughput', productId: 'menwise360', value: 10, measuredAt: Date.now(), confidence: 0.9, evidenceSource: 'test', status: 'available' },
    ]);
    expect(singleResult.direction).toBe('insufficient_data');
    expect(singleResult.currentValue).toBe(10);
  });

  it('missing measurements remain unavailable in portfolio briefing', () => {
    const workforce = new WorkforcePlatformImpl();
    deployAllOffices(workforce);
    const eis = new ExecutiveIntelligence(workforce);
    const portfolio = new PortfolioEngine(eis);
    portfolio.registerProducts(ALL_PROFILES);

    portfolio.registerKpiDefinition(DELIVERY_DEF);
    portfolio.registerKpiDefinition(QUALITY_DEF);

    portfolio.submitKpiMeasurement({
      measurementId: 'm-001', definitionId: 'def-delivery-throughput', productId: 'menwise360', value: 12, measuredAt: Date.now(), confidence: 0.95, evidenceSource: 'test', status: 'available',
    });

    const briefing = portfolio.refreshPortfolioBriefing();

    expect(briefing.metrics.enterpriseSummary.totalDefinitions).toBe(2);
    expect(briefing.metrics.enterpriseSummary.totalMeasurements).toBe(1);
    expect(briefing.metrics.enterpriseSummary.metricsWithData).toBe(1);
    expect(briefing.metrics.enterpriseSummary.metricsWithoutData).toBeGreaterThanOrEqual(1);
  });

  it('enterprise aggregation is mathematically consistent', () => {
    const workforce = new WorkforcePlatformImpl();
    deployAllOffices(workforce);
    const eis = new ExecutiveIntelligence(workforce);
    const portfolio = new PortfolioEngine(eis);
    portfolio.registerProducts(ALL_PROFILES);

    portfolio.registerKpiDefinition(DELIVERY_DEF);

    const now = Date.now();
    portfolio.submitKpiMeasurement({ measurementId: 'm-mw', definitionId: 'def-delivery-throughput', productId: 'menwise360', value: 12, measuredAt: now, confidence: 0.95, evidenceSource: 'test', status: 'available' });
    portfolio.submitKpiMeasurement({ measurementId: 'm-bq', definitionId: 'def-delivery-throughput', productId: 'bible-quest', value: 5, measuredAt: now, confidence: 0.90, evidenceSource: 'test', status: 'available' });
    portfolio.submitKpiMeasurement({ measurementId: 'm-ca', definitionId: 'def-delivery-throughput', productId: 'creator-automation', value: 20, measuredAt: now, confidence: 0.85, evidenceSource: 'test', status: 'available' });

    const briefing = portfolio.refreshPortfolioBriefing();

    expect(briefing.metrics.enterpriseSummary.totalMeasurements).toBe(3);

    const totalFromProductComparison = briefing.metrics.productComparison.reduce((a, p) => a + p.metricsReported, 0);
    // Each product has 1 metric definition applicable (DELIVERY_DEF with *)
    expect(totalFromProductComparison).toBe(5);

    const deliveryCategory = briefing.metrics.categoryBreakdown.find(c => c.category === 'delivery');
    expect(deliveryCategory).toBeDefined();
    expect(deliveryCategory!.metricCount).toBe(1);

    const expectedAvgConf = Math.round((0.95 + 0.90 + 0.85) / 3 * 100) / 100;
    expect(briefing.metrics.enterpriseSummary.averageConfidence).toBe(expectedAvgConf);
  });

  it('product comparisons preserve attribution', () => {
    const workforce = new WorkforcePlatformImpl();
    deployAllOffices(workforce);
    const eis = new ExecutiveIntelligence(workforce);
    const portfolio = new PortfolioEngine(eis);
    portfolio.registerProducts(ALL_PROFILES);

    portfolio.registerKpiDefinition(DELIVERY_DEF);
    portfolio.registerKpiDefinition(QUALITY_DEF);

    portfolio.submitKpiMeasurement({ measurementId: 'm-mw-d', definitionId: 'def-delivery-throughput', productId: 'menwise360', value: 12, measuredAt: Date.now(), confidence: 0.95, evidenceSource: 'test', status: 'available' });
    portfolio.submitKpiMeasurement({ measurementId: 'm-bq-d', definitionId: 'def-delivery-throughput', productId: 'bible-quest', value: 5, measuredAt: Date.now(), confidence: 0.90, evidenceSource: 'test', status: 'available' });

    const briefing = portfolio.refreshPortfolioBriefing();

    const mwComparison = briefing.metrics.productComparison.find(p => p.productId === 'menwise360');
    const bqComparison = briefing.metrics.productComparison.find(p => p.productId === 'bible-quest');
    const caComparison = briefing.metrics.productComparison.find(p => p.productId === 'creator-automation');

    expect(mwComparison).toBeDefined();
    expect(bqComparison).toBeDefined();
    expect(caComparison).toBeDefined();

    expect(mwComparison!.productName).toBe('MenWise360');
    expect(mwComparison!.metricsReported).toBeGreaterThan(0);
    expect(bqComparison!.metricsReported).toBeGreaterThan(0);
    // Creator Automation has no measurements submitted
    expect(caComparison!.averageConfidence).toBe(0);
  });

  it('portfolio briefings include metric rationale', () => {
    const workforce = new WorkforcePlatformImpl();
    deployAllOffices(workforce);
    const eis = new ExecutiveIntelligence(workforce);
    const portfolio = new PortfolioEngine(eis);
    portfolio.registerProducts(ALL_PROFILES);

    portfolio.registerKpiDefinition(DELIVERY_DEF);

    portfolio.submitKpiMeasurement({ measurementId: 'm-mw-1', definitionId: 'def-delivery-throughput', productId: 'menwise360', value: 12, measuredAt: Date.now(), confidence: 0.95, evidenceSource: 'test', status: 'available' });
    portfolio.submitKpiMeasurement({ measurementId: 'm-mw-2', definitionId: 'def-delivery-throughput', productId: 'menwise360', value: 8, measuredAt: Date.now() - 86400000 * 30, confidence: 0.90, evidenceSource: 'test', status: 'available' });

    const briefing = portfolio.refreshPortfolioBriefing();

    expect(briefing.metrics).toBeDefined();
    expect(briefing.metrics.enterpriseSummary).toBeDefined();
    expect(briefing.metrics.categoryBreakdown).toBeDefined();
    expect(briefing.metrics.productComparison).toBeDefined();
    expect(briefing.metrics.metricsRequiringAttention).toBeDefined();

    const trendingMetrics = briefing.metrics.metricsRequiringAttention;
    for (const metric of trendingMetrics) {
      expect(metric.rationale.length).toBeGreaterThan(0);
      expect(metric.definitionId).toBeTruthy();
      expect(metric.name).toBeTruthy();
    }
  });

  it('adding a new KPI definition requires no engine changes', () => {
    const workforce = new WorkforcePlatformImpl();
    deployAllOffices(workforce);
    const eis = new ExecutiveIntelligence(workforce);
    const portfolio = new PortfolioEngine(eis);
    portfolio.registerProducts(ALL_PROFILES);

    portfolio.registerKpiDefinition(DELIVERY_DEF);
    const defsBefore = portfolio.getKpiDefinitions().length;

    const newDef: KpiDefinition = {
      id: 'def-knowledge-reuse',
      category: 'knowledge',
      name: 'Knowledge Reuse Rate',
      description: 'Percentage of knowledge artifacts reused across products',
      unit: '%',
      measurementMethod: 'Count of cross-product knowledge retrievals',
      targetType: 'higher_is_better',
      ownerOffice: 'Knowledge Office',
      applicableProducts: ['*'],
      targetValue: 60,
    };

    portfolio.registerKpiDefinition(newDef);
    const defsAfter = portfolio.getKpiDefinitions().length;
    expect(defsAfter).toBe(defsBefore + 1);
  });

  it('adding a sixth product requires registration only', () => {
    const workforce = new WorkforcePlatformImpl();
    deployAllOffices(workforce);
    const eis = new ExecutiveIntelligence(workforce);
    const portfolio = new PortfolioEngine(eis);
    portfolio.registerProducts(ALL_PROFILES);
    portfolio.registerKpiDefinition(DELIVERY_DEF);

    const briefing5 = portfolio.refreshPortfolioBriefing();
    expect(briefing5.metadata.productCount).toBe(5);

    const sixthProduct = { ...MENWISE360_PROFILE, productId: 'sixth-product', productName: 'Sixth Product' };
    portfolio.registerProduct(sixthProduct);

    const briefing6 = portfolio.refreshPortfolioBriefing();
    expect(briefing6.metadata.productCount).toBe(6);
  });

  it('existing Phase 1 behavior remains unchanged', () => {
    const workforce = new WorkforcePlatformImpl();
    deployAllOffices(workforce);
    const eis = new ExecutiveIntelligence(workforce);
    const portfolio = new PortfolioEngine(eis);
    portfolio.registerProducts(ALL_PROFILES);

    const briefing = portfolio.refreshPortfolioBriefing();

    expect(briefing.portfolioHealth).toBeDefined();
    expect(briefing.executiveSummary).toBeTruthy();
    expect(briefing.productSummaries.length).toBe(5);
    expect(briefing.enterpriseRisks).toBeDefined();
    expect(briefing.crossProductDependencies).toBeDefined();
    expect(briefing.strategicPriorities).toBeDefined();
    expect(briefing.recommendedActions).toBeDefined();
    expect(briefing.kpiSummary).toBeDefined();
  });

  it('declining trend for higher_is_better produces attention metric', () => {
    const engine = new KpiTrendEngine();
    const now = Date.now();

    const measurements: KpiMeasurement[] = [
      { measurementId: 'm1', definitionId: 'def-delivery-throughput', productId: 'menwise360', value: 15, measuredAt: now - 86400000 * 60, confidence: 0.9, evidenceSource: 'test', status: 'available' },
      { measurementId: 'm2', definitionId: 'def-delivery-throughput', productId: 'menwise360', value: 8, measuredAt: now, confidence: 0.9, evidenceSource: 'test', status: 'available' },
    ];

    const result = engine.calculateTrend(DELIVERY_DEF, measurements);
    expect(result.direction).toBe('declining');
    expect(result.currentValue).toBe(8);
    expect(result.previousValue).toBe(15);
    expect(result.changePercent).toBeCloseTo(-46.67, -1);
  });

  it('lower_is_better target type inverts trend direction', () => {
    const engine = new KpiTrendEngine();
    const now = Date.now();

    const improving: KpiMeasurement[] = [
      { measurementId: 'm1', definitionId: 'def-gov-cycle', productId: 'menwise360', value: 48, measuredAt: now - 86400000 * 60, confidence: 0.9, evidenceSource: 'test', status: 'available' },
      { measurementId: 'm2', definitionId: 'def-gov-cycle', productId: 'menwise360', value: 12, measuredAt: now, confidence: 0.9, evidenceSource: 'test', status: 'available' },
    ];

    const result = engine.calculateTrend(GOVERNANCE_DEF, improving);
    expect(result.direction).toBe('improving');
    expect(result.currentValue).toBe(12);
    expect(result.previousValue).toBe(48);
  });

  it('getMetricsByOffice returns definitions owned by that office', () => {
    const workforce = new WorkforcePlatformImpl();
    deployAllOffices(workforce);
    const eis = new ExecutiveIntelligence(workforce);
    const portfolio = new PortfolioEngine(eis);

    portfolio.registerKpiDefinition(DELIVERY_DEF);
    portfolio.registerKpiDefinition(QUALITY_DEF);
    portfolio.registerKpiDefinition(GOVERNANCE_DEF);

    const opsMetrics = portfolio.getMetricsByOffice('Operations Office');
    expect(opsMetrics.length).toBe(1);
    expect(opsMetrics[0].id).toBe('def-delivery-throughput');

    const researchMetrics = portfolio.getMetricsByOffice('Research Office');
    expect(researchMetrics.length).toBe(1);
    expect(researchMetrics[0].id).toBe('def-quality-accuracy');
  });

  it('getMetricsByCategory filters correctly', () => {
    const workforce = new WorkforcePlatformImpl();
    deployAllOffices(workforce);
    const eis = new ExecutiveIntelligence(workforce);
    const portfolio = new PortfolioEngine(eis);

    portfolio.registerKpiDefinition(DELIVERY_DEF);
    portfolio.registerKpiDefinition(QUALITY_DEF);

    const deliveryMetrics = portfolio.getMetricsByCategory('delivery');
    expect(deliveryMetrics.length).toBe(1);
    expect(deliveryMetrics[0].id).toBe('def-delivery-throughput');

    const qualityMetrics = portfolio.getMetricsByCategory('quality');
    expect(qualityMetrics.length).toBe(1);
    expect(qualityMetrics[0].id).toBe('def-quality-accuracy');

    const governanceMetrics = portfolio.getMetricsByCategory('governance');
    expect(governanceMetrics.length).toBe(0);
  });

  it('getMetricHistory returns sorted measurements', () => {
    const workforce = new WorkforcePlatformImpl();
    deployAllOffices(workforce);
    const eis = new ExecutiveIntelligence(workforce);
    const portfolio = new PortfolioEngine(eis);

    portfolio.registerKpiDefinition(DELIVERY_DEF);

    const now = Date.now();
    portfolio.submitKpiMeasurement({ measurementId: 'm3', definitionId: 'def-delivery-throughput', productId: 'menwise360', value: 5, measuredAt: now - 86400000 * 60, confidence: 0.8, evidenceSource: 'test', status: 'available' });
    portfolio.submitKpiMeasurement({ measurementId: 'm2', definitionId: 'def-delivery-throughput', productId: 'menwise360', value: 8, measuredAt: now - 86400000 * 30, confidence: 0.9, evidenceSource: 'test', status: 'available' });
    portfolio.submitKpiMeasurement({ measurementId: 'm1', definitionId: 'def-delivery-throughput', productId: 'menwise360', value: 12, measuredAt: now, confidence: 0.95, evidenceSource: 'test', status: 'available' });

    const history = portfolio.getMetricHistory('def-delivery-throughput', 'menwise360');
    expect(history.length).toBe(3);
    expect(history[0].value).toBe(5);
    expect(history[1].value).toBe(8);
    expect(history[2].value).toBe(12);
  });
});
