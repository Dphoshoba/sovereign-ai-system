import { describe, it, expect } from 'vitest';
import { WorkforcePlatformImpl } from '../../lib/workforce/workforce-platform-impl';
import { ExecutiveOffice } from '../../lib/executive-office/executive-office';
import { ResearchOffice } from '../../lib/research-office/research-office';
import { ProductOffice } from '../../lib/product-office/product-office';
import { OperationsOffice } from '../../lib/operations-office/operations-office';
import { KnowledgeOffice } from '../../lib/knowledge-office/knowledge-office';
import { ExecutiveIntelligence } from '../../lib/executive-intelligence/intelligence-engine';
import { VISIONCRAFT_STUDIO_PROFILE } from '../../lib/executive-intelligence/product-profile-types';

const INITIATIVE_ID = 'VCS-BrandCampaign-001';
const CORRELATION_ID = 'corr-vcs-campaign-001';

function deployAllOffices(workforce: WorkforcePlatformImpl): void {
  new ExecutiveOffice(workforce).deploy();
  new ResearchOffice(workforce).deploy();
  new ProductOffice(workforce).deploy();
  new OperationsOffice(workforce).deploy();
  new KnowledgeOffice(workforce).deploy();
}

describe('VisionCraft Studio — Operational Validation', () => {

  it('profile exists with creative production field mappings', () => {
    expect(VISIONCRAFT_STUDIO_PROFILE.productId).toBe('visioncraft-studio');
    expect(VISIONCRAFT_STUDIO_PROFILE.officeMappings.length).toBe(5);
    expect(VISIONCRAFT_STUDIO_PROFILE.workflowStageMappings.length).toBe(6);
    expect(VISIONCRAFT_STUDIO_PROFILE.governanceRequirements).toContain('Brand compliance review');
    expect(VISIONCRAFT_STUDIO_PROFILE.adaptionsFromReference.length).toBeGreaterThanOrEqual(3);
  });

  it('full lifecycle: branded campaign exercises all 5 offices', () => {
    const workforce = new WorkforcePlatformImpl();
    deployAllOffices(workforce);
    const eis = new ExecutiveIntelligence(workforce);

    // Stage 1: Executive approves Q3 brand campaign
    workforce.createTask({
      taskId: '', type: 'campaign-approval', summary: 'Approve Q3 brand campaign for VisionCraft Studio',
      assignedTo: 'EXEC-PORT-001', assignedBy: 'CEO', status: 'completed',
      priority: 4, dependencies: [], humanApprovalRequired: false,
      created: Date.now() - 86400000, accepted: null, completed: null, auditTrail: [],
    });
    eis.refreshSnapshot();

    // Stage 2: Research gathers creative references
    workforce.createTask({
      taskId: '', type: 'creative-research', summary: 'Gather design references and audience research for Q3 campaign',
      assignedTo: 'RES-COL-001', assignedBy: 'Director of Research', status: 'completed',
      priority: 3, dependencies: [], humanApprovalRequired: false,
      created: Date.now() - 43200000, accepted: null, completed: null, auditTrail: [],
    });
    eis.refreshSnapshot();

    // Stage 3: Product defines creative brief
    workforce.createTask({
      taskId: '', type: 'creative-brief', summary: 'Define creative brief and acceptance criteria for Q3 brand campaign',
      assignedTo: 'PROD-RMAP-001', assignedBy: 'Director of Product', status: 'completed',
      priority: 3, dependencies: [], humanApprovalRequired: false,
      created: Date.now() - 21600000, accepted: null, completed: null, auditTrail: [],
    });
    eis.refreshSnapshot();

    // Stage 4: Operations produces and publishes assets
    workforce.createTask({
      taskId: '', type: 'asset-production', summary: 'Produce and render brand assets for Q3 campaign',
      assignedTo: 'OPS-DEPLOY-001', assignedBy: 'Director of Operations', status: 'completed',
      priority: 3, dependencies: [], humanApprovalRequired: false,
      created: Date.now() - 3600000, accepted: null, completed: null, auditTrail: [],
    });
    eis.refreshSnapshot();

    // Stage 5: Knowledge catalogues assets
    workforce.createTask({
      taskId: '', type: 'asset-catalogue', summary: 'Catalogue Q3 campaign assets and document design patterns',
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

  it('creative review cycle: blocked asset surfaces as ranked priority', () => {
    const workforce = new WorkforcePlatformImpl();
    deployAllOffices(workforce);
    const eis = new ExecutiveIntelligence(workforce);

    // Assets produced, awaiting creative review
    workforce.createTask({
      taskId: '', type: 'assets-ready', summary: 'Brand assets rendered awaiting creative review for VisionCraft Studio',
      assignedTo: 'OPS-DEPLOY-001', assignedBy: 'Director of Operations', status: 'completed',
      priority: 3, dependencies: [], humanApprovalRequired: false,
      created: Date.now(), accepted: null, completed: null, auditTrail: [],
    });

    // Creative review blocked
    workforce.createTask({
      taskId: '', type: 'review-blocked', summary: 'Creative review blocked — design direction clarification needed for VisionCraft campaign',
      assignedTo: 'OPS-DEPLOY-001', assignedBy: 'Director of Operations', status: 'blocked',
      priority: 4, dependencies: [], humanApprovalRequired: false,
      created: Date.now(), accepted: null, completed: null, auditTrail: [],
    });

    const briefing = eis.refreshAndBrief();

    expect(briefing.rankedPriorities.length).toBeGreaterThanOrEqual(1);
    expect(briefing.blockedItems.length).toBeGreaterThanOrEqual(1);
    expect(briefing.structuredRecommendations.length).toBeGreaterThanOrEqual(1);

    const blocker = briefing.blockedItems.find(b => b.office === 'Operations Office');
    expect(blocker).toBeDefined();
  });

  it('brand compliance: governance pause surfaces in EIS pending decisions', () => {
    const workforce = new WorkforcePlatformImpl();
    deployAllOffices(workforce);
    const eis = new ExecutiveIntelligence(workforce);

    // Campaign ready for brand review
    workforce.createTask({
      taskId: '', type: 'campaign-ready', summary: 'Q3 campaign assets complete pending brand compliance review',
      assignedTo: 'OPS-DEPLOY-001', assignedBy: 'Director of Operations', status: 'completed',
      priority: 3, dependencies: [], humanApprovalRequired: false,
      created: Date.now(), accepted: null, completed: null, auditTrail: [],
    });

    // Brand compliance checkpoint
    workforce.requestHumanReview({
      requestId: '', agentId: 'EXEC-COMMS-001', actionType: 'brand-compliance-review',
      context: { campaign: 'Q3 Brand Campaign', product: 'VisionCraft Studio', check: 'Brand guideline adherence' },
      mode: 'stop', requestedAt: Date.now(), resolvedAt: null, resolution: null, resolvedBy: null,
    });

    // Publication blocked pending compliance
    workforce.createTask({
      taskId: '', type: 'publication-blocked', summary: 'Campaign publication blocked pending brand compliance — critical',
      assignedTo: 'OPS-DEPLOY-001', assignedBy: 'Director of Operations', status: 'blocked',
      priority: 5, dependencies: [], humanApprovalRequired: false,
      created: Date.now(), accepted: null, completed: null, auditTrail: [],
    });

    const briefing = eis.refreshAndBrief();

    expect(briefing.pendingDecisions.length).toBeGreaterThanOrEqual(1);
    expect(briefing.pendingDecisions.some(d => d.actionType === 'brand-compliance-review')).toBe(true);
    expect(briefing.activeRisks.length).toBeGreaterThanOrEqual(1);

    // Resolve compliance
    workforce.getPendingHumanReviews().forEach(r => {
      workforce.resolveHumanReview(r.requestId, 'approved', 'Brand Director');
    });

    const briefing2 = eis.refreshAndBrief();
    expect(briefing2.pendingDecisions.length).toBe(0);
  });

  it('delta captures state changes across campaign lifecycle', () => {
    const workforce = new WorkforcePlatformImpl();
    deployAllOffices(workforce);
    const eis = new ExecutiveIntelligence(workforce);

    // Initial state: campaign approved
    workforce.createTask({
      taskId: '', type: 'campaign-approved', summary: 'Q3 brand campaign approved for VisionCraft Studio',
      assignedTo: 'EXEC-PORT-001', assignedBy: 'CEO', status: 'completed',
      priority: 4, dependencies: [], humanApprovalRequired: false,
      created: Date.now() - 86400000, accepted: null, completed: null, auditTrail: [],
    });
    eis.refreshSnapshot();

    // Later: rendering blocked
    workforce.createTask({
      taskId: '', type: 'rendering-blocked', summary: 'Asset rendering blocked by rendering pipeline failure — critical',
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
