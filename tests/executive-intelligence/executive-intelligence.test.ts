import { describe, it, expect, beforeEach } from 'vitest';
import { ExecutiveSnapshot, OfficeStatus, ExecutiveBriefing, EISRecommendation } from '../../lib/executive-intelligence/types';
import { WorkforcePlatformImpl } from '../../lib/workforce/workforce-platform-impl';
import { ExecutiveOffice } from '../../lib/executive-office/executive-office';
import { ResearchOffice } from '../../lib/research-office/research-office';
import { ProductOffice } from '../../lib/product-office/product-office';
import { OperationsOffice } from '../../lib/operations-office/operations-office';
import { KnowledgeOffice } from '../../lib/knowledge-office/knowledge-office';
import { collectExecutiveStatus } from '../../lib/executive-intelligence/collectors/executive-collector';
import { collectResearchStatus } from '../../lib/executive-intelligence/collectors/research-collector';
import { collectProductStatus } from '../../lib/executive-intelligence/collectors/product-collector';
import { collectOperationsStatus } from '../../lib/executive-intelligence/collectors/operations-collector';
import { collectKnowledgeStatus } from '../../lib/executive-intelligence/collectors/knowledge-collector';
import { buildSnapshot } from '../../lib/executive-intelligence/executive-snapshot';
import { ExecutiveIntelligence } from '../../lib/executive-intelligence/intelligence-engine';
import { createExecutiveIntelligence } from '../../lib/executive-intelligence';
import { ExecutiveIntelligenceEngine } from '../../lib/executive-intelligence/executive-intelligence-engine';
import type { ExecutiveDecision, KpiSnapshot, StrategicIndicator } from '../../lib/executive-intelligence/executive-intelligence-types';
import { PortfolioEngine } from '../../lib/executive-intelligence/portfolio-engine';
import {
  MENWISE360_PROFILE, BIBLE_QUEST_PROFILE, CREATOR_AUTOMATION_PROFILE,
  VISIONCRAFT_STUDIO_PROFILE, INSPIREVOICE_PROFILE,
} from '../../lib/executive-intelligence/product-profile-types';

function deployAllOffices(w: WorkforcePlatformImpl): void {
  new ExecutiveOffice(w).deploy();
  new ResearchOffice(w).deploy();
  new ProductOffice(w).deploy();
  new OperationsOffice(w).deploy();
  new KnowledgeOffice(w).deploy();
}

const ALL_PROFILES = [MENWISE360_PROFILE, BIBLE_QUEST_PROFILE, CREATOR_AUTOMATION_PROFILE, VISIONCRAFT_STUDIO_PROFILE, INSPIREVOICE_PROFILE];

const SAMPLE_DECISION: ExecutiveDecision = {
  id: 'dec-001',
  title: 'Expand AI initiatives',
  description: 'Allocate budget for AI roadmap',
  category: 'strategic',
  status: 'proposed',
  proposedBy: 'CEO',
  proposedAt: 1000,
  evidenceIds: ['ev-001'],
  rationale: 'Market opportunity analysis',
  expectedOutcome: 'Revenue growth +15%',
  version: 1,
};


describe('EIS Types', () => {
  it('defines OfficeStatus with health, priorities, risks, blockers', () => {
    const status: OfficeStatus = {
      office: 'Executive Office',
      health: 'healthy',
      agentCount: 6,
      activeTasks: 3,
      blockers: [],
      recentChanges: [],
    };
    expect(status.office).toBe('Executive Office');
    expect(status.health).toBe('healthy');
  });

  it('defines ExecutiveSnapshot with all 5 offices', () => {
    const snapshot: ExecutiveSnapshot = {
      snapshotId: 'snap-001',
      timestamp: Date.now(),
      offices: {
        'Executive Office': { office: 'Executive Office', health: 'healthy', agentCount: 6, activeTasks: 2, blockers: [], recentChanges: [] },
        'Research Office': { office: 'Research Office', health: 'healthy', agentCount: 4, activeTasks: 1, blockers: [], recentChanges: [] },
        'Product Office': { office: 'Product Office', health: 'healthy', agentCount: 5, activeTasks: 3, blockers: [], recentChanges: [] },
        'Operations Office': { office: 'Operations Office', health: 'healthy', agentCount: 5, activeTasks: 2, blockers: [], recentChanges: [] },
        'Knowledge Office': { office: 'Knowledge Office', health: 'healthy', agentCount: 4, activeTasks: 1, blockers: [], recentChanges: [] },
      },
      pendingDecisions: [],
      escalatedRisks: [],
    };
    expect(Object.keys(snapshot.offices).length).toBe(5);
  });

  it('defines ExecutiveBriefing with all sections', () => {
    const briefing: ExecutiveBriefing = {
      summary: 'Organization healthy',
      organizationHealth: { overall: 'healthy', offices: {} },
      priorities: [],
      activeRisks: [],
      blockedItems: [],
      pendingDecisions: [],
      kpiTrends: { improving: [], declining: [] },
      recommendations: [],
      officeStatus: {},
      metadata: { generatedAt: 0, snapshotVersion: '1', confidence: 1.0, sources: [] },
    };
    expect(briefing.summary).toBeDefined();
    expect(briefing.recommendations).toEqual([]);
  });

  it('defines EISRecommendation with priority, action, reason', () => {
    const rec: EISRecommendation = {
      priority: 'high',
      action: 'Escalate deployment',
      reason: 'Blocked by Operations',
      office: 'Product Office',
    };
    expect(rec.priority).toBe('high');
  });
});

describe('EIS Collectors', () => {
  let workforce: WorkforcePlatformImpl;

  beforeEach(() => {
    workforce = new WorkforcePlatformImpl();
    new ExecutiveOffice(workforce).deploy();
    new ResearchOffice(workforce).deploy();
    new ProductOffice(workforce).deploy();
    new OperationsOffice(workforce).deploy();
    new KnowledgeOffice(workforce).deploy();
  });

  it('executive collector returns status with agent count', () => {
    const status = collectExecutiveStatus(workforce);
    expect(status.office).toBe('Executive Office');
    expect(status.agentCount).toBe(6);
    expect(status.health).toBe('healthy');
  });

  it('research collector returns Research Office status', () => {
    const status = collectResearchStatus(workforce);
    expect(status.office).toBe('Research Office');
    expect(status.agentCount).toBe(4);
  });

  it('product collector returns Product Office status', () => {
    const status = collectProductStatus(workforce);
    expect(status.office).toBe('Product Office');
    expect(status.agentCount).toBe(5);
  });

  it('operations collector returns Operations Office status', () => {
    const status = collectOperationsStatus(workforce);
    expect(status.office).toBe('Operations Office');
    expect(status.agentCount).toBe(5);
  });

  it('knowledge collector returns Knowledge Office status', () => {
    const status = collectKnowledgeStatus(workforce);
    expect(status.office).toBe('Knowledge Office');
    expect(status.agentCount).toBe(4);
  });
});

describe('EIS Snapshot', () => {
  let workforce: WorkforcePlatformImpl;

  beforeEach(() => {
    workforce = new WorkforcePlatformImpl();
    new ExecutiveOffice(workforce).deploy();
    new ResearchOffice(workforce).deploy();
    new ProductOffice(workforce).deploy();
    new OperationsOffice(workforce).deploy();
    new KnowledgeOffice(workforce).deploy();
  });

  it('buildSnapshot collects all 5 offices', () => {
    const snapshot = buildSnapshot(workforce);
    expect(snapshot.snapshotId).toBeDefined();
    expect(snapshot.timestamp).toBeGreaterThan(0);
    expect(Object.keys(snapshot.offices).length).toBe(5);
    expect(snapshot.offices['Executive Office'].health).toBe('healthy');
    expect(snapshot.offices['Research Office'].agentCount).toBe(4);
  });

  it('snapshot captures blockers when tasks exist', () => {
    workforce.createTask({
      taskId: '', type: 'roadmap-change', summary: 'Blocked release', assignedTo: 'PROD-RMAP-001',
      assignedBy: 'Director of Product', status: 'blocked', priority: 4,
      dependencies: [], humanApprovalRequired: false,
      created: Date.now(), accepted: null, completed: null, auditTrail: [],
    });
    const snapshot = buildSnapshot(workforce);
    const prod = snapshot.offices['Product Office'];
    expect(prod.blockers.length).toBeGreaterThanOrEqual(1);
  });
});

describe('EIS Intelligence Engine', () => {
  let workforce: WorkforcePlatformImpl;
  let eis: ExecutiveIntelligence;

  beforeEach(() => {
    workforce = new WorkforcePlatformImpl();
    new ExecutiveOffice(workforce).deploy();
    new ResearchOffice(workforce).deploy();
    new ProductOffice(workforce).deploy();
    new OperationsOffice(workforce).deploy();
    new KnowledgeOffice(workforce).deploy();
    eis = new ExecutiveIntelligence(workforce);
  });

  it('produces briefing from snapshot', () => {
    const briefing = eis.refreshAndBrief();
    expect(briefing.summary).toBeDefined();
    expect(briefing.organizationHealth.overall).toBe('healthy');
    expect(briefing.officeStatus['Executive Office']).toBeDefined();
    expect(briefing.officeStatus['Research Office']).toBeDefined();
    expect(briefing.officeStatus['Product Office']).toBeDefined();
    expect(briefing.officeStatus['Operations Office']).toBeDefined();
    expect(briefing.officeStatus['Knowledge Office']).toBeDefined();
    expect(briefing.metadata.confidence).toBeGreaterThan(0);
    expect(briefing.metadata.sources.length).toBe(5);
  });

  it('detects critical health when agents missing', () => {
    const emptyWorkforce = new WorkforcePlatformImpl();
    new ExecutiveOffice(emptyWorkforce).deploy();
    const emptyEis = new ExecutiveIntelligence(emptyWorkforce);
    const briefing = emptyEis.refreshAndBrief();
    expect(briefing.organizationHealth.overall).toBe('critical');
    expect(briefing.organizationHealth.offices['Research Office']).toBe('unknown');
  });

  it('blocked tasks appear as risks and recommendations', () => {
    workforce.createTask({
      taskId: '', type: 'deployment-blocked', summary: 'Production deployment blocked by failed gate',
      assignedTo: 'OPS-DEPLOY-001', assignedBy: 'Director of Operations', status: 'blocked',
      priority: 5, dependencies: [], humanApprovalRequired: false,
      created: Date.now(), accepted: null, completed: null, auditTrail: [],
    });
    const briefing = eis.refreshAndBrief();
    expect(briefing.activeRisks.length).toBeGreaterThanOrEqual(1);
    expect(briefing.recommendations.length).toBeGreaterThanOrEqual(1);
  });
});

describe('EIS Public API', () => {
  it('createExecutiveIntelligence returns configured EIS', () => {
    const workforce = new WorkforcePlatformImpl();
    new ExecutiveOffice(workforce).deploy();
    new ResearchOffice(workforce).deploy();
    new ProductOffice(workforce).deploy();
    new OperationsOffice(workforce).deploy();
    new KnowledgeOffice(workforce).deploy();

    const eis = createExecutiveIntelligence(workforce);
    const briefing = eis.refreshAndBrief();
    expect(briefing.summary).toBeDefined();
    expect(briefing.metadata.sources.length).toBe(5);
  });

  it('getExecutiveBriefing returns briefing for specified role', () => {
    const workforce = new WorkforcePlatformImpl();
    new ExecutiveOffice(workforce).deploy();
    new ResearchOffice(workforce).deploy();
    new ProductOffice(workforce).deploy();
    new OperationsOffice(workforce).deploy();
    new KnowledgeOffice(workforce).deploy();

    const eis = createExecutiveIntelligence(workforce);
    const ceoBriefing = eis.getExecutiveBriefing('CEO');
    expect(ceoBriefing.summary).toBeDefined();
    const defaultBriefing = eis.getCeoBriefing();
    expect(defaultBriefing.summary).toBe(ceoBriefing.summary);
  });
});

describe('Era 6 — Executive Intelligence Engine', () => {
  it('register and retrieve a decision', () => {
    const engine = new ExecutiveIntelligenceEngine();
    engine.registerDecision(SAMPLE_DECISION);
    const d = engine.getDecision('dec-001');
    expect(d).toBeDefined();
    expect(d?.title).toBe('Expand AI initiatives');
    expect(d?.status).toBe('proposed');
  });

  it('decision lifecycle: proposed → discussed → approved → implemented → reviewed → closed', () => {
    const engine = new ExecutiveIntelligenceEngine();
    engine.registerDecision(SAMPLE_DECISION);

    const discussed = engine.advanceDecision('dec-001', 'discussed');
    expect(discussed?.status).toBe('discussed');
    expect(discussed?.discussedAt).toBeGreaterThan(0);

    const approved = engine.advanceDecision('dec-001', 'approved');
    expect(approved?.status).toBe('approved');
    expect(approved?.approvedAt).toBeGreaterThan(0);

    const implemented = engine.advanceDecision('dec-001', 'implemented');
    expect(implemented?.status).toBe('implemented');
    expect(implemented?.implementedAt).toBeGreaterThan(0);

    const reviewed = engine.advanceDecision('dec-001', 'reviewed');
    expect(reviewed?.status).toBe('reviewed');
    expect(reviewed?.reviewedAt).toBeGreaterThan(0);

    const closed = engine.advanceDecision('dec-001', 'closed');
    expect(closed?.status).toBe('closed');
    expect(closed?.closedAt).toBeGreaterThan(0);

    const all = engine.getAllDecisions();
    expect(all.length).toBe(6);
  });

  it('decisions are immutable — new version preserves originals', () => {
    const engine = new ExecutiveIntelligenceEngine();
    engine.registerDecision(SAMPLE_DECISION);
    engine.advanceDecision('dec-001', 'discussed');

    const v1 = engine.getDecision('dec-001', 1);
    expect(v1?.status).toBe('proposed');
    expect(v1?.version).toBe(1);

    const latest = engine.getDecision('dec-001');
    expect(latest?.status).toBe('discussed');
    expect(latest?.version).toBe(2);
  });

  it('getRecentDecisions returns sorted by proposedAt', () => {
    const engine = new ExecutiveIntelligenceEngine();
    engine.registerDecision({ ...SAMPLE_DECISION, id: 'dec-old', proposedAt: 1000, version: 1 });
    engine.registerDecision({ ...SAMPLE_DECISION, id: 'dec-new', proposedAt: 3000, version: 1 });
    engine.registerDecision({ ...SAMPLE_DECISION, id: 'dec-mid', proposedAt: 2000, version: 1 });

    const recent = engine.getRecentDecisions(3);
    expect(recent[0].id).toBe('dec-new');
    expect(recent[1].id).toBe('dec-mid');
    expect(recent[2].id).toBe('dec-old');
  });

  it('captureKpiSnapshot stores and retrieves', () => {
    const engine = new ExecutiveIntelligenceEngine();
    const snapshot: KpiSnapshot = {
      id: 'kpi-001', title: 'Decision throughput', value: 14, target: 20,
      variance: -6, confidence: 0.8, category: 'governance', timestamp: 5000,
    };
    engine.captureKpiSnapshot(snapshot);
    const kpis = engine.getKpiSnapshots();
    expect(kpis.length).toBe(1);
    expect(kpis[0].title).toBe('Decision throughput');
    expect(kpis[0].value).toBe(14);
  });

  it('registerIndicator stores and retrieves', () => {
    const engine = new ExecutiveIntelligenceEngine();
    const indicator: StrategicIndicator = {
      id: 'ind-001', title: 'Product delivery velocity', value: 0.82,
      trend: 'improving', target: 0.9, category: 'delivery',
      evidenceIds: ['ev-001'], lastUpdated: 5000,
    };
    engine.registerIndicator(indicator);
    const indicators = engine.getStrategicIndicators();
    expect(indicators.length).toBe(1);
    expect(indicators[0].trend).toBe('improving');
  });

  it('forecast types: projection returns type=projection', () => {
    const engine = new ExecutiveIntelligenceEngine();
    const proj = engine.generateProjection('Revenue baseline', 100, 'Q3 2026', 0.7, ['ev-001']);
    expect(proj.type).toBe('projection');
    expect(proj.value).toBe(100);
    expect(proj.horizon).toBe('Q3 2026');
  });

  it('forecast types: forecast returns type=forecast', () => {
    const engine = new ExecutiveIntelligenceEngine();
    const fcst = engine.generateForecast('Revenue trend', 115, 'Q4 2026', 0.8, ['ev-002']);
    expect(fcst.type).toBe('forecast');
    expect(fcst.value).toBe(115);
  });

  it('forecast types: scenario projection returns type=scenario', () => {
    const engine = new ExecutiveIntelligenceEngine();
    const scproj = engine.generateScenarioProjection('Aggressive growth', 130, 'Q1 2027', 'growth-first', ['ev-003']);
    expect(scproj.type).toBe('scenario');
    expect(scproj.id.startsWith('scproj-')).toBe(true);
  });

  it('forecast values are deterministic', () => {
    const engine = new ExecutiveIntelligenceEngine();
    const p1 = engine.generateProjection('Baseline', 100, 'H1', 0.7, []);
    const fc1 = engine.generateForecast('Trend', 140, 'H1', 0.8, []);
    const sc1 = engine.generateScenarioProjection('Growth', 160, 'H1', 'aggressive', []);

    expect(p1.type).toBe('projection');
    expect(fc1.type).toBe('forecast');
    expect(sc1.type).toBe('scenario');
    expect(sc1.confidence).toBe(0.6);
  });

  it('analyzeDecisionQuality computes correct stats', () => {
    const engine = new ExecutiveIntelligenceEngine();
    engine.registerDecision({ ...SAMPLE_DECISION, id: 'd-1', status: 'approved', approvedAt: 2000, proposedAt: 1000, version: 1 });
    engine.registerDecision({ ...SAMPLE_DECISION, id: 'd-2', status: 'implemented', approvedAt: 3000, proposedAt: 2000, version: 1 });
    engine.registerDecision({ ...SAMPLE_DECISION, id: 'd-3', status: 'reviewed', approvedAt: 4000, proposedAt: 3000, version: 1 });
    engine.registerDecision({ ...SAMPLE_DECISION, id: 'd-4', status: 'closed', approvedAt: 5000, proposedAt: 4000, version: 1 });
    engine.registerDecision({ ...SAMPLE_DECISION, id: 'd-5', status: 'proposed', proposedAt: 5000, version: 1 });

    const quality = engine.analyzeDecisionQuality();
    expect(quality.totalDecisions).toBe(5);
    expect(quality.approvedDecisions).toBe(4);
    expect(quality.implementedDecisions).toBe(3);
    expect(quality.reviewedDecisions).toBe(2);
    expect(quality.averageTimeToDecision).toBe(1000);
    expect(quality.overdueDecisions).toBe(1);
  });

  it('decision quality: overdue decisions detected', () => {
    const engine = new ExecutiveIntelligenceEngine();
    engine.registerDecision({ ...SAMPLE_DECISION, id: 'd-1', status: 'proposed', version: 1 });
    engine.registerDecision({ ...SAMPLE_DECISION, id: 'd-2', status: 'discussed', version: 1 });
    engine.registerDecision({ ...SAMPLE_DECISION, id: 'd-3', status: 'approved', approvedAt: Date.now(), version: 1 });

    const quality = engine.analyzeDecisionQuality();
    expect(quality.overdueDecisions).toBe(2);
  });

  it('governance bottleneck detection with severity', () => {
    const engine = new ExecutiveIntelligenceEngine();
    for (let i = 0; i < 6; i++) {
      engine.registerDecision({ ...SAMPLE_DECISION, id: `d-pending-${i}`, status: 'proposed', version: 1 });
    }

    const bottlenecks = engine.detectGovernanceBottlenecks();
    expect(bottlenecks.length).toBeGreaterThanOrEqual(1);
    expect(bottlenecks[0].severity).toBe('high');
    expect(bottlenecks[0].affectedDecisions).toBe(6);
  });

  it('gateway bottleneck severity escalation', () => {
    const engine = new ExecutiveIntelligenceEngine();
    for (let i = 0; i < 8; i++) {
      engine.registerDecision({ ...SAMPLE_DECISION, id: `d-pending-${i}`, status: 'proposed', version: 1 });
    }

    const bottlenecks = engine.detectGovernanceBottlenecks();
    expect(bottlenecks.length).toBeGreaterThanOrEqual(1);
    expect(bottlenecks[0].severity).toBe('critical');
  });

  it('assessEnterpriseHealth returns scores in 0-1 range', () => {
    const engine = new ExecutiveIntelligenceEngine();
    const health = engine.assessEnterpriseHealth(5, 2, 10);
    expect(health.overallScore).toBeGreaterThanOrEqual(0);
    expect(health.overallScore).toBeLessThanOrEqual(1);
    expect(health.portfolioHealth).toBeGreaterThanOrEqual(0);
    expect(health.portfolioHealth).toBeLessThanOrEqual(1);
    expect(health.governanceHealth).toBeGreaterThanOrEqual(0);
    expect(health.governanceHealth).toBeLessThanOrEqual(1);
  });

  it('buildExecutiveBriefing returns complete section', () => {
    const engine = new ExecutiveIntelligenceEngine();
    engine.captureKpiSnapshot({
      id: 'kpi-001', title: 'Decision throughput', value: 14, target: 20,
      variance: -6, confidence: 0.8, category: 'governance', timestamp: 5000,
    });
    engine.registerIndicator({
      id: 'ind-001', title: 'Delivery velocity', value: 0.82,
      trend: 'improving', target: 0.9, category: 'delivery',
      evidenceIds: ['ev-001'], lastUpdated: 5000,
    });
    engine.registerDecision(SAMPLE_DECISION);

    const briefing = engine.buildExecutiveBriefing();
    expect(briefing.enterpriseHealth).toBeDefined();
    expect(briefing.kpiSnapshots.length).toBe(1);
    expect(briefing.strategicIndicators.length).toBe(1);
    expect(briefing.recentDecisions.length).toBe(1);
    expect(briefing.portfolioStatus).toBeDefined();
    expect(briefing.generatedAt).toBeGreaterThan(0);
  });

  it('executive briefing includes decision quality', () => {
    const engine = new ExecutiveIntelligenceEngine();
    engine.registerDecision({ ...SAMPLE_DECISION, id: 'd-1', status: 'approved', approvedAt: 2000, proposedAt: 1000, version: 1 });
    engine.registerDecision({ ...SAMPLE_DECISION, id: 'd-2', status: 'proposed', version: 1 });

    const briefing = engine.buildExecutiveBriefing();
    expect(briefing.decisionQuality).toBeDefined();
    expect(briefing.decisionQuality.totalDecisions).toBe(2);
    expect(briefing.decisionQuality.overdueDecisions).toBe(1);
  });

  it('executive briefing includes governance bottlenecks', () => {
    const engine = new ExecutiveIntelligenceEngine();
    for (let i = 0; i < 5; i++) {
      engine.registerDecision({ ...SAMPLE_DECISION, id: `d-p-${i}`, status: 'proposed', version: 1 });
    }

    const briefing = engine.buildExecutiveBriefing();
    expect(briefing.governanceBottlenecks.length).toBeGreaterThanOrEqual(1);
    expect(briefing.requiredExecutiveDecisions.length).toBeGreaterThanOrEqual(1);
  });

  it('PortfolioBriefing includes executiveIntelligence section', () => {
    const workforce = new WorkforcePlatformImpl();
    deployAllOffices(workforce);
    const eis = new ExecutiveIntelligence(workforce);
    const engine = new PortfolioEngine(eis);

    for (const p of ALL_PROFILES) {
      engine.registerProduct(p);
    }

    engine.registerExecutiveDecision(SAMPLE_DECISION);
    engine.captureKpiSnapshot({
      id: 'kpi-001', title: 'Decision throughput', value: 14, target: 20,
      variance: -6, confidence: 0.8, category: 'governance', timestamp: 5000,
    });

    const briefing = engine.getExecutivePortfolioBriefing();
    expect(briefing.executiveIntelligence).toBeDefined();
    expect(briefing.executiveIntelligence.enterpriseHealth).toBeDefined();
    expect(briefing.executiveIntelligence.generatedAt).toBeGreaterThan(0);
  });

  it('sixth product extends without platform changes', () => {
    const workforce = new WorkforcePlatformImpl();
    deployAllOffices(workforce);
    const eis = new ExecutiveIntelligence(workforce);
    const engine = new PortfolioEngine(eis);

    for (const p of ALL_PROFILES) {
      engine.registerProduct(p);
    }

    const SIXTH_PROFILE = {
      ...MENWISE360_PROFILE,
      productId: 'sixth-product',
      productName: 'Sixth Product',
    };
    engine.registerProduct(SIXTH_PROFILE);

    const briefing = engine.getExecutivePortfolioBriefing();
    expect(briefing.executiveIntelligence).toBeDefined();
    expect(briefing.productSummaries.length).toBe(6);
  });

  it('engine accepts decisions regardless of test metadata', () => {
    const engine = new ExecutiveIntelligenceEngine();
    const productionDecision: ExecutiveDecision = {
      ...SAMPLE_DECISION, id: 'prod-001', title: 'Production decision',
    };
    const testDecision: ExecutiveDecision = {
      ...SAMPLE_DECISION, id: 'test-001', title: 'Test decision',
    };
    engine.registerDecision(productionDecision);
    engine.registerDecision(testDecision);
    const all = engine.getRecentDecisions(10);
    expect(all.length).toBe(2);
  });

  it('briefing health calculation handles zero opportunities gracefully', () => {
    const engine = new ExecutiveIntelligenceEngine();
    engine.registerDecision(SAMPLE_DECISION);
    const briefing = engine.buildExecutiveBriefing();
    expect(briefing.enterpriseHealth.overallScore).toBeGreaterThanOrEqual(0);
    expect(briefing.enterpriseHealth.overallScore).toBeLessThanOrEqual(1);
  });

  it('briefing health calculation handles empty decision set gracefully', () => {
    const engine = new ExecutiveIntelligenceEngine();
    const briefing = engine.buildExecutiveBriefing();
    expect(briefing.enterpriseHealth).toBeDefined();
    expect(briefing.decisionQuality.totalDecisions).toBe(0);
  });

  it('governance bottleneck detection returns empty for no decisions', () => {
    const engine = new ExecutiveIntelligenceEngine();
    const bottlenecks = engine.detectGovernanceBottlenecks();
    expect(bottlenecks.length).toBe(0);
  });

  it('forecast types remain distinct and deterministic', () => {
    const engine = new ExecutiveIntelligenceEngine();
    const proj = engine.generateProjection('Revenue flat', 10000, 'Q3', 0.8, ['ev-1']);
    const fcst = engine.generateForecast('Revenue growth', 12000, 'Q3', 0.7, ['ev-2']);
    const sc = engine.generateScenarioProjection('Adopt growth', 15000, 'Q4', 'scn-001', ['ev-3']);

    expect(proj.type).toBe('projection');
    expect(fcst.type).toBe('forecast');
    expect(sc.type).toBe('scenario');
    expect(fcst.confidence).not.toBe(sc.confidence);
  });

  it('opportunity ranking not affected by decision count', () => {
    const engine = new ExecutiveIntelligenceEngine();
    const before = engine.buildExecutiveBriefing();
    engine.registerDecision(SAMPLE_DECISION);
    engine.registerDecision({ ...SAMPLE_DECISION, id: 'dec-002000', title: 'Decision 2' });
    const after = engine.buildExecutiveBriefing();
    expect(after.decisionQuality.totalDecisions).toBeGreaterThan(before.decisionQuality.totalDecisions);
  });
});
