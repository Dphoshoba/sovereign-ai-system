import type {
  CapabilityDescriptor,
  ExecutionRequest,
  ExecutionResult,
  GovernanceDecision,
  ServiceDescriptor,
  WorkflowRequest,
} from "./contracts";

export interface GovernancePort {
  evaluateWorkflow(request: WorkflowRequest): GovernanceDecision;
  evaluateExecution(request: ExecutionRequest): GovernanceDecision;
}

export interface CapabilityPort {
  getCapability(capabilityId: string): CapabilityDescriptor | undefined;
  listCapabilities(): CapabilityDescriptor[];
  listDeterministicCapabilities(): CapabilityDescriptor[];
  isCapabilityCompatible(
    capabilityId: string,
    requestedCapabilityIds: string[]
  ): boolean;
}

export interface ServiceRegistryPort {
  register(service: ServiceDescriptor): void;
  unregister(serviceId: string): boolean;
  get(serviceId: string): ServiceDescriptor | undefined;
  list(): ServiceDescriptor[];
  listByCapability(capabilityId: string): ServiceDescriptor[];
  listByStatus(status: ServiceDescriptor["status"]): ServiceDescriptor[];
}

export interface OrchestrationPort {
  validateRequest(request: WorkflowRequest): GovernanceDecision;
  planExecution(request: WorkflowRequest): ExecutionRequest;
  coordinateExecution(request: ExecutionRequest): ExecutionResult;
}
