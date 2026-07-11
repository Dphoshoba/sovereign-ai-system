import type { WorkflowRequest } from "../contracts";
import type { BindingDescriptor } from "../bindings/binding-registry";

export interface ExecutionContext {
  requestId: string;
  workflowId: string;
  organization: WorkflowRequest["organization"];
  workflowRequest: WorkflowRequest;
  requiredCapabilities: string[];
  availableBindings: BindingDescriptor[];
}

export function createExecutionContext(params: {
  workflowRequest: WorkflowRequest;
  requiredCapabilities: string[];
  availableBindings: BindingDescriptor[];
}): ExecutionContext {
  const { workflowRequest, requiredCapabilities, availableBindings } = params;

  return {
    requestId: workflowRequest.requestId,
    workflowId: workflowRequest.workflowId,
    organization: { ...workflowRequest.organization },
    workflowRequest: {
      ...workflowRequest,
      trigger: { ...workflowRequest.trigger },
      input: { ...workflowRequest.input },
      memoryRefs: workflowRequest.memoryRefs
        ? workflowRequest.memoryRefs.map((ref) => ({ ...ref }))
        : undefined,
      auditRef: workflowRequest.auditRef ? { ...workflowRequest.auditRef } : undefined,
      organization: { ...workflowRequest.organization },
    },
    requiredCapabilities: [...requiredCapabilities].sort((a, b) =>
      a.localeCompare(b)
    ),
    availableBindings: [...availableBindings].map((binding) => ({
      ...binding,
      capabilities: [...binding.capabilities],
      governance: { ...binding.governance },
    })),
  };
}
