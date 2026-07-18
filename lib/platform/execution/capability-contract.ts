export type RiskLevel = 'READ' | 'MODIFY' | 'DESTRUCTIVE';

export type ApprovalLevel = 'NONE' | 'STANDARD' | 'HEIGHTENED' | 'CRITICAL';

export interface ConnectorCapabilityProfile {
  connectorId: string;
  connectorVersion: string;

  supportedOperations: OperationCapability[];
}

export interface OperationCapability {
  operation: string;

  canDryRun: boolean;
  canExecute: boolean;
  canVerify: boolean;
  canRollback: boolean;

  supportsIdempotency: boolean;

  riskLevel: RiskLevel;
  requiredApprovalLevel: ApprovalLevel;

  requiredScopes: string[];

  parameters: OperationParameter[];
}

export interface OperationParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  description: string;
}

export const STAGE_3B_MINIMUM_CAPABILITIES: ConnectorCapabilityProfile = {
  connectorId: '*',
  connectorVersion: '1.0.0',
  supportedOperations: [],
};
