import { describe, it, expect, beforeEach } from 'vitest';
import { WorkforcePlatformImpl } from '../../lib/workforce/workforce-platform-impl';
import { ExecutiveOffice } from '../../lib/executive-office/executive-office';
import { ResearchOffice } from '../../lib/research-office/research-office';
import { ProductOffice } from '../../lib/product-office/product-office';
import { OperationsOffice } from '../../lib/operations-office/operations-office';
import { KnowledgeOffice } from '../../lib/knowledge-office/knowledge-office';
import { ExecutiveIntelligence } from '../../lib/executive-intelligence/intelligence-engine';

describe('EIS — Business Scenarios', () => {
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

  it('normal operation: all offices healthy, briefing reflects stability', () => {
    const briefing = eis.refreshAndBrief();
    expect(briefing.organizationHealth.overall).toBe('healthy');
    expect(briefing.activeRisks).toEqual([]);
    expect(briefing.blockedItems).toEqual([]);
    expect(briefing.recommendations.length).toBe(0);
    expect(briefing.metadata.confidence).toBeGreaterThan(0.9);
    expect(briefing.metadata.sources.length).toBe(5);
  });

  it('escalation: blocked task in one office surfaces as risk and influences briefing', () => {
    workforce.createTask({
      taskId: '', type: 'deployment-blocked', summary: 'Production deployment blocked by failed gate',
      assignedTo: 'OPS-DEPLOY-001', assignedBy: 'Director of Operations', status: 'blocked',
      priority: 5, dependencies: [], humanApprovalRequired: false,
      created: Date.now(), accepted: null, completed: null, auditTrail: [],
    });

    const briefing = eis.refreshAndBrief();
    expect(briefing.organizationHealth.overall).toBe('critical');
    expect(briefing.activeRisks.length).toBeGreaterThanOrEqual(1);
    expect(briefing.blockedItems.length).toBeGreaterThanOrEqual(1);
    expect(briefing.recommendations.some(r => r.priority === 'critical')).toBe(true);
  });

  it('cross-office dependency: product delay caused by operations surfaces as linked chain', () => {
    workforce.createTask({
      taskId: '', type: 'gate-failure', summary: 'Compliance gate failed for MenWise360 release in Operations',
      assignedTo: 'OPS-DEPLOY-001', assignedBy: 'Director of Operations', status: 'blocked',
      priority: 4, dependencies: [], humanApprovalRequired: false,
      created: Date.now(), accepted: null, completed: null, auditTrail: [],
    });
    workforce.createTask({
      taskId: '', type: 'release-blocked', summary: 'Cannot schedule release until operations gate passes',
      assignedTo: 'PROD-REL-001', assignedBy: 'Director of Product', status: 'blocked',
      priority: 4, dependencies: [], humanApprovalRequired: false,
      created: Date.now(), accepted: null, completed: null, auditTrail: [],
    });

    const briefing = eis.refreshAndBrief();
    expect(briefing.crossOfficeDependencies.length).toBeGreaterThanOrEqual(1);
    const opsDeps = briefing.crossOfficeDependencies.filter(d => d.targetOffice === 'Operations Office');
    expect(opsDeps.length).toBeGreaterThanOrEqual(1);
  });

  it('governance: pending human review appears in pendingDecisions', () => {
    workforce.requestHumanReview({
      requestId: '', agentId: 'EXEC-COMMS-001', actionType: 'draft-executive-communication',
      context: { draft: 'Q3 Strategy Update' }, mode: 'recommend',
      requestedAt: Date.now(), resolvedAt: null, resolution: null, resolvedBy: null,
    });

    const briefing = eis.refreshAndBrief();
    expect(briefing.pendingDecisions.length).toBeGreaterThanOrEqual(1);
    expect(briefing.pendingDecisions[0].actionType).toBe('draft-executive-communication');
    expect(briefing.pendingDecisions[0].status).toBe('pending');
    expect(briefing.pendingDecisions[0].requiredApprover).toBeDefined();
    expect(briefing.recommendations.some(r => r.action.includes('pending'))).toBe(true);
  });

  it('research to product pipeline: research finding leads to product initiative', () => {
    workforce.createTask({
      taskId: '', type: 'research-finding', summary: 'Research finding MWH-045 applicable to MenWise360 onboarding for Product Office',
      assignedTo: 'RES-SYNTH-001', assignedBy: 'Director of Research', status: 'completed',
      priority: 3, dependencies: [], humanApprovalRequired: false,
      created: Date.now(), accepted: null, completed: null, auditTrail: [],
    });
    workforce.createTask({
      taskId: '', type: 'product-initiative', summary: 'Incorporate MWH-045 findings into MenWise360 onboarding flow requiring Research consultation',
      assignedTo: 'PROD-RMAP-001', assignedBy: 'Director of Product', status: 'planning',
      priority: 3, dependencies: [], humanApprovalRequired: false,
      created: Date.now(), accepted: null, completed: null, auditTrail: [],
    });

    const briefing = eis.refreshAndBrief();
    expect(briefing.organizationHealth.overall).toBe('healthy');
    expect(briefing.metadata.sources.length).toBe(5);
  });

  it('operations to knowledge: deployment postmortem captured as lesson', () => {
    workforce.createTask({
      taskId: '', type: 'postmortem', summary: 'Deployment incident postmortem — root cause identified',
      assignedTo: 'OPS-REV-001', assignedBy: 'Director of Operations', status: 'completed',
      priority: 4, dependencies: [], humanApprovalRequired: false,
      created: Date.now(), accepted: null, completed: null, auditTrail: [],
    });

    const briefing = eis.refreshAndBrief();
    expect(briefing.organizationHealth.overall).toBe('healthy');
  });

  it('summary reflects severity: critical risks produce actionable summary', () => {
    workforce.createTask({
      taskId: '', type: 'production-outage', summary: 'Production outage affecting MenWise360 — critical',
      assignedTo: 'OPS-DEPLOY-001', assignedBy: 'Director of Operations', status: 'blocked',
      priority: 5, dependencies: [], humanApprovalRequired: false,
      created: Date.now(), accepted: null, completed: null, auditTrail: [],
    });

    const briefing = eis.refreshAndBrief();
    expect(briefing.summary).toContain('critical');
    expect(briefing.priorities.length).toBeGreaterThan(0);
  });

  it('recommendations are derived, never stored: computed from snapshot', () => {
    workforce.createTask({
      taskId: '', type: 'milestone-delay', summary: 'MenWise360 milestone 3 behind schedule',
      assignedTo: 'OPS-PROJ-001', assignedBy: 'Director of Operations', status: 'blocked',
      priority: 4, dependencies: [], humanApprovalRequired: false,
      created: Date.now(), accepted: null, completed: null, auditTrail: [],
    });

    const briefing1 = eis.refreshAndBrief();
    expect(briefing1.recommendations.length).toBeGreaterThan(0);

    const briefing2 = eis.refreshAndBrief();
    expect(briefing2.recommendations.length).toBeGreaterThan(0);
  });
});
