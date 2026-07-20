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
