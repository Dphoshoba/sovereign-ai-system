import {
  AgentIdentity, AgentStatus, AuthorityLevel, SecurityClassification,
  Skill, AgentSkillAssignment,
  WorkforceMessage, MessageType,
  Task, TaskStatus, AuditEntry,
  CollaborationMode, CollaborationRule, HumanCollaborationRequest,
  AgentMetrics, PerformanceGoal,
  WorkforcePolicy, WorkforcePolicyEffect, AgentLifecycleEvent,
  WorkforcePlatformError,
} from './types';

export interface WorkforcePlatform {
  // ── Workstream A: Identity ──
  registerAgent(identity: AgentIdentity): void;
  getAgent(agentId: string): AgentIdentity | undefined;
  updateAgentStatus(agentId: string, status: AgentStatus): void;
  updateAgentManager(agentId: string, manager: string): void;
  listAgentsByOffice(office: string): readonly AgentIdentity[];
  listAllAgents(): readonly AgentIdentity[];

  // ── Workstream B: Skills ──
  registerSkill(skill: Skill): void;
  getSkill(skillId: string): Skill | undefined;
  assignSkillToAgent(agentId: string, skillId: string, proficiency: number): void;
  removeSkillFromAgent(agentId: string, skillId: string): void;
  getAgentSkills(agentId: string): readonly AgentSkillAssignment[];
  findAgentsBySkill(skillId: string, minProficiency: number): readonly string[];
  listAllSkills(): readonly Skill[];

  // ── Workstream C: Communications ──
  sendMessage(message: WorkforceMessage): void;
  getAgentInbox(agentId: string): readonly WorkforceMessage[];
  getAgentOutbox(agentId: string): readonly WorkforceMessage[];
  getConversation(correlationId: string): readonly WorkforceMessage[];
  getConversationByType(agentId: string, type: MessageType): readonly WorkforceMessage[];

  // ── Workstream D: Task Lifecycle ──
  createTask(task: Task): void;
  acceptTask(taskId: string, agentId: string): void;
  updateTaskStatus(taskId: string, status: TaskStatus, agentId: string, detail: string): void;
  getTask(taskId: string): Task | undefined;
  getAgentTasks(agentId: string): readonly Task[];
  getTasksByStatus(status: TaskStatus): readonly Task[];

  // ── Workstream E: Human Collaboration ──
  setCollaborationRule(rule: CollaborationRule): void;
  getCollaborationMode(actionType: string): CollaborationRule | undefined;
  requestHumanReview(request: HumanCollaborationRequest): void;
  resolveHumanReview(requestId: string, resolution: HumanCollaborationRequest['resolution'], resolvedBy: string): void;
  getPendingHumanReviews(agentId?: string): readonly HumanCollaborationRequest[];
  getHumanReviewHistory(agentId: string): readonly HumanCollaborationRequest[];

  // ── Workstream F: Performance ──
  recordMetrics(metrics: AgentMetrics): void;
  getAgentMetrics(agentId: string, periodStart: number, periodEnd: number): AgentMetrics | undefined;
  setPerformanceGoal(agentId: string, goal: PerformanceGoal): void;
  getPerformanceGoals(agentId: string): readonly PerformanceGoal[];

  // ── Workstream G: Governance ──
  addPolicy(policy: WorkforcePolicy): void;
  evaluatePolicy(scope: WorkforcePolicy['scope'], context: unknown): WorkforcePolicyEffect;
  listPolicies(scope?: WorkforcePolicy['scope']): readonly WorkforcePolicy[];
  recordLifecycleEvent(event: AgentLifecycleEvent): void;
  getAgentLifecycle(agentId: string): readonly AgentLifecycleEvent[];
}
