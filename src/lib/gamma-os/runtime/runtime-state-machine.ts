import type {
  OrchestrationPlan,
  RuntimeCheckpoint,
  RuntimeCheckpointStatus,
  RuntimeEvent,
  RuntimeSession,
  RuntimeSessionStatus,
  RuntimeSnapshot,
} from "../contracts";
import type { RuntimeStateMachinePort } from "../interfaces";

export interface RuntimeSessionInit {
  sessionId: string;
  plan: OrchestrationPlan;
}

function sortText(values: string[]): string[] {
  return [...values].sort((a, b) => a.localeCompare(b));
}

function copyEvent(event: RuntimeEvent): RuntimeEvent {
  return {
    ...event,
    metadata: event.metadata ? { ...event.metadata } : undefined,
  };
}

function copyCheckpoint(checkpoint: RuntimeCheckpoint): RuntimeCheckpoint {
  return {
    ...checkpoint,
    obligations: sortText(checkpoint.obligations),
  };
}

function copySession(session: RuntimeSession): RuntimeSession {
  return {
    ...session,
    organizationContext: { ...session.organizationContext },
    checkpoints: session.checkpoints.map(copyCheckpoint),
    eventLog: session.eventLog.map(copyEvent),
    warnings: sortText(session.warnings),
    blockers: sortText(session.blockers),
    executionAllowed: false,
  };
}

function previewCheckpoint(plan: OrchestrationPlan): RuntimeCheckpoint {
  return {
    checkpointId: "preview:preview-route",
    route: "preview",
    status: plan.previewRoute.status === "ready" ? "pending" : "blocked",
    reason: plan.previewRoute.reason,
    obligations: ["preview-only"],
  };
}

function approvalCheckpoints(plan: OrchestrationPlan): RuntimeCheckpoint[] {
  return sortText(plan.approvalRoute.checkpoints).map((checkpoint) => ({
    checkpointId: `approval:${checkpoint}`,
    route: "approval",
    status: plan.approvalRoute.status === "ready" ? "pending" : "blocked",
    reason: plan.approvalRoute.reason,
    obligations: sortText(plan.governanceDecision.obligations),
  }));
}

function auditCheckpoints(plan: OrchestrationPlan): RuntimeCheckpoint[] {
  const references =
    plan.auditRoute.references.length > 0
      ? plan.auditRoute.references
      : [`${plan.requestId}:${plan.workflowId}`];

  return sortText(references).map((reference) => ({
    checkpointId: `audit:${reference}`,
    route: "audit",
    status: plan.auditRoute.status === "ready" ? "pending" : "blocked",
    reason: plan.auditRoute.reason,
    obligations: ["immutable-audit-projection"],
  }));
}

function blockerCheckpoints(plan: OrchestrationPlan): RuntimeCheckpoint[] {
  return sortText(plan.blockers).map((blocker, index) => ({
    checkpointId: `blocker:${index + 1}`,
    route: "blocker",
    status: "blocked",
    reason: blocker,
    obligations: ["human-governance-required"],
  }));
}

function deriveInitialStatus(plan: OrchestrationPlan): RuntimeSessionStatus {
  if (plan.status === "blocked") return "blocked";
  return "preview-ready";
}

function deriveStatus(checkpoints: RuntimeCheckpoint[]): RuntimeSessionStatus {
  if (checkpoints.some((checkpoint) => checkpoint.status === "blocked")) {
    return "blocked";
  }

  if (
    checkpoints.some(
      (checkpoint) =>
        checkpoint.route === "preview" && checkpoint.status === "pending"
    )
  ) {
    return "preview-ready";
  }

  if (
    checkpoints.some(
      (checkpoint) =>
        checkpoint.route === "approval" && checkpoint.status === "pending"
    )
  ) {
    return "awaiting-approval";
  }

  if (
    checkpoints.some(
      (checkpoint) =>
        checkpoint.route === "audit" && checkpoint.status === "pending"
    )
  ) {
    return "awaiting-audit";
  }

  return "completed";
}

function assertEventCanTarget(
  session: RuntimeSession,
  event: RuntimeEvent,
  route: RuntimeCheckpoint["route"]
): asserts event is RuntimeEvent & { checkpointId: string } {
  if (!event.checkpointId) {
    throw new Error(`${event.type} requires a checkpointId.`);
  }

    const checkpoint = session.checkpoints.find(
      (candidate) => candidate.checkpointId === event.checkpointId
    );

  if (!checkpoint) {
    throw new Error(`Unknown runtime checkpoint: ${event.checkpointId}`);
  }

  if (checkpoint.route !== route) {
    throw new Error(`${event.type} cannot satisfy ${checkpoint.route} checkpoint.`);
  }

  if (checkpoint.status !== "pending") {
    throw new Error(`${event.type} requires a pending checkpoint.`);
  }
}

function markCheckpoint(
  checkpoints: RuntimeCheckpoint[],
  checkpointId: string,
  status: RuntimeCheckpointStatus,
  reason?: string
): RuntimeCheckpoint[] {
  return checkpoints.map((checkpoint) => {
    if (checkpoint.checkpointId !== checkpointId) return copyCheckpoint(checkpoint);
    return {
      ...copyCheckpoint(checkpoint),
      status,
      reason: reason ?? checkpoint.reason,
    };
  });
}

export function initializeRuntimeSession(params: RuntimeSessionInit): RuntimeSession {
  const { sessionId, plan } = params;
  const checkpoints = [
    previewCheckpoint(plan),
    ...approvalCheckpoints(plan),
    ...auditCheckpoints(plan),
    ...blockerCheckpoints(plan),
  ].sort((a, b) => a.checkpointId.localeCompare(b.checkpointId));

  return {
    sessionId,
    requestId: plan.requestId,
    workflowId: plan.workflowId,
    status: deriveInitialStatus(plan),
    organizationContext: { ...plan.organizationContext },
    planStatus: plan.status,
    checkpoints,
    eventLog: [],
    warnings: sortText(plan.warnings),
    blockers: sortText(plan.blockers),
    executionAllowed: false,
  };
}

export function applyRuntimeEvent(params: {
  session: RuntimeSession;
  event: RuntimeEvent;
}): RuntimeSession {
  const session = copySession(params.session);
  const event = copyEvent(params.event);

  if (session.status === "blocked" && event.type !== "session-blocked") {
    throw new Error("Blocked runtime sessions cannot accept progression events.");
  }

  let checkpoints = session.checkpoints.map(copyCheckpoint);
  let blockers = sortText(session.blockers);

  if (event.type === "preview-acknowledged") {
    assertEventCanTarget(session, event, "preview");
    checkpoints = markCheckpoint(
      checkpoints,
      event.checkpointId,
      "satisfied",
      event.reason
    );
  } else if (event.type === "approval-checkpoint-satisfied") {
    assertEventCanTarget(session, event, "approval");
    checkpoints = markCheckpoint(
      checkpoints,
      event.checkpointId,
      "satisfied",
      event.reason
    );
  } else if (event.type === "audit-checkpoint-satisfied") {
    assertEventCanTarget(session, event, "audit");
    checkpoints = markCheckpoint(
      checkpoints,
      event.checkpointId,
      "satisfied",
      event.reason
    );
  } else {
    const reason = event.reason ?? "Runtime session blocked by explicit event.";
    const blockerCheckpoint: RuntimeCheckpoint = {
      checkpointId: `blocker:event:${event.eventId}`,
      route: "blocker",
      status: "blocked",
      reason,
      obligations: ["human-governance-required"],
    };

    blockers = sortText([...blockers, reason]);
    checkpoints = [...checkpoints, blockerCheckpoint].sort((a, b) =>
      a.checkpointId.localeCompare(b.checkpointId)
    );
  }

  return {
    ...session,
    status: deriveStatus(checkpoints),
    checkpoints,
    blockers,
    eventLog: [...session.eventLog, event].sort((a, b) =>
      a.eventId.localeCompare(b.eventId)
    ),
    executionAllowed: false,
  };
}

export function createRuntimeSnapshot(params: {
  snapshotId: string;
  session: RuntimeSession;
}): RuntimeSnapshot {
  const session = copySession(params.session);
  const checkpointSummary: Record<RuntimeCheckpointStatus, number> = {
    pending: 0,
    satisfied: 0,
    blocked: 0,
  };

  for (const checkpoint of session.checkpoints) {
    checkpointSummary[checkpoint.status] += 1;
  }

  return {
    snapshotId: params.snapshotId,
    sessionId: session.sessionId,
    requestId: session.requestId,
    workflowId: session.workflowId,
    status: session.status,
    checkpointSummary,
    eventCount: session.eventLog.length,
    blockers: sortText(session.blockers),
    immutableProjection: true,
    executionAllowed: false,
  };
}

export const RuntimeStateMachine: RuntimeStateMachinePort = {
  initializeSession: initializeRuntimeSession,
  applyEvent: applyRuntimeEvent,
  createSnapshot: createRuntimeSnapshot,
};
