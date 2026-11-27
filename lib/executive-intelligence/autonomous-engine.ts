import {
  PolicyRule, ApprovalRequest, ExecutionPlan, ExecutionStep, ExecutionPackage,
  AuditRecord, SimulationResult, AutonomousEnterpriseBriefing,
  AuditEventType, ApprovalStatus, ExecutionStatus, PackageStatus,
} from './autonomous-types';

let policyCounter = 0;
let approvalCounter = 0;
let planCounter = 0;
let packageCounter = 0;
let auditCounter = 0;
let simulationCounter = 0;

export class AutonomousEnterpriseEngine {
  private policies: Map<string, PolicyRule[]> = new Map();
  private approvals: Map<string, ApprovalRequest> = new Map();
  private plans: Map<string, ExecutionPlan> = new Map();
  private packages: Map<string, ExecutionPackage> = new Map();
  private auditTrail: AuditRecord[] = [];
  private simulations: SimulationResult[] = [];

  registerPolicy(policy: PolicyRule): void {
    if (!this.policies.has(policy.id)) this.policies.set(policy.id, []);
    const existing = this.policies.get(policy.id)!;
    if (!existing.find(p => p.version === policy.version)) {
      existing.push(policy);
    }
  }

  getPolicy(id: string, version?: number): PolicyRule | undefined {
    const versions = this.policies.get(id);
    if (!versions) return undefined;
    if (version !== undefined) return versions.find(p => p.version === version);
    return versions.reduce((latest, p) => p.version > latest.version ? p : latest, versions[0]);
  }

  getAllPolicies(): PolicyRule[] {
    const result: PolicyRule[] = [];
    for (const v of this.policies.values()) result.push(...v);
    return result;
  }

  evaluateAction(actionId: string): { allowed: boolean; requiresApproval: boolean; policyId: string } {
    for (const [policyId, versions] of this.policies) {
      const latest = versions.reduce((max, p) => p.version > max.version ? p : max, versions[0]);
      if (latest.action === 'prohibited') {
        return { allowed: false, requiresApproval: false, policyId };
      }
    }
    for (const [policyId, versions] of this.policies) {
      const latest = versions.reduce((max, p) => p.version > max.version ? p : max, versions[0]);
      if (latest.action === 'allowable' && latest.requiresApproval) {
        return { allowed: true, requiresApproval: true, policyId };
      }
    }
    return { allowed: true, requiresApproval: false, policyId: '' };
  }

  submitApprovalRequest(request: ApprovalRequest): void {
    this.approvals.set(request.id, { ...request, delegationChain: [...request.delegationChain], evidenceIds: [...request.evidenceIds] });
    this.recordAuditEvent({
      packageId: request.id,
      eventType: 'approval_requested',
      timestamp: Date.now(),
      actor: request.requestedBy,
      details: `Approval requested for ${request.actionId} under policy ${request.policyId}`,
      evidenceIds: request.evidenceIds,
    });
  }

  approve(id: string, approver: string): ApprovalRequest | null {
    const request = this.approvals.get(id);
    if (!request) return null;
    if (request.status !== 'pending') return null;
    request.status = 'approved';
    request.approvedBy = approver;
    request.approvedAt = Date.now();
    this.approvals.set(id, request);
    this.recordAuditEvent({
      packageId: id,
      eventType: 'approval_granted',
      timestamp: Date.now(),
      actor: approver,
      details: `Approval granted for ${request.actionId}`,
      evidenceIds: request.evidenceIds,
    });
    return request;
  }

  reject(id: string, approver: string, reason: string): ApprovalRequest | null {
    const request = this.approvals.get(id);
    if (!request) return null;
    if (request.status !== 'pending') return null;
    request.status = 'rejected';
    request.rejectedBy = approver;
    request.rejectedAt = Date.now();
    request.rejectionReason = reason;
    this.approvals.set(id, request);
    this.recordAuditEvent({
      packageId: id,
      eventType: 'approval_denied',
      timestamp: Date.now(),
      actor: approver,
      details: `Approval denied for ${request.actionId}: ${reason}`,
      evidenceIds: request.evidenceIds,
    });
    return request;
  }

  getPendingApprovals(): ApprovalRequest[] {
    return Array.from(this.approvals.values()).filter(r => r.status === 'pending');
  }

  getApprovalRequest(id: string): ApprovalRequest | undefined {
    return this.approvals.get(id);
  }

  createExecutionPlan(title: string, steps: ExecutionStep[], policyId: string): ExecutionPlan {
    const id = `plan-${++planCounter}`;
    const plan: ExecutionPlan = {
      id,
      title,
      description: '',
      steps,
      policyId,
      approvalRequestId: '',
      status: 'draft',
      evidenceIds: [],
    };
    this.plans.set(id, plan);
    return plan;
  }

  finalizePlan(planId: string): ExecutionPlan | null {
    const plan = this.plans.get(planId);
    if (!plan) return null;
    plan.status = 'proposed';
    this.plans.set(planId, plan);
    return plan;
  }

  getExecutionPlan(planId: string): ExecutionPlan | undefined {
    return this.plans.get(planId);
  }

  getAllPlans(): ExecutionPlan[] {
    return Array.from(this.plans.values());
  }

  getPendingExecutions(): ExecutionPlan[] {
    return Array.from(this.plans.values()).filter(
      p => p.status === 'draft' || p.status === 'proposed' || p.status === 'approved'
    );
  }

  generateExecutionPackage(planId: string, policyId: string, approvalId: string): ExecutionPackage | null {
    const plan = this.plans.get(planId);
    if (!plan) return null;

    const approval = this.approvals.get(approvalId);
    if (!approval) return null;

    const policyLatest = this.getPolicy(policyId);
    if (!policyLatest) return null;

    if (!plan.rollbackStrategy || plan.rollbackStrategy.trim() === '') return null;

    const id = `pkg-${++packageCounter}`;
    const auditId = `audit-${++auditCounter}`;

    const pkg: ExecutionPackage = Object.freeze({
      id,
      planId,
      steps: Object.freeze(plan.steps.map(s => Object.freeze({ ...s }))),
      originatingEvidence: [...policyLatest.evidenceRequirements],
      governingPolicy: policyLatest.description,
      approvalChain: [...approval.delegationChain, approval.requestedBy, approval.approvedBy ?? 'system'],
      expectedOutcome: plan.expectedOutcome ?? '',
      rollbackStrategy: plan.rollbackStrategy ?? '',
      auditId,
      status: 'pending' as PackageStatus,
      createdAt: Date.now(),
    }) as ExecutionPackage;

    this.packages.set(id, pkg);
    return pkg;
  }

  getExecutionPackage(id: string): ExecutionPackage | undefined {
    return this.packages.get(id);
  }

  getAllPackages(): ExecutionPackage[] {
    return Array.from(this.packages.values());
  }

  recordAuditEvent(event: Omit<AuditRecord, 'id'>): void {
    const record: AuditRecord = {
      ...event,
      id: `audit-${++auditCounter}`,
    };
    this.auditTrail.push(record);
  }

  getRecentAuditTrail(count: number): AuditRecord[] {
    return [...this.auditTrail]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, count);
  }

  simulateExecution(planId: string): SimulationResult | null {
    const plan = this.plans.get(planId);
    if (!plan) return null;

    const affectedSystems = plan.steps.map(s => s.connectorType);
    const risksIdentified: string[] = [];
    const policyViolations: string[] = [];

    const policy = this.getPolicy(plan.policyId);
    if (policy && policy.action === 'prohibited') {
      policyViolations.push(`Policy ${policy.id} prohibits this action`);
    }

    if (plan.steps.length === 0) {
      risksIdentified.push('Plan has no execution steps');
    }

    const rollbackStep = plan.steps.find(s => s.rollbackStep);
    if (!rollbackStep) {
      risksIdentified.push('No rollback step defined in execution steps');
    }

    const id = `sim-${++simulationCounter}`;
    const result: SimulationResult = {
      id,
      planId,
      scenarioDescription: `Simulation of plan ${plan.title}`,
      outcomeDescription: policyViolations.length > 0
        ? 'Plan would violate active policies'
        : risksIdentified.length > 0
          ? 'Plan has identified risks that should be addressed'
          : 'Plan appears executable without conflicts',
      affectedSystems,
      risksIdentified,
      policyViolations,
      confidence: plan.steps.length > 0 ? 0.8 : 0.1,
      timestamp: Date.now(),
    };

    this.simulations.push(result);
    this.recordAuditEvent({
      packageId: planId,
      eventType: 'simulation_ran',
      timestamp: Date.now(),
      actor: 'simulation-engine',
      details: `Simulation ${id} completed for plan ${planId}`,
      evidenceIds: [],
    });

    return result;
  }

  getSimulationResults(): SimulationResult[] {
    return [...this.simulations];
  }

  buildAutonomousBriefing(): AutonomousEnterpriseBriefing {
    const allPolicies = this.getAllPolicies();
    const latestPolicies = new Map<string, PolicyRule>();
    for (const p of allPolicies) {
      const exist = latestPolicies.get(p.id);
      if (!exist || p.version > exist.version) {
        latestPolicies.set(p.id, p);
      }
    }
    const uniqueActive = Array.from(latestPolicies.values()).filter(p => p.status === 'active').length;
    const uniqueSuperseded = Array.from(latestPolicies.values()).filter(p => p.status === 'superseded').length;

    const policyCompliance = allPolicies.length > 0
      ? uniqueActive / (uniqueActive + uniqueSuperseded)
      : 1;

    return {
      policySummary: {
        totalPolicies: latestPolicies.size,
        activePolicies: uniqueActive,
        supersededPolicies: uniqueSuperseded,
      },
      pendingApprovals: this.getPendingApprovals(),
      pendingExecutions: this.getPendingExecutions(),
      recentAuditTrail: this.getRecentAuditTrail(10),
      simulationResults: this.getSimulationResults(),
      policyCompliance: Math.round(policyCompliance * 100) / 100,
      generatedAt: Date.now(),
    };
  }
}
