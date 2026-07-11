import { describe, expect, it } from "vitest";
import type { OrchestrationPlan, RuntimeEvent, WorkflowRequest } from "../../../src/lib/gamma-os/contracts";
import { BindingRegistry, type BindingDescriptor } from "../../../src/lib/gamma-os/bindings/binding-registry";
import { orchestrateWorkflowRequest } from "../../../src/lib/gamma-os/orchestrator/orchestrator";
import {
  applyRuntimeEvent,
  createRuntimeSnapshot,
  initializeRuntimeSession,
} from "../../../src/lib/gamma-os/runtime/runtime-state-machine";

function baseWorkflowRequest(overrides: Partial<WorkflowRequest> = {}): WorkflowRequest {
  return {
    requestId: "req-stage-5",
    workflowId: "wf-stage-5",
    workflowVersion: "1.0.0",
    trigger: {
      type: "scheduled",
      source: "scheduler",
    },
    input: {
      digest: true,
      region: "global",
    },
    organization: {
      tenantId: "tenant-1",
      organizationId: "org-1",
      environment: "prod",
    },
    requestedBy: "runtime@gamma.local",
    ...overrides,
  };
}

function binding(id: string, capabilities: string[]): BindingDescriptor {
  return {
    id,
    domain: "connector",
    capabilities: [...capabilities],
    health: "healthy",
    source: "test-source",
    version: "1.0.0",
    governance: {
      approvalRequired: true,
      humanReviewRequired: true,
      auditRequired: true,
      previewOnly: true,
    },
  };
}

function registryWithBindings(bindings: BindingDescriptor[]): BindingRegistry {
  const registry = new BindingRegistry();
  for (const item of bindings) registry.register(item);
  return registry;
}

function plannedStage4Plan(overrides: Partial<WorkflowRequest> = {}): OrchestrationPlan {
  const registry = registryWithBindings([
    binding("b-trigger", ["trigger:scheduled"]),
    binding("b-source", ["source:scheduler"]),
    binding("b-input-digest", ["input:digest"]),
    binding("b-input-region", ["input:region"]),
  ]);

  return orchestrateWorkflowRequest({
    workflowRequest: baseWorkflowRequest(overrides),
    bindingRegistry: registry,
  });
}

function event(
  eventId: string,
  type: RuntimeEvent["type"],
  checkpointId?: string,
  reason?: string
): RuntimeEvent {
  return {
    eventId,
    type,
    actor: "operator@gamma.local",
    occurredAt: "2026-07-11T00:00:00.000Z",
    checkpointId,
    reason,
  };
}

describe("gamma-os stage 5 runtime state machine", () => {
  it("initializes a preview-ready runtime session from a planned orchestration plan", () => {
    const plan = plannedStage4Plan();

    const session = initializeRuntimeSession({
      sessionId: "session-1",
      plan,
    });

    expect(session.status).toBe("preview-ready");
    expect(session.executionAllowed).toBe(false);
    expect(session.checkpoints.map((checkpoint) => checkpoint.checkpointId)).toEqual(
      [...session.checkpoints.map((checkpoint) => checkpoint.checkpointId)].sort((a, b) =>
        a.localeCompare(b)
      )
    );
  });

  it("projects blocked plans as blocked sessions without creating execution permission", () => {
    const registry = registryWithBindings([binding("b-trigger", ["trigger:scheduled"])]);
    const plan = orchestrateWorkflowRequest({
      workflowRequest: baseWorkflowRequest(),
      bindingRegistry: registry,
    });

    const session = initializeRuntimeSession({
      sessionId: "session-blocked",
      plan,
    });

    expect(session.status).toBe("blocked");
    expect(session.blockers.join(" ")).toContain("Missing bindings");
    expect(session.executionAllowed).toBe(false);
  });

  it("transitions through preview, approval, and audit checkpoints deterministically", () => {
    const session = initializeRuntimeSession({
      sessionId: "session-flow",
      plan: plannedStage4Plan(),
    });

    const previewCheckpoint = session.checkpoints.find((checkpoint) => checkpoint.route === "preview")!;
    const afterPreview = applyRuntimeEvent({
      session,
      event: event("evt-1", "preview-acknowledged", previewCheckpoint.checkpointId),
    });

    expect(afterPreview.status).toBe("awaiting-approval");

    let current = afterPreview;
    for (const checkpoint of current.checkpoints.filter((item) => item.route === "approval")) {
      current = applyRuntimeEvent({
        session: current,
        event: event(`evt-approval-${checkpoint.checkpointId}`, "approval-checkpoint-satisfied", checkpoint.checkpointId),
      });
    }

    expect(current.status).toBe("awaiting-audit");

    for (const checkpoint of current.checkpoints.filter((item) => item.route === "audit")) {
      current = applyRuntimeEvent({
        session: current,
        event: event(`evt-audit-${checkpoint.checkpointId}`, "audit-checkpoint-satisfied", checkpoint.checkpointId),
      });
    }

    expect(current.status).toBe("completed");
    expect(current.executionAllowed).toBe(false);
  });

  it("does not mutate prior runtime sessions when applying events", () => {
    const session = initializeRuntimeSession({
      sessionId: "session-immutable",
      plan: plannedStage4Plan(),
    });
    const original = JSON.parse(JSON.stringify(session));
    const previewCheckpoint = session.checkpoints.find((checkpoint) => checkpoint.route === "preview")!;

    applyRuntimeEvent({
      session,
      event: event("evt-immutable", "preview-acknowledged", previewCheckpoint.checkpointId),
    });

    expect(session).toEqual(original);
  });

  it("rejects checkpoint events that target the wrong route", () => {
    const session = initializeRuntimeSession({
      sessionId: "session-route-guard",
      plan: plannedStage4Plan(),
    });
    const approvalCheckpoint = session.checkpoints.find((checkpoint) => checkpoint.route === "approval")!;

    expect(() =>
      applyRuntimeEvent({
        session,
        event: event("evt-wrong-route", "preview-acknowledged", approvalCheckpoint.checkpointId),
      })
    ).toThrow("cannot satisfy approval checkpoint");
  });

  it("creates immutable runtime snapshots as projection-only artifacts", () => {
    const session = initializeRuntimeSession({
      sessionId: "session-snapshot",
      plan: plannedStage4Plan(),
    });

    const snapshot = createRuntimeSnapshot({
      snapshotId: "snapshot-1",
      session,
    });

    expect(snapshot.immutableProjection).toBe(true);
    expect(snapshot.executionAllowed).toBe(false);
    expect(snapshot.checkpointSummary.pending).toBeGreaterThan(0);
    expect(snapshot.eventCount).toBe(0);
  });

  it("blocks explicitly through event projection without persistence or connector execution signals", () => {
    const session = initializeRuntimeSession({
      sessionId: "session-event-block",
      plan: plannedStage4Plan(),
    });

    const blocked = applyRuntimeEvent({
      session,
      event: event("evt-block", "session-blocked", undefined, "Operator halted runtime projection."),
    });
    const serialized = JSON.stringify(blocked).toLowerCase();

    expect(blocked.status).toBe("blocked");
    expect(serialized).not.toContain("writefile");
    expect(serialized).not.toContain("prisma");
    expect(serialized).not.toContain("connector.execute");
  });
});
