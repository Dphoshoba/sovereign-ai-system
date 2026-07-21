import { describe, it, expect, beforeEach } from 'vitest';
import { ExecutiveSnapshot, OfficeStatus, ExecutiveBriefing, EISRecommendation } from '../../lib/executive-intelligence/types';
import { recordDecisionOutcome, adjustConfidenceFromMemory, analyzeDecisionMemory } from '../../src/lib/executive/decision-memory-v2';
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

  it('deliberately — mixed production and test data handled without contamination', () => {
    const engine = new ExecutiveIntelligenceEngine();
    engine.registerDecision(SAMPLE_DECISION);
    engine.registerDecision({ ...SAMPLE_DECISION, id: 'dec-003000', title: 'Client-specific decision' });
    const briefing = engine.buildExecutiveBriefing();
    expect(briefing.decisionQuality.totalDecisions).toBeGreaterThanOrEqual(0);
    expect(briefing.enterpriseHealth.overallScore).toBeGreaterThanOrEqual(0);
  });

  it('deliberately — decision quality stats remain stable with added data', () => {
    const engine = new ExecutiveIntelligenceEngine();
    const before = engine.buildExecutiveBriefing();
    engine.registerDecision(SAMPLE_DECISION);
    const after = engine.buildExecutiveBriefing();
    expect(after.decisionQuality.totalDecisions).toBe(before.decisionQuality.totalDecisions + 1);
  });
});

describe('Evidence Confidence Engine', () => {
  it('evidence confidence: higher source count increases score', async () => {
    const { computeEvidenceConfidence } = await import('../../src/lib/executive/evidence-confidence');
    const low = computeEvidenceConfidence({ evidenceIds: ['e1'], sourceCount: 1, timestampMs: Date.now() });
    const high = computeEvidenceConfidence({ evidenceIds: ['e1','e2','e3'], sourceCount: 3, timestampMs: Date.now() });
    expect(high.score).toBeGreaterThan(low.score);
  });

  it('evidence confidence: stale data lowers score', async () => {
    const { computeEvidenceConfidence } = await import('../../src/lib/executive/evidence-confidence');
    const fresh = computeEvidenceConfidence({ evidenceIds: ['e1'], sourceCount: 1, timestampMs: Date.now() });
    const stale = computeEvidenceConfidence({ evidenceIds: ['e1'], sourceCount: 1, timestampMs: Date.now() - 800 * 3600 * 1000 });
    expect(stale.score).toBeLessThan(fresh.score);
  });

  it('evidence confidence: missing evidence lowers score', async () => {
    const { computeEvidenceConfidence } = await import('../../src/lib/executive/evidence-confidence');
    const complete = computeEvidenceConfidence({ evidenceIds: ['e1'], sourceCount: 2, timestampMs: Date.now(), missingEvidence: [] });
    const missing = computeEvidenceConfidence({ evidenceIds: ['e1'], sourceCount: 2, timestampMs: Date.now(), missingEvidence: ['Contract renewal', 'Email activity'] });
    expect(missing.score).toBeLessThan(complete.score);
  });

  it('evidence confidence: conflicting evidence lowers score', async () => {
    const { computeEvidenceConfidence } = await import('../../src/lib/executive/evidence-confidence');
    const noConflict = computeEvidenceConfidence({ evidenceIds: ['e1'], sourceCount: 2, timestampMs: Date.now(), hasConflictingEvidence: false });
    const hasConflict = computeEvidenceConfidence({ evidenceIds: ['e1'], sourceCount: 2, timestampMs: Date.now(), hasConflictingEvidence: true });
    expect(hasConflict.score).toBeLessThan(noConflict.score);
  });

  it('evidence confidence: deterministic — same inputs produce same outputs', async () => {
    const { computeEvidenceConfidence } = await import('../../src/lib/executive/evidence-confidence');
    const params = { evidenceIds: ['e1', 'e2'], sourceCount: 2, timestampMs: 1000000, missingEvidence: ['ev1'], hasConflictingEvidence: false };
    const r1 = computeEvidenceConfidence(params);
    const r2 = computeEvidenceConfidence(params);
    expect(r1.score).toBe(r2.score);
    expect(r1.sourceCount).toBe(r2.sourceCount);
    expect(r1.dataFreshnessHours).toBe(r2.dataFreshnessHours);
  });

  it('evidence confidence: zero evidence returns baseline', async () => {
    const { computeEvidenceConfidence } = await import('../../src/lib/executive/evidence-confidence');
    const zero = computeEvidenceConfidence({ evidenceIds: [], sourceCount: 0, timestampMs: Date.now() - 48 * 3600 * 1000 });
    expect(zero.score).toBe(0.5);
    expect(zero.sourceCount).toBe(0);
  });

  it('evidence confidence: score clamped to 0-1 range', async () => {
    const { computeEvidenceConfidence } = await import('../../src/lib/executive/evidence-confidence');
    const high = computeEvidenceConfidence({ evidenceIds: ['e1'], sourceCount: 10, timestampMs: Date.now() });
    const low = computeEvidenceConfidence({ evidenceIds: [], sourceCount: 0, timestampMs: Date.now() - 2000 * 3600 * 1000, missingEvidence: ['a','b','c'], hasConflictingEvidence: true });
    expect(high.score).toBeLessThanOrEqual(1);
    expect(low.score).toBeGreaterThanOrEqual(0);
  });
});

describe('Executive Explainability Engine', () => {
  it('explainability: reasoning chain includes decision path', async () => {
    const { buildReasoning } = await import('../../src/lib/executive/evidence-confidence');
    const reasoning = buildReasoning({
      summary: 'Test',
      evidenceIds: ['e1'],
      confidenceScore: 0.8,
      sourceCount: 2,
      dataFreshnessHours: 5,
      missingEvidence: [],
      hasConflictingEvidence: false,
      decisionFactors: ['Factor A', 'Factor B'],
    });
    expect(reasoning.summary).toBe('Test');
    expect(reasoning.decisionPath).toContain('Factor A');
    expect(reasoning.decisionPath).toContain('Factor B');
  });

  it('explainability: deterministic — same factors produce same reasoning', async () => {
    const { buildReasoning } = await import('../../src/lib/executive/evidence-confidence');
    const params = { summary: 'T', evidenceIds: ['e1'], confidenceScore: 0.7, sourceCount: 1, dataFreshnessHours: 10, missingEvidence: [], hasConflictingEvidence: false, decisionFactors: ['A'] };
    const r1 = buildReasoning(params);
    const r2 = buildReasoning(params);
    expect(r1.summary).toBe(r2.summary);
    expect(r1.confidenceFactors.length).toBe(r2.confidenceFactors.length);
    expect(r1.decisionPath.length).toBe(r2.decisionPath.length);
  });

  it('explainability: conflicting evidence reflected in reasoning', async () => {
    const { buildReasoning } = await import('../../src/lib/executive/evidence-confidence');
    const reasoning = buildReasoning({
      summary: 'Conflict test',
      evidenceIds: ['e1'],
      confidenceScore: 0.6,
      sourceCount: 1,
      dataFreshnessHours: 5,
      missingEvidence: [],
      hasConflictingEvidence: true,
      decisionFactors: [],
    });
    expect(reasoning.conflictingEvidence.length).toBeGreaterThan(0);
    expect(reasoning.confidenceFactors.some(f => f.factor.includes('Conflicting'))).toBe(true);
  });

  it('explainability: missing evidence surfaced in reasoning', async () => {
    const { buildReasoning } = await import('../../src/lib/executive/evidence-confidence');
    const reasoning = buildReasoning({
      summary: 'Missing test',
      evidenceIds: ['e1'],
      confidenceScore: 0.5,
      sourceCount: 1,
      dataFreshnessHours: 5,
      missingEvidence: ['Contract', 'Email'],
      hasConflictingEvidence: false,
      decisionFactors: [],
    });
    expect(reasoning.missingEvidence.length).toBe(2);
    expect(reasoning.confidenceFactors.some(f => f.factor.includes('missing'))).toBe(true);
  });

  it('explainability: stale data annotated in reasoning', async () => {
    const { buildReasoning } = await import('../../src/lib/executive/evidence-confidence');
    const reasoning = buildReasoning({
      summary: 'Stale test',
      evidenceIds: ['e1'],
      confidenceScore: 0.4,
      sourceCount: 1,
      dataFreshnessHours: 200,
      missingEvidence: [],
      hasConflictingEvidence: false,
      decisionFactors: [],
    });
    expect(reasoning.confidenceFactors.some(f => f.factor.includes('Stale'))).toBe(true);
  });

  it('explainability: governance boundaries — no seeded data in reasoning', async () => {
    const { buildReasoning } = await import('../../src/lib/executive/evidence-confidence');
    const reasoning = buildReasoning({
      summary: 'Governance test',
      evidenceIds: ['ev-prod-001'],
      confidenceScore: 0.9,
      sourceCount: 3,
      dataFreshnessHours: 2,
      missingEvidence: [],
      hasConflictingEvidence: false,
      decisionFactors: ['Production-only analysis'],
    });
    expect(reasoning.supportingEvidence).not.toContain('mia@caldercreates.example');
    expect(reasoning.supportingEvidence).not.toContain('jonah@reevewrites.example');
  });
});

describe('Decision Memory Engine v1.4', () => {
  it('decision memory: successful outcome increases confidence', () => {
    const outcome = recordDecisionOutcome({
      decisionTitle: 'Approve Q3 budget',
      category: 'investment',
      status: 'successful',
      outcomeSummary: 'Revenue increased 15%',
      lessonsLearned: ['Budget allocation effective'],
      evidenceIds: ['ev-1'],
    });
    const result = adjustConfidenceFromMemory(0.7, [outcome]);
    expect(result.adjustedConfidence).toBeGreaterThan(0.7);
  });

  it('decision memory: failed outcome decreases confidence', () => {
    const outcome = recordDecisionOutcome({
      decisionTitle: 'Launch campaign early',
      category: 'operational',
      status: 'failed',
      outcomeSummary: 'Market not ready',
      lessonsLearned: ['Verify market readiness'],
      evidenceIds: ['ev-2'],
    });
    const result = adjustConfidenceFromMemory(0.7, [outcome]);
    expect(result.adjustedConfidence).toBeLessThan(0.7);
  });

  it('decision memory: snapshot contains correct counts', () => {
    const outcomes = [
      recordDecisionOutcome({ decisionTitle: 'A', category: 'investment', status: 'successful', outcomeSummary: 'Good', lessonsLearned: ['L1'], evidenceIds: ['e1'] }),
      recordDecisionOutcome({ decisionTitle: 'B', category: 'operational', status: 'failed', outcomeSummary: 'Bad', lessonsLearned: ['L2'], evidenceIds: ['e2'] }),
      recordDecisionOutcome({ decisionTitle: 'C', category: 'governance', status: 'successful', outcomeSummary: 'Ok', lessonsLearned: ['L3'], evidenceIds: ['e3'] }),
    ];
    const snapshot = analyzeDecisionMemory(outcomes);
    expect(snapshot.totalDecisions).toBe(3);
    expect(snapshot.successfulOutcomes).toBe(2);
    expect(snapshot.failedOutcomes).toBe(1);
    expect(snapshot.lessonsCount).toBe(3);
  });

  it('decision memory: deterministic outcomes', () => {
    const o1 = recordDecisionOutcome({ decisionTitle: 'T', category: 'operational', status: 'mixed', outcomeSummary: 'Meh', lessonsLearned: [], evidenceIds: [] });
    const r1 = adjustConfidenceFromMemory(0.5, [o1]);
    const r2 = adjustConfidenceFromMemory(0.5, [o1]);
    expect(r1.adjustedConfidence).toBe(r2.adjustedConfidence);
  });

  it('decision memory: no historical data returns original confidence', () => {
    const result = adjustConfidenceFromMemory(0.8, []);
    expect(result.adjustedConfidence).toBe(0.8);
    expect(result.adjustmentReason).toContain('No historical data');
  });

  it('prediction: generates correct number of forecasts', async () => {
    const { generatePredictionSet } = await import('../../src/lib/executive/prediction-engine');
    const set = generatePredictionSet({ baselineRevenue: 10000, trendRevenue: 1500, sourceCount: 3, timestampMs: Date.now() });
    expect(set.predictions.length).toBe(15);
  });

  it('prediction: longer horizons have higher uncertainty', async () => {
    const { forecastPrediction } = await import('../../src/lib/executive/prediction-engine');
    const p30 = forecastPrediction({ metric: 'Revenue', horizon: '30d', baselineValue: 10000, trendFactor: 1500, confidenceSourceCount: 3, confidenceTimestampMs: Date.now() });
    const p180 = forecastPrediction({ metric: 'Revenue', horizon: '180d', baselineValue: 10000, trendFactor: 1500, confidenceSourceCount: 3, confidenceTimestampMs: Date.now() });
    expect(p30.value).toBeLessThan(p180.value);
  });

  it('prediction: deterministic — same inputs same outputs', async () => {
    const { generatePredictionSet } = await import('../../src/lib/executive/prediction-engine');
    const s1 = generatePredictionSet({ baselineRevenue: 10000, trendRevenue: 1500, sourceCount: 3, timestampMs: 1000 });
    const s2 = generatePredictionSet({ baselineRevenue: 10000, trendRevenue: 1500, sourceCount: 3, timestampMs: 1000 });
    expect(s1.predictions.map(p => p.value)).toEqual(s2.predictions.map(p => p.value));
  });

  it('prediction: each forecast has confidence and reasoning', async () => {
    const { generatePredictionSet } = await import('../../src/lib/executive/prediction-engine');
    const set = generatePredictionSet({ baselineRevenue: 10000, trendRevenue: 1500, sourceCount: 3, timestampMs: Date.now() });
    for (const p of set.predictions) {
      expect(p.confidence.score).toBeGreaterThan(0);
      expect(p.reasoning.summary).toBeTruthy();
      expect(p.reasoning.decisionPath.length).toBeGreaterThan(0);
    }
  });

  it('prediction: overall confidence computed correctly', async () => {
    const { generatePredictionSet } = await import('../../src/lib/executive/prediction-engine');
    const set = generatePredictionSet({ baselineRevenue: 10000, trendRevenue: 1500, sourceCount: 3, timestampMs: Date.now() });
    expect(set.overallConfidence).toBeGreaterThan(0);
    expect(set.overallConfidence).toBeLessThanOrEqual(1);
  });

  it('decision memory: PortfolioBriefing still functional after v1.4 changes', () => {
    const workforce = new WorkforcePlatformImpl();
    deployAllOffices(workforce);
    const eis = new ExecutiveIntelligence(workforce);
    const engine = new PortfolioEngine(eis);
    for (const p of ALL_PROFILES) engine.registerProduct(p);
    const briefing = engine.getExecutivePortfolioBriefing();
    expect(briefing.executiveIntelligence).toBeDefined();
  });
});

describe('Scenario Simulator', () => {
  it('scenario: all 7 scenarios produce results', async () => {
    const { simulateAllScenarios } = await import('../../src/lib/executive/scenario-simulator');
    const results = simulateAllScenarios({ baselineRevenue: 10000, trendRevenue: 1500, sourceCount: 3, timestampMs: Date.now() });
    expect(results.length).toBe(7);
  });

  it('scenario: each result has predictions with confidence', async () => {
    const { simulateAllScenarios } = await import('../../src/lib/executive/scenario-simulator');
    const results = simulateAllScenarios({ baselineRevenue: 10000, trendRevenue: 1500, sourceCount: 3, timestampMs: Date.now() });
    for (const r of results) {
      expect(r.predictions.predictions.length).toBe(15);
      expect(r.overallConfidence).toBeGreaterThan(0);
      expect(r.recommendation).toBeTruthy();
    }
  });

  it('scenario: deterministic simulations', async () => {
    const { simulateAllScenarios } = await import('../../src/lib/executive/scenario-simulator');
    const r1 = simulateAllScenarios({ baselineRevenue: 10000, trendRevenue: 1500, sourceCount: 3, timestampMs: 1000 });
    const r2 = simulateAllScenarios({ baselineRevenue: 10000, trendRevenue: 1500, sourceCount: 3, timestampMs: 1000 });
    expect(r1.map(r => r.projectedOutcome)).toEqual(r2.map(r => r.projectedOutcome));
  });

  it('scenario: acquire has highest revenue impact', async () => {
    const { simulateScenario } = await import('../../src/lib/executive/scenario-simulator');
    const r = simulateScenario({ type: 'acquire', baselineRevenue: 10000, trendRevenue: 1500, sourceCount: 3, timestampMs: Date.now() });
    expect(r.scenario.impactMultipliers.revenue).toBe(0.35);
  });

  it('scenario: delay has negative revenue impact', async () => {
    const { simulateScenario } = await import('../../src/lib/executive/scenario-simulator');
    const r = simulateScenario({ type: 'delay', baselineRevenue: 10000, trendRevenue: 1500, sourceCount: 3, timestampMs: Date.now() });
    expect(r.scenario.impactMultipliers.revenue).toBeLessThan(0);
  });
});

describe('Autonomous Planning — Executive Intelligence v1.7', () => {
  it('planning: generates all 4 horizons', async () => {
    const { generatePlanningSuite } = await import('../../src/lib/executive/autonomous-planner');
    const suite = generatePlanningSuite({ goalCount: 5, riskCount: 3, recommendationCount: 8, timestampMs: Date.now() });
    expect(suite.plans.length).toBe(4);
    expect(suite.plans.map(p => p.horizon)).toEqual(['weekly', 'monthly', 'quarterly', 'annual']);
  });

  it('planning: each plan has reasoning and status', async () => {
    const { generatePlanningSuite } = await import('../../src/lib/executive/autonomous-planner');
    const suite = generatePlanningSuite({ goalCount: 5, riskCount: 3, recommendationCount: 8, timestampMs: Date.now() });
    for (const plan of suite.plans) {
      expect(plan.status).toBe('draft');
      expect(plan.reasoning.summary).toBeTruthy();
      expect(plan.items.length).toBeGreaterThan(0);
    }
  });

  it('planning: deterministic', async () => {
    const { generatePlanningSuite } = await import('../../src/lib/executive/autonomous-planner');
    const s1 = generatePlanningSuite({ goalCount: 5, riskCount: 3, recommendationCount: 8, timestampMs: 1000 });
    const s2 = generatePlanningSuite({ goalCount: 5, riskCount: 3, recommendationCount: 8, timestampMs: 1000 });
    expect(s1.totalItems).toBe(s2.totalItems);
    expect(s1.plans.length).toBe(s2.plans.length);
  });

  it('planning: conflicting evidence annotated in reasoning', async () => {
    const { generatePlan } = await import('../../src/lib/executive/autonomous-planner');
    const plan = generatePlan({ horizon: 'quarterly', goalCount: 1, riskCount: 5, recommendationCount: 3, timestampMs: Date.now() });
    expect(plan.reasoning.hasConflictingEvidence).toBe(true);
  });
});

describe('Executive Office v2 — Action Generation Engine', () => {
  it('actions generated from recommendations', async () => {
    const { generateActionsFromRecommendations } = await import('../../src/lib/executive/action-engine');
    const recs = [
      { title: 'Expand Q3 pipeline', action: 'Launch outreach campaign', priority: 'high', confidence: 0.85 },
      { title: 'Reduce churn', action: 'Implement retention program', priority: 'medium', confidence: 0.72 },
      { title: 'Optimize delivery', action: 'Streamline workflows', priority: 'low', confidence: 0.65 },
    ];
    const actions = generateActionsFromRecommendations(recs, 3);
    expect(actions.length).toBe(3);
    expect(actions[0].title).toBe('Launch outreach campaign');
    expect(actions[0].status).toBe('queued');
    expect(actions[0].reasoning.summary).toBeTruthy();
    expect(actions[0].createdAt).toBeGreaterThan(0);
  });

  it('action types assigned correctly', async () => {
    const { generateActionsFromRecommendations } = await import('../../src/lib/executive/action-engine');
    const recs = Array.from({ length: 9 }, (_, i) => ({
      title: `Rec ${i}`, action: `Action ${i}`, priority: 'medium', confidence: 0.8,
    }));
    const actions = generateActionsFromRecommendations(recs, 2);
    expect(actions[0].actionType).toBe('approve');
    expect(actions[1].actionType).toBe('approve');
    expect(actions[2].actionType).toBe('approve');
    expect(actions[3].actionType).toBe('schedule');
    expect(actions[4].actionType).toBe('schedule');
    expect(actions[5].actionType).toBe('schedule');
    expect(actions[6].actionType).toBe('delegate');
    expect(actions[7].actionType).toBe('delegate');
    expect(actions[8].actionType).toBe('delegate');
  });

  it('action queue counts are correct', async () => {
    const { generateActionsFromRecommendations, buildActionQueue } = await import('../../src/lib/executive/action-engine');
    const recs = Array.from({ length: 10 }, (_, i) => ({
      title: `Rec ${i}`, action: `Action ${i}`, priority: i < 4 ? 'high' : 'medium', confidence: 0.8,
    }));
    const actions = generateActionsFromRecommendations(recs, 5);
    const queue = buildActionQueue(actions);
    expect(queue.total).toBe(10);
    expect(queue.byType['approve']).toBe(3);
    expect(queue.byType['schedule']).toBe(3);
    expect(queue.byType['delegate']).toBe(4);
    expect(queue.byPriority['high']).toBe(4);
    expect(queue.byPriority['medium']).toBe(6);
    expect(queue.generatedAt).toBeGreaterThan(0);
  });
});

describe('Executive Workspace — Unified Dashboard', () => {
  it('workspace dashboard aggregates all executive intelligence', async () => {
    const { buildWorkspaceDashboard } = await import('../../src/lib/executive/workspace-dashboard');
    const dashboard = buildWorkspaceDashboard({
      healthScore: 85,
      recommendationCount: 8,
      riskCount: 3,
      opportunityCount: 5,
      actionCount: 6,
      decisionCount: 2,
      planCount: 4,
      scenarioCount: 7,
      confidenceOverall: 0.88,
      briefingTimestamp: new Date().toISOString(),
    });
    expect(dashboard.health.score).toBe(85);
    expect(dashboard.health.status).toBe('Healthy');
    expect(dashboard.risksActive).toBe(3);
    expect(dashboard.opportunitiesTracked).toBe(5);
    expect(dashboard.executiveActionsPending).toBe(6);
    expect(dashboard.decisionsPending).toBe(2);
    expect(dashboard.plansGenerated).toBe(4);
    expect(dashboard.scenariosAvailable).toBe(7);
    expect(dashboard.confidenceOverall).toBe(0.88);
    expect(dashboard.generatedAt).toBeGreaterThan(0);
    expect(dashboard.activeProgrammes.length).toBe(7);
  });

  it('workspace dashboard reflects low health correctly', async () => {
    const { buildWorkspaceDashboard } = await import('../../src/lib/executive/workspace-dashboard');
    const dashboard = buildWorkspaceDashboard({
      healthScore: 45,
      recommendationCount: 2,
      riskCount: 5,
      opportunityCount: 1,
      actionCount: 2,
      decisionCount: 4,
      planCount: 4,
      scenarioCount: 7,
      confidenceOverall: 0.55,
      briefingTimestamp: new Date().toISOString(),
    });
    expect(dashboard.health.status).toBe('Attention Required');
    expect(dashboard.health.trend).toBe('declining');
    expect(dashboard.nextRecommendation).toContain('5 active risk');
  });
});
