import { describe, it, expect } from 'vitest';
import { WorkforcePlatformImpl } from '../../lib/workforce/workforce-platform-impl';
import { ExecutiveOffice } from '../../lib/executive-office/executive-office';
import { ResearchOffice } from '../../lib/research-office/research-office';
import { ProductOffice } from '../../lib/product-office/product-office';
import { OperationsOffice } from '../../lib/operations-office/operations-office';
import { KnowledgeOffice } from '../../lib/knowledge-office/knowledge-office';
import { ExecutiveIntelligence } from '../../lib/executive-intelligence/intelligence-engine';
import { CREATOR_AUTOMATION_PROFILE } from '../../lib/executive-intelligence/product-profile-types';

const INITIATIVE_ID = 'CA-LeadQual-Auto-001';
const CORRELATION_ID = 'corr-ca-leadqual-001';

function deployAllOffices(workforce: WorkforcePlatformImpl): void {
  new ExecutiveOffice(workforce).deploy();
  new ResearchOffice(workforce).deploy();
  new ProductOffice(workforce).deploy();
  new OperationsOffice(workforce).deploy();
  new KnowledgeOffice(workforce).deploy();
}

describe('Creator Automation — Operational Validation', () => {

  it('profile exists with automation-specific field mappings', () => {
    expect(CREATOR_AUTOMATION_PROFILE.productId).toBe('creator-automation');
    expect(CREATOR_AUTOMATION_PROFILE.officeMappings.length).toBe(5);
    expect(CREATOR_AUTOMATION_PROFILE.workflowStageMappings.length).toBe(6);
    expect(CREATOR_AUTOMATION_PROFILE.governanceRequirements).toContain('Automation safety level classification');
    expect(CREATOR_AUTOMATION_PROFILE.adaptionsFromReference.length).toBeGreaterThanOrEqual(3);
  });

  it('full lifecycle: lead qualification automation exercises all 5 offices', () => {
    const workforce = new WorkforcePlatformImpl();
    deployAllOffices(workforce);
    const eis = new ExecutiveIntelligence(workforce);

    // Stage 1: Executive approves the automation initiative
    workforce.createTask({
      taskId: '', type: 'automation-initiative', summary: 'Approve lead qualification automation for Creator Automation',
      assignedTo: 'EXEC-PORT-001', assignedBy: 'CEO', status: 'completed',
      priority: 4, dependencies: [], humanApprovalRequired: false,
      created: Date.now() - 86400000, accepted: null, completed: null, auditTrail: [],
    });
    eis.refreshSnapshot();

    // Stage 2: Research analyzes workflow requirements
    workforce.createTask({
      taskId: '', type: 'workflow-analysis', summary: 'Analyze lead qualification workflow requirements and risks for Creator Automation',
      assignedTo: 'RES-SYNTH-001', assignedBy: 'Director of Research', status: 'completed',
      priority: 3, dependencies: [], humanApprovalRequired: false,
      created: Date.now() - 43200000, accepted: null, completed: null, auditTrail: [],
    });
    eis.refreshSnapshot();

    // Stage 3: Product designs the automation rules
    workforce.createTask({
      taskId: '', type: 'automation-design', summary: 'Design lead qualification automation rules and acceptance criteria for Creator Automation',
      assignedTo: 'PROD-RMAP-001', assignedBy: 'Director of Product', status: 'completed',
      priority: 3, dependencies: [], humanApprovalRequired: false,
      created: Date.now() - 21600000, accepted: null, completed: null, auditTrail: [],
    });
    eis.refreshSnapshot();

    // Stage 4: Operations configures, tests, and deploys the automation
    workforce.createTask({
      taskId: '', type: 'automation-deploy', summary: 'Configure and deploy lead qualification automation in Creator Automation',
      assignedTo: 'OPS-DEPLOY-001', assignedBy: 'Director of Operations', status: 'completed',
      priority: 3, dependencies: [], humanApprovalRequired: false,
      created: Date.now() - 3600000, accepted: null, completed: null, auditTrail: [],
    });
    eis.refreshSnapshot();

    // Stage 5: Knowledge captures reusable template
    workforce.createTask({
      taskId: '', type: 'automation-document', summary: 'Document lead qualification automation as reusable template for Creator Automation',
      assignedTo: 'KNOW-ARCH-001', assignedBy: 'Director of Knowledge', status: 'completed',
      priority: 2, dependencies: [], humanApprovalRequired: false,
      created: Date.now(), accepted: null, completed: null, auditTrail: [],
    });
    const briefing = eis.refreshAndBrief();

    expect(briefing.metadata.sources).toContain('Executive Office');
    expect(briefing.metadata.sources).toContain('Research Office');
    expect(briefing.metadata.sources).toContain('Product Office');
    expect(briefing.metadata.sources).toContain('Operations Office');
    expect(briefing.metadata.sources).toContain('Knowledge Office');
    expect(briefing.organizationHealth.overall).toBe('healthy');
  });

  it('long-running workflow tracked across multiple EIS snapshots', () => {
    const workforce = new WorkforcePlatformImpl();
    deployAllOffices(workforce);
    const eis = new ExecutiveIntelligence(workforce);

    // Automation starts
    workforce.createTask({
      taskId: '', type: 'automation-started', summary: 'Lead qualification automation started — long-running workflow',
      assignedTo: 'OPS-DEPLOY-001', assignedBy: 'Director of Operations', status: 'executing',
      priority: 3, dependencies: [], humanApprovalRequired: false,
      created: Date.now() - 7200000, accepted: null, completed: null, auditTrail: [],
    });
    const briefing1 = eis.refreshAndBrief();
    expect(briefing1.organizationHealth.overall).toBe('healthy');

    // Automation completes after extended execution
    workforce.updateTaskStatus(
      workforce.getAgentTasks('OPS-DEPLOY-001').find(t => t.type === 'automation-started')!.taskId,
      'completed', 'OPS-DEPLOY-001', 'Automation completed successfully'
    );
    const briefing2 = eis.refreshAndBrief();
    expect(briefing2).toBeDefined();
  });

  it('human approval checkpoint pauses automation — governance surfaces in EIS', () => {
    const workforce = new WorkforcePlatformImpl();
    deployAllOffices(workforce);
    const eis = new ExecutiveIntelligence(workforce);

    // Automation configured, awaiting safety review
    workforce.createTask({
      taskId: '', type: 'automation-configured', summary: 'Lead qualification automation configured awaiting safety approval',
      assignedTo: 'OPS-DEPLOY-001', assignedBy: 'Director of Operations', status: 'completed',
      priority: 3, dependencies: [], humanApprovalRequired: false,
      created: Date.now(), accepted: null, completed: null, auditTrail: [],
    });

    // Human approval checkpoint for automation safety level
    workforce.requestHumanReview({
      requestId: '', agentId: 'EXEC-RISK-001', actionType: 'automation-safety-review',
      context: { automation: 'Lead qualification', product: 'Creator Automation', safetyLevel: 'approval_required' },
      mode: 'stop', requestedAt: Date.now(), resolvedAt: null, resolution: null, resolvedBy: null,
    });

    // Automation blocked pending approval
    workforce.createTask({
      taskId: '', type: 'automation-paused', summary: 'Lead qualification automation paused — awaiting safety review for Creator Automation',
      assignedTo: 'OPS-DEPLOY-001', assignedBy: 'Director of Operations', status: 'blocked',
      priority: 4, dependencies: [], humanApprovalRequired: false,
      created: Date.now(), accepted: null, completed: null, auditTrail: [],
    });

    const briefing = eis.refreshAndBrief();

    expect(briefing.pendingDecisions.length).toBeGreaterThanOrEqual(1);
    expect(briefing.pendingDecisions.some(d => d.actionType === 'automation-safety-review')).toBe(true);

    // Higher priority from blocked automation
    expect(briefing.structuredRecommendations.length).toBeGreaterThanOrEqual(1);

    // Resolve checkpoint
    workforce.getPendingHumanReviews().forEach(r => {
      workforce.resolveHumanReview(r.requestId, 'approved', 'Chief Risk Officer');
    });

    const briefing2 = eis.refreshAndBrief();
    expect(briefing2.pendingDecisions.length).toBe(0);
  });

  it('exception handling: automation failure surfaces as risk and recommendation', () => {
    const workforce = new WorkforcePlatformImpl();
    deployAllOffices(workforce);
    const eis = new ExecutiveIntelligence(workforce);

    // Automation encounters failure
    workforce.createTask({
      taskId: '', type: 'automation-failure', summary: 'Lead qualification automation failed — retry threshold exceeded — critical',
      assignedTo: 'OPS-DEPLOY-001', assignedBy: 'Director of Operations', status: 'blocked',
      priority: 5, dependencies: [], humanApprovalRequired: false,
      created: Date.now(), accepted: null, completed: null, auditTrail: [],
    });

    const briefing = eis.refreshAndBrief();

    // Risk surfaced
    expect(briefing.activeRisks.length).toBeGreaterThanOrEqual(1);
    expect(briefing.activeRisks.some(r => r.severity === 'critical')).toBe(true);

    // EDSS recommends intervention
    expect(briefing.structuredRecommendations.length).toBeGreaterThanOrEqual(1);
    expect(briefing.organizationHealth.overall).toBe('critical');
  });

  it('delta captures state changes across automation lifecycle', () => {
    const workforce = new WorkforcePlatformImpl();
    deployAllOffices(workforce);
    const eis = new ExecutiveIntelligence(workforce);

    // Initial state: automation approved
    workforce.createTask({
      taskId: '', type: 'automation-approved', summary: 'Lead qualification automation approved for Creator Automation',
      assignedTo: 'EXEC-PORT-001', assignedBy: 'CEO', status: 'completed',
      priority: 4, dependencies: [], humanApprovalRequired: false,
      created: Date.now() - 86400000, accepted: null, completed: null, auditTrail: [],
    });
    eis.refreshSnapshot();

    // Later: automation blocked
    workforce.createTask({
      taskId: '', type: 'automation-blocked', summary: 'Lead qualification automation blocked by compliance check — critical',
      assignedTo: 'OPS-DEPLOY-001', assignedBy: 'Director of Operations', status: 'blocked',
      priority: 5, dependencies: [], humanApprovalRequired: false,
      created: Date.now(), accepted: null, completed: null, auditTrail: [],
    });
    eis.refreshSnapshot();

    const delta = eis.getDelta();
    expect(delta).not.toBeNull();
    if (delta) {
      expect(delta.summary).not.toBe('No material changes detected');
      expect(delta.newBlockers.length).toBeGreaterThanOrEqual(1);
    }
  });
});
