export type GammaAgentRole =
  | "research"
  | "medical-review"
  | "writer"
  | "reviewer"
  | "image"
  | "video"
  | "publisher"
  | "analytics";

export interface AgentCollaborationInput {
  missionId: string;
  currentTime: Date;
  requestedRoles: readonly GammaAgentRole[];
}

export interface AgentHandoff {
  id: string;
  from: GammaAgentRole;
  to: GammaAgentRole;
  checkpoint: "governance-review";
  approvalRequired: true;
  auditRoute: string;
}

export interface AgentCollaborationPlan {
  id: string;
  missionId: string;
  owner: "gamma";
  status: "collaboration-preview-ready" | "blocked";
  generatedAt: Date;
  agents: GammaAgentRole[];
  handoffs: AgentHandoff[];
  publishingBlocked: true;
  governanceRequired: true;
  blockers: string[];
}

const AGENT_ORDER: GammaAgentRole[] = [
  "research",
  "medical-review",
  "writer",
  "reviewer",
  "image",
  "video",
  "publisher",
  "analytics",
];

function normalizeRoles(roles: readonly GammaAgentRole[]): GammaAgentRole[] {
  const unique = new Set(roles);
  return AGENT_ORDER.filter((role) => unique.has(role));
}

export function planAgentCollaboration(
  input: AgentCollaborationInput
): AgentCollaborationPlan {
  const agents = normalizeRoles(input.requestedRoles);
  const blockers: string[] = [];

  if (agents.length < 2) {
    blockers.push("At least two specialized agents are required for collaboration.");
  }

  const handoffs: AgentHandoff[] = agents.slice(0, -1).map((from, index) => {
    const to = agents[index + 1];
    return {
      id: `handoff_${input.missionId}_${from}_to_${to}`,
      from,
      to,
      checkpoint: "governance-review",
      approvalRequired: true,
      auditRoute: `audit://gamma/multi-agent/${input.missionId}/${from}/${to}`,
    };
  });

  return {
    id: `agent_plan_${input.missionId}`,
    missionId: input.missionId,
    owner: "gamma",
    status: blockers.length === 0 ? "collaboration-preview-ready" : "blocked",
    generatedAt: new Date(input.currentTime),
    agents,
    handoffs,
    publishingBlocked: true,
    governanceRequired: true,
    blockers,
  };
}

export function buildPhaseXIXReadiness(): {
  phase: "XIX";
  name: "Multi-Agent Collaboration";
  supportedAgentRoles: GammaAgentRole[];
  agentRule: "no-agent-publishes";
} {
  return {
    phase: "XIX",
    name: "Multi-Agent Collaboration",
    supportedAgentRoles: [...AGENT_ORDER],
    agentRule: "no-agent-publishes",
  };
}
