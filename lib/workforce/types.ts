// ── Workstream A: Workforce Identity ──

export type AuthorityLevel = 'advisory' | 'operational' | 'supervisory' | 'managerial';
export type SecurityClassification = 'public' | 'internal' | 'confidential' | 'executive';
export type AgentStatus = 'active' | 'inactive' | 'suspended' | 'retired';

export interface AgentIdentity {
  agentId: string;
  name: string;
  office: string;
  role: string;
  manager: string | null;
  capabilities: string[];
  authorityLevel: AuthorityLevel;
  securityClassification: SecurityClassification;
  status: AgentStatus;
  version: string;
  owner: string;
  createdAt: number;
  updatedAt: number;
}

// ── Workstream B: Skills & Capability Registry ──

export interface Skill {
  skillId: string;
  name: string;
  category: string;
  version: string;
  description: string;
  requiresApproval: boolean;
  relatedSkills: string[];
}

export interface AgentSkillAssignment {
  agentId: string;
  skillId: string;
  proficiency: number; // 0.0 – 1.0
  assignedAt: number;
  expiresAt: number | null;
}

// ── Workstream C: Workforce Communications ──

export type MessageType =
  | 'request'
  | 'response'
  | 'delegation'
  | 'escalation'
  | 'broadcast'
  | 'collaboration'
  | 'approval'
  | 'completion'
  | 'exception';

export interface WorkforceMessage {
  messageId: string;
  type: MessageType;
  sender: string;
  recipient: string;
  payload: unknown;
  timestamp: number;
  correlationId: string;
  auditRef: string;
  priority: number;
}

// ── Workstream D: Task Lifecycle ──

export type TaskStatus =
  | 'created'
  | 'accepted'
  | 'planning'
  | 'executing'
  | 'review'
  | 'completed'
  | 'escalated'
  | 'blocked'
  | 'cancelled'
  | 'deferred';

export interface AuditEntry {
  action: string;
  agentId: string;
  timestamp: number;
  detail: string;
}

export interface Task {
  taskId: string;
  type: string;
  summary: string;
  assignedTo: string;
  assignedBy: string;
  status: TaskStatus;
  priority: number;
  dependencies: string[];
  humanApprovalRequired: boolean;
  created: number;
  accepted: number | null;
  completed: number | null;
  auditTrail: AuditEntry[];
}

// ── Workstream E: Human Collaboration ──

export type CollaborationMode = 'inform' | 'consult' | 'recommend' | 'act-autonomously' | 'escalate' | 'stop';

export interface CollaborationRule {
  actionType: string;
  defaultMode: CollaborationMode;
  escalateAfterMs: number | null;
}

export interface HumanCollaborationRequest {
  requestId: string;
  agentId: string;
  actionType: string;
  context: unknown;
  mode: CollaborationMode;
  requestedAt: number;
  resolvedAt: number | null;
  resolution: 'approved' | 'denied' | 'modified' | 'escalated' | null;
  resolvedBy: string | null;
}

// ── Workstream F: Performance & Learning ──

export interface AgentMetrics {
  agentId: string;
  periodStart: number;
  periodEnd: number;
  tasksCompleted: number;
  averageResponseTimeMs: number;
  qualityScore: number;
  escalationFrequency: number;
  collaborationEffectiveness: number;
  utilization: number;
  governanceCompliance: number;
}

export interface PerformanceGoal {
  metric: keyof AgentMetrics;
  target: number;
  weight: number;
}

// ── Workstream G: Workforce Governance ──

export type WorkforcePolicyEffect = 'allow' | 'deny' | 'require-approval';

export interface WorkforcePolicy {
  policyId: string;
  name: string;
  scope: 'identity' | 'skills' | 'communications' | 'tasks' | 'collaboration' | 'performance' | 'lifecycle';
  effect: WorkforcePolicyEffect;
  condition: string;
  description: string;
}

export interface AgentLifecycleEvent {
  eventId: string;
  agentId: string;
  eventType: 'onboarded' | 'role-changed' | 'capability-added' | 'capability-removed' | 'suspended' | 'reactivated' | 'retired' | 'version-updated';
  timestamp: number;
  performedBy: string;
  detail: string;
}

// ── Platform Errors ──

export class WorkforcePlatformError extends Error {
  constructor(message: string) { super(message); this.name = 'WorkforcePlatformError'; }
}
