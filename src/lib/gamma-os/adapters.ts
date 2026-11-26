import type {
  CapabilityDescriptor,
  ExecutionRequest,
  ExecutionResult,
  GovernanceDecision,
  ServiceDescriptor,
  WorkflowRequest,
} from "./contracts";

export type AdapterKind =
  | "mission-control"
  | "workflow"
  | "execution"
  | "queue"
  | "approval"
  | "permissions"
  | "plugin"
  | "analytics"
  | "memory"
  | "custom";

export interface AdapterDescriptor {
  adapterId: string;
  name: string;
  version: string;
  kind: AdapterKind;
  status: ServiceDescriptor["status"];
  capabilities: string[];
}

export interface WorkflowAdapterContract {
  descriptor: AdapterDescriptor;
  validate(request: WorkflowRequest): GovernanceDecision;
  toExecutionRequest(request: WorkflowRequest): ExecutionRequest;
}

export interface ExecutionAdapterContract {
  descriptor: AdapterDescriptor;
  executePreview(request: ExecutionRequest): ExecutionResult;
}

export interface CapabilityAdapterContract {
  descriptor: AdapterDescriptor;
  listCapabilities(): CapabilityDescriptor[];
}

export interface AdapterMap {
  workflowAdapters: ReadonlyArray<WorkflowAdapterContract>;
  executionAdapters: ReadonlyArray<ExecutionAdapterContract>;
  capabilityAdapters: ReadonlyArray<CapabilityAdapterContract>;
}
