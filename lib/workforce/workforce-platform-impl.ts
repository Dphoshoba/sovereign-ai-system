import {
  WorkforcePlatform,
  AgentIdentity, AgentStatus,
  Skill, AgentSkillAssignment,
  WorkforceMessage, MessageType,
  Task, TaskStatus, AuditEntry,
  CollaborationRule, HumanCollaborationRequest,
  AgentMetrics, PerformanceGoal,
  WorkforcePolicy, WorkforcePolicyEffect, AgentLifecycleEvent,
} from './workforce-platform';
import { WorkforcePlatformError } from './types';
export * from './types';

let msgCounter = 0;
let taskCounter = 0;
let reviewCounter = 0;
let eventCounter = 0;

function nextMsgId(): string { return `msg-${++msgCounter}-${Date.now()}`; }
function nextTaskId(): string { return `task-${++taskCounter}-${Date.now()}`; }
function nextReviewId(): string { return `review-${++reviewCounter}-${Date.now()}`; }
function nextEventId(): string { return `evt-${++eventCounter}-${Date.now()}`; }

export class WorkforcePlatformImpl implements WorkforcePlatform {
  // ── Workstream A: Identity ──
  private agents = new Map<string, AgentIdentity>();

  registerAgent(identity: AgentIdentity): void {
    if (this.agents.has(identity.agentId)) throw new WorkforcePlatformError(`Agent already registered: ${identity.agentId}`);
    this.agents.set(identity.agentId, { ...identity, createdAt: Date.now(), updatedAt: Date.now() });
  }

  getAgent(agentId: string): AgentIdentity | undefined { return this.agents.get(agentId); }

  updateAgentStatus(agentId: string, status: AgentStatus): void {
    const agent = this.agents.get(agentId);
    if (!agent) throw new WorkforcePlatformError(`Agent not found: ${agentId}`);
    agent.status = status;
    agent.updatedAt = Date.now();
  }

  updateAgentManager(agentId: string, manager: string): void {
    const agent = this.agents.get(agentId);
    if (!agent) throw new WorkforcePlatformError(`Agent not found: ${agentId}`);
    agent.manager = manager;
    agent.updatedAt = Date.now();
  }

  listAgentsByOffice(office: string): readonly AgentIdentity[] {
    return [...this.agents.values()].filter(a => a.office === office);
  }

  listAllAgents(): readonly AgentIdentity[] { return [...this.agents.values()]; }

  // ── Workstream B: Skills ──
  private skills = new Map<string, Skill>();
  private agentSkills = new Map<string, AgentSkillAssignment[]>();

  registerSkill(skill: Skill): void {
    if (this.skills.has(skill.skillId)) throw new WorkforcePlatformError(`Skill already registered: ${skill.skillId}`);
    this.skills.set(skill.skillId, skill);
  }

  getSkill(skillId: string): Skill | undefined { return this.skills.get(skillId); }

  assignSkillToAgent(agentId: string, skillId: string, proficiency: number): void {
    if (!this.agents.has(agentId)) throw new WorkforcePlatformError(`Agent not found: ${agentId}`);
    if (!this.skills.has(skillId)) throw new WorkforcePlatformError(`Skill not found: ${skillId}`);
    const assignments = this.agentSkills.get(agentId) || [];
    assignments.push({ agentId, skillId, proficiency, assignedAt: Date.now(), expiresAt: null });
    this.agentSkills.set(agentId, assignments);
  }

  removeSkillFromAgent(agentId: string, skillId: string): void {
    const assignments = this.agentSkills.get(agentId);
    if (!assignments) throw new WorkforcePlatformError(`No skills for agent: ${agentId}`);
    this.agentSkills.set(agentId, assignments.filter(a => a.skillId !== skillId));
  }

  getAgentSkills(agentId: string): readonly AgentSkillAssignment[] {
    return this.agentSkills.get(agentId) || [];
  }

  findAgentsBySkill(skillId: string, minProficiency: number): readonly string[] {
    const result: string[] = [];
    for (const [agentId, assignments] of this.agentSkills) {
      if (assignments.some(a => a.skillId === skillId && a.proficiency >= minProficiency)) {
        result.push(agentId);
      }
    }
    return result;
  }

  listAllSkills(): readonly Skill[] { return [...this.skills.values()]; }

  // ── Workstream C: Communications ──
  private messages: WorkforceMessage[] = [];

  sendMessage(message: WorkforceMessage): void {
    const msg: WorkforceMessage = {
      ...message,
      messageId: message.messageId || nextMsgId(),
      timestamp: message.timestamp || Date.now(),
    };
    this.messages.push(msg);
  }

  getAgentInbox(agentId: string): readonly WorkforceMessage[] {
    return this.messages.filter(m => m.recipient === agentId);
  }

  getAgentOutbox(agentId: string): readonly WorkforceMessage[] {
    return this.messages.filter(m => m.sender === agentId);
  }

  getConversation(correlationId: string): readonly WorkforceMessage[] {
    return this.messages.filter(m => m.correlationId === correlationId);
  }

  getConversationByType(agentId: string, type: MessageType): readonly WorkforceMessage[] {
    return this.messages.filter(m => (m.sender === agentId || m.recipient === agentId) && m.type === type);
  }

  // ── Workstream D: Task Lifecycle ──
  private tasks = new Map<string, Task>();

  createTask(task: Task): void {
    const t: Task = { ...task, taskId: task.taskId || nextTaskId(), auditTrail: [] };
    if (this.tasks.has(t.taskId)) throw new WorkforcePlatformError(`Task already exists: ${t.taskId}`);
    t.auditTrail.push({ action: 'created', agentId: t.assignedBy, timestamp: Date.now(), detail: t.summary });
    this.tasks.set(t.taskId, t);
  }

  acceptTask(taskId: string, agentId: string): void {
    const task = this.tasks.get(taskId);
    if (!task) throw new WorkforcePlatformError(`Task not found: ${taskId}`);
    task.status = 'accepted';
    task.accepted = Date.now();
    task.auditTrail.push({ action: 'accepted', agentId, timestamp: Date.now(), detail: '' });
  }

  updateTaskStatus(taskId: string, status: TaskStatus, agentId: string, detail: string): void {
    const task = this.tasks.get(taskId);
    if (!task) throw new WorkforcePlatformError(`Task not found: ${taskId}`);
    task.status = status;
    if (status === 'completed') task.completed = Date.now();
    task.auditTrail.push({ action: status, agentId, timestamp: Date.now(), detail });
  }

  getTask(taskId: string): Task | undefined { return this.tasks.get(taskId); }

  getAgentTasks(agentId: string): readonly Task[] {
    return [...this.tasks.values()].filter(t => t.assignedTo === agentId);
  }

  getTasksByStatus(status: TaskStatus): readonly Task[] {
    return [...this.tasks.values()].filter(t => t.status === status);
  }

  // ── Workstream E: Human Collaboration ──
  private collabRules = new Map<string, CollaborationRule>();
  private humanReviews = new Map<string, HumanCollaborationRequest>();

  setCollaborationRule(rule: CollaborationRule): void {
    this.collabRules.set(rule.actionType, rule);
  }

  getCollaborationMode(actionType: string): CollaborationRule | undefined {
    return this.collabRules.get(actionType);
  }

  requestHumanReview(request: HumanCollaborationRequest): void {
    const r: HumanCollaborationRequest = {
      ...request,
      requestId: request.requestId || nextReviewId(),
      requestedAt: Date.now(),
      resolvedAt: null,
      resolution: null,
      resolvedBy: null,
    };
    this.humanReviews.set(r.requestId, r);
  }

  resolveHumanReview(requestId: string, resolution: HumanCollaborationRequest['resolution'], resolvedBy: string): void {
    const review = this.humanReviews.get(requestId);
    if (!review) throw new WorkforcePlatformError(`Review not found: ${requestId}`);
    if (review.resolvedAt) throw new WorkforcePlatformError(`Review already resolved: ${requestId}`);
    review.resolution = resolution;
    review.resolvedAt = Date.now();
    review.resolvedBy = resolvedBy;
  }

  getPendingHumanReviews(agentId?: string): readonly HumanCollaborationRequest[] {
    return [...this.humanReviews.values()].filter(r => !r.resolvedAt && (!agentId || r.agentId === agentId));
  }

  getHumanReviewHistory(agentId: string): readonly HumanCollaborationRequest[] {
    return [...this.humanReviews.values()].filter(r => r.agentId === agentId);
  }

  // ── Workstream F: Performance ──
  private metricsStore = new Map<string, AgentMetrics[]>();
  private goals = new Map<string, PerformanceGoal[]>();

  recordMetrics(metrics: AgentMetrics): void {
    const list = this.metricsStore.get(metrics.agentId) || [];
    list.push(metrics);
    this.metricsStore.set(metrics.agentId, list);
  }

  getAgentMetrics(agentId: string, periodStart: number, periodEnd: number): AgentMetrics | undefined {
    const list = this.metricsStore.get(agentId);
    if (!list || list.length === 0) return undefined;
    const candidates = list.filter(m => m.periodStart >= periodStart && m.periodEnd <= periodEnd);
    return candidates.length > 0 ? candidates[candidates.length - 1] : undefined;
  }

  setPerformanceGoal(agentId: string, goal: PerformanceGoal): void {
    const list = this.goals.get(agentId) || [];
    list.push(goal);
    this.goals.set(agentId, list);
  }

  getPerformanceGoals(agentId: string): readonly PerformanceGoal[] {
    return this.goals.get(agentId) || [];
  }

  // ── Workstream G: Governance ──
  private policies: WorkforcePolicy[] = [];
  private lifecycleEvents: AgentLifecycleEvent[] = [];

  addPolicy(policy: WorkforcePolicy): void {
    this.policies.push(policy);
  }

  evaluatePolicy(scope: WorkforcePolicy['scope'], context: Record<string, unknown>): WorkforcePolicyEffect {
    const matched = this.policies.filter(p => p.scope === scope);
    if (matched.length === 0) return 'allow';
    const ctx = context || {};

    for (const p of matched) {
      if (!p.condition) {
        if (p.effect === 'deny') return 'deny';
        if (p.effect === 'require-approval') return 'require-approval';
        continue;
      }
      if (this.matchesCondition(p.condition, ctx)) {
        if (p.effect === 'deny') return 'deny';
        if (p.effect === 'require-approval') return 'require-approval';
      }
    }
    return 'allow';
  }

  private matchesCondition(condition: string, ctx: Record<string, unknown>): boolean {
    // Split on && and evaluate each sub-condition
    const parts = condition.split('&&').map(s => s.trim());
    return parts.every(part => this.evalSimpleExpr(part, ctx));
  }

  private evalSimpleExpr(expr: string, ctx: Record<string, unknown>): boolean {
    // Handle == for strings
    const eqStrMatch = expr.match(/^(\w+)\s*==\s*'([^']+)'$/);
    if (eqStrMatch) {
      return String(ctx[eqStrMatch[1]] ?? 'undefined') === eqStrMatch[2];
    }

    // Handle == for boolean / null / number
    const eqValMatch = expr.match(/^(\w+)\s*==\s*(null|true|false|\d+(?:\.\d+)?)$/);
    if (eqValMatch) {
      const ctxVal = ctx[eqValMatch[1]];
      const rhs = eqValMatch[2];
      if (rhs === 'null') return ctxVal === null || ctxVal === undefined;
      if (rhs === 'true') return ctxVal === true;
      if (rhs === 'false') return ctxVal === false;
      return Number(ctxVal) === Number(rhs);
    }

    // Handle < comparison for numbers
    const ltMatch = expr.match(/^(\w+)\s*<\s*(\d+(?:\.\d+)?)$/);
    if (ltMatch) {
      return Number(ctx[ltMatch[1]] ?? -1) < Number(ltMatch[2]);
    }

    // Handle .startsWith('...')
    const startsWithMatch = expr.match(/^(\w+)\.startsWith\('([^']+)'\)$/);
    if (startsWithMatch) {
      const val = String(ctx[startsWithMatch[1]] ?? '');
      return val.startsWith(startsWithMatch[2]);
    }

    // Handle != for strings
    const neqStrMatch = expr.match(/^(\w+)\s*!=\s*'([^']+)'$/);
    if (neqStrMatch) {
      return String(ctx[neqStrMatch[1]] ?? 'undefined') !== neqStrMatch[2];
    }

    // Unknown expression — deny closed-world
    return false;
  }

  listPolicies(scope?: WorkforcePolicy['scope']): readonly WorkforcePolicy[] {
    return scope ? this.policies.filter(p => p.scope === scope) : [...this.policies];
  }

  recordLifecycleEvent(event: AgentLifecycleEvent): void {
    this.lifecycleEvents.push({ ...event, eventId: event.eventId || nextEventId(), timestamp: event.timestamp || Date.now() });
  }

  getAgentLifecycle(agentId: string): readonly AgentLifecycleEvent[] {
    return this.lifecycleEvents.filter(e => e.agentId === agentId);
  }
}
