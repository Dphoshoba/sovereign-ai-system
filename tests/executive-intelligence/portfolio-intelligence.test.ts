import { describe, it, expect } from 'vitest';
import { WorkforcePlatformImpl } from '../../lib/workforce/workforce-platform-impl';
import { ExecutiveOffice } from '../../lib/executive-office/executive-office';
import { ResearchOffice } from '../../lib/research-office/research-office';
import { ProductOffice } from '../../lib/product-office/product-office';
import { OperationsOffice } from '../../lib/operations-office/operations-office';
import { KnowledgeOffice } from '../../lib/knowledge-office/knowledge-office';
import { ExecutiveIntelligence } from '../../lib/executive-intelligence/intelligence-engine';
import { PortfolioEngine } from '../../lib/executive-intelligence/portfolio-engine';
import {
  BIBLE_QUEST_PROFILE, CREATOR_AUTOMATION_PROFILE, VISIONCRAFT_STUDIO_PROFILE,
  INSPIREVOICE_PROFILE, MENWISE360_PROFILE, type ProductDeploymentProfile,
} from '../../lib/executive-intelligence/product-profile-types';

function deployAllOffices(workforce: WorkforcePlatformImpl): void {
  new ExecutiveOffice(workforce).deploy();
  new ResearchOffice(workforce).deploy();
  new ProductOffice(workforce).deploy();
  new OperationsOffice(workforce).deploy();
  new KnowledgeOffice(workforce).deploy();
}

const ALL_FIVE_PROFILES: ProductDeploymentProfile[] = [
  MENWISE360_PROFILE,
  BIBLE_QUEST_PROFILE,
  CREATOR_AUTOMATION_PROFILE,
  VISIONCRAFT_STUDIO_PROFILE,
  INSPIREVOICE_PROFILE,
];

describe('Era 5 Phase 1 — Portfolio Intelligence', () => {

  it('all five products register correctly', () => {
    const workforce = new WorkforcePlatformImpl();
    deployAllOffices(workforce);
    const eis = new ExecutiveIntelligence(workforce);
    const portfolio = new PortfolioEngine(eis);

    portfolio.registerProducts(ALL_FIVE_PROFILES);

    expect(portfolio.getProductCount()).toBe(5);
  });

  it('a sixth product is incorporated without engine modification', () => {
    const workforce = new WorkforcePlatformImpl();
    deployAllOffices(workforce);
    const eis = new ExecutiveIntelligence(workforce);
    const portfolio = new PortfolioEngine(eis);

    portfolio.registerProducts(ALL_FIVE_PROFILES);
    const briefing5 = portfolio.refreshPortfolioBriefing();
    expect(briefing5.metadata.productCount).toBe(5);

    const sixthProduct: ProductDeploymentProfile = {
      ...MENWISE360_PROFILE,
      productId: 'sixth-product',
      productName: 'Sixth Product',
    };
    portfolio.registerProduct(sixthProduct);

    const briefing6 = portfolio.refreshPortfolioBriefing();
    expect(briefing6.metadata.productCount).toBe(6);
    expect(briefing6.metadata.productCount).not.toBe(5);
  });

  it('product-attributed risks appear only under the correct product', () => {
    const workforce = new WorkforcePlatformImpl();
    deployAllOffices(workforce);
    const eis = new ExecutiveIntelligence(workforce);
    const portfolio = new PortfolioEngine(eis);
    portfolio.registerProducts(ALL_FIVE_PROFILES);

    portfolio.submitProductRisk({
      id: 'risk-bq-001',
      scope: 'product',
      productId: 'bible-quest',
      severity: 'critical',
      description: 'Biblical accuracy review failed for Quest module 5',
      affectedOffices: ['Research Office'],
      raisedAt: Date.now(),
      source: 'product-registration',
    });

    portfolio.submitProductRisk({
      id: 'risk-ca-001',
      scope: 'product',
      productId: 'creator-automation',
      severity: 'high',
      description: 'Automation pipeline approval pending for 48 hours',
      affectedOffices: ['Operations Office'],
      raisedAt: Date.now(),
      source: 'product-registration',
    });

    const briefing = portfolio.refreshPortfolioBriefing();

    const bqSummary = briefing.productSummaries.find(s => s.productId === 'bible-quest');
    expect(bqSummary).toBeDefined();
    expect(bqSummary!.risks.length).toBe(1);
    expect(bqSummary!.risks[0].id).toBe('risk-bq-001');

    const caSummary = briefing.productSummaries.find(s => s.productId === 'creator-automation');
    expect(caSummary).toBeDefined();
    expect(caSummary!.risks.length).toBe(1);
    expect(caSummary!.risks[0].id).toBe('risk-ca-001');

    const mwSummary = briefing.productSummaries.find(s => s.productId === 'menwise360');
    expect(mwSummary).toBeDefined();
    expect(mwSummary!.risks.length).toBe(0);

    const allProductRisks = briefing.productSummaries.flatMap(s => s.risks);
    expect(allProductRisks.length).toBe(2);
    expect(allProductRisks.every(r => r.scope === 'product')).toBe(true);
  });

  it('enterprise risks remain enterprise-scoped', () => {
    const workforce = new WorkforcePlatformImpl();
    deployAllOffices(workforce);
    const eis = new ExecutiveIntelligence(workforce);
    const portfolio = new PortfolioEngine(eis);
    portfolio.registerProducts(ALL_FIVE_PROFILES);

    workforce.createTask({
      taskId: '', type: 'infra-outage', summary: 'Enterprise infrastructure outage affecting all products — critical',
      assignedTo: 'OPS-DEPLOY-001', assignedBy: 'Director of Operations', status: 'blocked',
      priority: 5, dependencies: [], humanApprovalRequired: false,
      created: Date.now(), accepted: null, completed: null, auditTrail: [],
    });

    portfolio.submitProductRisk({
      id: 'risk-bq-002',
      scope: 'enterprise',
      severity: 'high',
      description: 'Shared compliance regulation update pending',
      affectedOffices: ['Executive Office'],
      raisedAt: Date.now(),
      source: 'product-registration',
    });

    const briefing = portfolio.refreshPortfolioBriefing();

    expect(briefing.enterpriseRisks.length).toBeGreaterThanOrEqual(1);

    for (const risk of briefing.enterpriseRisks) {
      expect(risk.scope).toBe('enterprise');
    }

    for (const summary of briefing.productSummaries) {
      const productRisks = summary.risks;
      const hasEnterpriseRisk = productRisks.some(r => r.scope === 'enterprise');
      expect(hasEnterpriseRisk).toBe(false);
    }
  });

  it('unattributed records remain visible and are not misclassified', () => {
    const workforce = new WorkforcePlatformImpl();
    deployAllOffices(workforce);
    const eis = new ExecutiveIntelligence(workforce);
    const portfolio = new PortfolioEngine(eis);
    portfolio.registerProducts(ALL_FIVE_PROFILES);

    workforce.createTask({
      taskId: '', type: 'generic-blocker', summary: 'Cross-office coordination issue — no product attribution',
      assignedTo: 'OPS-DEPLOY-001', assignedBy: 'Director of Operations', status: 'blocked',
      priority: 3, dependencies: [], humanApprovalRequired: false,
      created: Date.now(), accepted: null, completed: null, auditTrail: [],
    });

    const briefing = portfolio.refreshPortfolioBriefing();

    expect(briefing.unattributedItems.length).toBeGreaterThanOrEqual(1);

    for (const item of briefing.unattributedItems) {
      expect(item).toContain('Blocker:');
    }

    for (const summary of briefing.productSummaries) {
      expect(summary.risks.length).toBe(0);
    }
  });

  it('per-product health rolls into portfolio health deterministically', () => {
    const workforce = new WorkforcePlatformImpl();
    deployAllOffices(workforce);
    const eis = new ExecutiveIntelligence(workforce);
    const portfolio = new PortfolioEngine(eis);
    portfolio.registerProducts(ALL_FIVE_PROFILES);

    portfolio.registerKpiTargets([
      { productId: 'menwise360', category: 'delivery', metric: 'articles-published', target: 10, unit: 'articles', description: 'Monthly articles published' },
      { productId: 'bible-quest', category: 'delivery', metric: 'modules-published', target: 5, unit: 'modules', description: 'Monthly modules published' },
      { productId: 'creator-automation', category: 'delivery', metric: 'automations-completed', target: 20, unit: 'automations', description: 'Monthly automation completions' },
      { productId: 'visioncraft-studio', category: 'delivery', metric: 'campaigns-published', target: 3, unit: 'campaigns', description: 'Monthly campaigns published' },
      { productId: 'inspirevoice', category: 'delivery', metric: 'videos-published', target: 8, unit: 'videos', description: 'Monthly videos published' },
    ]);

    portfolio.submitKpiEvidence({ productId: 'menwise360', category: 'delivery', metric: 'articles-published', value: 12, unit: 'articles', source: 'operations-tracking', measuredAt: Date.now() });
    portfolio.submitKpiEvidence({ productId: 'bible-quest', category: 'delivery', metric: 'modules-published', value: 4, unit: 'modules', source: 'operations-tracking', measuredAt: Date.now() });
    portfolio.submitKpiEvidence({ productId: 'creator-automation', category: 'delivery', metric: 'automations-completed', value: 25, unit: 'automations', source: 'operations-tracking', measuredAt: Date.now() });

    const briefing = portfolio.refreshPortfolioBriefing();

    expect(briefing.portfolioHealth.overall).toBeDefined();
    expect(['healthy', 'attention', 'critical', 'unknown']).toContain(briefing.portfolioHealth.overall);

    const mwSummary = briefing.productSummaries.find(s => s.productId === 'menwise360');
    expect(mwSummary).toBeDefined();
    expect(mwSummary!.health).toBe('healthy');

    const bqSummary = briefing.productSummaries.find(s => s.productId === 'bible-quest');
    expect(bqSummary).toBeDefined();
    expect(bqSummary!.health).toBe('attention');

    const ivSummary = briefing.productSummaries.find(s => s.productId === 'inspirevoice');
    expect(ivSummary).toBeDefined();
    expect(ivSummary!.health).toBe('unknown');

    // Deterministic: calling twice produces same result
    const briefing2 = portfolio.refreshPortfolioBriefing();
    expect(briefing2.portfolioHealth.overall).toBe(briefing.portfolioHealth.overall);
    expect(briefing2.productSummaries.map(s => `${s.productId}:${s.health}`).sort())
      .toEqual(briefing.productSummaries.map(s => `${s.productId}:${s.health}`).sort());
  });

  it('missing KPI evidence reports unavailable', () => {
    const workforce = new WorkforcePlatformImpl();
    deployAllOffices(workforce);
    const eis = new ExecutiveIntelligence(workforce);
    const portfolio = new PortfolioEngine(eis);
    portfolio.registerProducts(ALL_FIVE_PROFILES);

    portfolio.registerKpiTargets([
      { productId: 'menwise360', category: 'delivery', metric: 'articles-published', target: 10, unit: 'articles', description: 'Monthly articles published' },
      { productId: 'menwise360', category: 'quality', metric: 'accuracy-score', target: 95, unit: '%', description: 'Content accuracy score' },
    ]);

    portfolio.submitKpiEvidence({ productId: 'menwise360', category: 'delivery', metric: 'articles-published', value: 12, unit: 'articles', source: 'operations-tracking', measuredAt: Date.now() });

    const briefing = portfolio.refreshPortfolioBriefing();
    const mwKpis = briefing.productSummaries.find(s => s.productId === 'menwise360')!.kpis;

    const deliveryKpi = mwKpis.find(k => k.metric === 'articles-published');
    expect(deliveryKpi).toBeDefined();
    expect(deliveryKpi!.value).toBe(12);
    expect(deliveryKpi!.status).not.toBe('unavailable');

    const qualityKpi = mwKpis.find(k => k.metric === 'accuracy-score');
    expect(qualityKpi).toBeDefined();
    expect(qualityKpi!.value).toBeNull();
    expect(qualityKpi!.status).toBe('unavailable');

    expect(briefing.metadata.kpisWithEvidence).toBe(1);
    expect(briefing.metadata.totalKpis).toBe(2);
  });

  it('strategic initiatives retain traceability', () => {
    const workforce = new WorkforcePlatformImpl();
    deployAllOffices(workforce);
    const eis = new ExecutiveIntelligence(workforce);
    const portfolio = new PortfolioEngine(eis);
    portfolio.registerProducts(ALL_FIVE_PROFILES);

    portfolio.registerInitiative({
      id: 'init-ai-edu-001',
      name: 'AI Education Series',
      description: 'Produce a comprehensive AI education video series spanning InspireVoice and Bible Quest',
      productIds: ['inspirevoice', 'bible-quest'],
      strategicObjective: 'Expand educational content portfolio',
      status: 'in-progress',
      progress: 60,
      startedAt: Date.now() - 86400000 * 30,
      completedAt: null,
    });

    portfolio.registerInitiative({
      id: 'init-health-001',
      name: 'MenWise360 Q3 Content Refresh',
      description: 'Refresh top 20 MenWise360 articles with latest research',
      productIds: ['menwise360'],
      strategicObjective: 'Maintain content freshness',
      status: 'in-progress',
      progress: 40,
      startedAt: Date.now() - 86400000 * 14,
      completedAt: null,
    });

    const briefing = portfolio.refreshPortfolioBriefing();

    expect(briefing.strategicPriorities.length).toBe(2);

    const aiEdu = briefing.strategicPriorities.find(i => i.id === 'init-ai-edu-001');
    expect(aiEdu).toBeDefined();
    expect(aiEdu!.productIds).toContain('inspirevoice');
    expect(aiEdu!.productIds).toContain('bible-quest');
    expect(aiEdu!.strategicObjective).toBe('Expand educational content portfolio');
    expect(aiEdu!.progress).toBe(60);

    const ivSummary = briefing.productSummaries.find(s => s.productId === 'inspirevoice');
    expect(ivSummary).toBeDefined();
    expect(ivSummary!.activeInitiatives.some(i => i.id === 'init-ai-edu-001')).toBe(true);

    const mwSummary = briefing.productSummaries.find(s => s.productId === 'menwise360');
    expect(mwSummary).toBeDefined();
    expect(mwSummary!.activeInitiatives.some(i => i.id === 'init-health-001')).toBe(true);
  });

  it('cross-product dependencies identify both products', () => {
    const workforce = new WorkforcePlatformImpl();
    deployAllOffices(workforce);
    const eis = new ExecutiveIntelligence(workforce);
    const portfolio = new PortfolioEngine(eis);
    portfolio.registerProducts(ALL_FIVE_PROFILES);

    portfolio.registerDependency({
      id: 'dep-vc-iv-001',
      sourceProductId: 'visioncraft-studio',
      targetProductId: 'inspirevoice',
      initiativeId: 'init-ai-edu-001',
      type: 'visual-assets',
      status: 'active',
      rationale: 'InspireVoice educational videos require VisionCraft Studio visual asset pipeline',
    });

    portfolio.registerDependency({
      id: 'dep-mw-bq-001',
      sourceProductId: 'menwise360',
      targetProductId: 'bible-quest',
      type: 'research',
      status: 'active',
      rationale: 'Biblical health content draws on shared wellness research',
    });

    portfolio.registerDependency({
      id: 'dep-ca-all-001',
      sourceProductId: 'creator-automation',
      targetProductId: 'inspirevoice',
      type: 'orchestration',
      status: 'blocked',
      rationale: 'Creator Automation workflow templates needed for InspireVoice media pipeline',
    });

    const briefing = portfolio.refreshPortfolioBriefing();

    expect(briefing.crossProductDependencies.length).toBe(3);

    const dep = briefing.crossProductDependencies.find(d => d.id === 'dep-vc-iv-001');
    expect(dep).toBeDefined();
    expect(dep!.sourceProductId).toBe('visioncraft-studio');
    expect(dep!.targetProductId).toBe('inspirevoice');
    expect(dep!.type).toBe('visual-assets');
    expect(dep!.initiativeId).toBe('init-ai-edu-001');

    const blockedDep = briefing.crossProductDependencies.find(d => d.status === 'blocked');
    expect(blockedDep).toBeDefined();
    expect(blockedDep!.sourceProductId).toBe('creator-automation');
    expect(blockedDep!.targetProductId).toBe('inspirevoice');

    const hasRecommendedAction = briefing.recommendedActions.some(a =>
      a.action.includes('creator-automation') && a.action.includes('inspirevoice')
    );
    expect(hasRecommendedAction).toBe(true);
  });

  it('executive actions cite their supporting evidence', () => {
    const workforce = new WorkforcePlatformImpl();
    deployAllOffices(workforce);
    const eis = new ExecutiveIntelligence(workforce);
    const portfolio = new PortfolioEngine(eis);
    portfolio.registerProducts(ALL_FIVE_PROFILES);

    portfolio.registerKpiTargets([
      { productId: 'bible-quest', category: 'delivery', metric: 'modules-published', target: 5, unit: 'modules', description: 'Monthly modules published' },
      { productId: 'bible-quest', category: 'quality', metric: 'accuracy-score', target: 95, unit: '%', description: 'Content accuracy score' },
    ]);

    portfolio.submitKpiEvidence({ productId: 'bible-quest', category: 'delivery', metric: 'modules-published', value: 2, unit: 'modules', source: 'operations-tracking', measuredAt: Date.now() });
    portfolio.submitKpiEvidence({ productId: 'bible-quest', category: 'quality', metric: 'accuracy-score', value: 72, unit: '%', source: 'quality-review', measuredAt: Date.now() });

    portfolio.submitProductRisk({
      id: 'risk-bq-critical',
      scope: 'product',
      productId: 'bible-quest',
      severity: 'critical',
      description: 'Content accuracy below threshold for 3 consecutive reviews',
      affectedOffices: ['Product Office', 'Research Office'],
      raisedAt: Date.now(),
      source: 'product-registration',
    });

    const briefing = portfolio.refreshPortfolioBriefing();

    expect(briefing.recommendedActions.length).toBeGreaterThanOrEqual(1);

    for (const action of briefing.recommendedActions) {
      expect(action.action).toBeTruthy();
      expect(action.rationale).toBeTruthy();
      expect(action.supportingEvidence.length).toBeGreaterThanOrEqual(1);
      expect(['low', 'medium', 'high', 'critical']).toContain(action.priority);
    }

    const criticalActions = briefing.recommendedActions.filter(a => a.priority === 'critical');
    expect(criticalActions.length).toBeGreaterThanOrEqual(1);

    const bqAction = criticalActions.find(a => a.productId === 'bible-quest');
    expect(bqAction).toBeDefined();
    expect(bqAction!.supportingEvidence.length).toBeGreaterThanOrEqual(1);
  });

  it('portfolio snapshots are immutable — repeated calls do not mutate previous output', () => {
    const workforce = new WorkforcePlatformImpl();
    deployAllOffices(workforce);
    const eis = new ExecutiveIntelligence(workforce);
    const portfolio = new PortfolioEngine(eis);
    portfolio.registerProducts(ALL_FIVE_PROFILES);

    portfolio.registerKpiTargets([
      { productId: 'menwise360', category: 'delivery', metric: 'articles-published', target: 10, unit: 'articles', description: 'Monthly articles published' },
    ]);

    portfolio.submitKpiEvidence({ productId: 'menwise360', category: 'delivery', metric: 'articles-published', value: 12, unit: 'articles', source: 'operations-tracking', measuredAt: Date.now() });

    const briefing1 = portfolio.refreshPortfolioBriefing();
    const briefing2 = portfolio.refreshPortfolioBriefing();

    // Subsequent calls produce consistent health distribution
    expect(briefing1.portfolioHealth.productHealthDistribution).toEqual(briefing2.portfolioHealth.productHealthDistribution);
    expect(briefing1.portfolioHealth.overall).toBe(briefing2.portfolioHealth.overall);
  });
});
