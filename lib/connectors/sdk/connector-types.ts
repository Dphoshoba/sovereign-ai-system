/**
 * Connector SDK - Shared Types
 * Base interfaces and types for all connectors
 */

export type AuthType = 'oauth2' | 'api_key' | 'bot_token';
export type ExecutionStatus = 'pending' | 'preview' | 'approved' | 'queued' | 'executing' | 'completed' | 'failed';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type ConnectionStatus = 'active' | 'expired' | 'revoked';
export type RiskLevel = 'low' | 'medium' | 'high';

export interface JSONSchema {
  type?: string;
  properties?: Record<string, any>;
  required?: string[];
  [key: string]: any;
}

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  scopes: string[];
  authUrl: string;
  tokenUrl: string;
  revokeUrl?: string;
}

export interface ConnectorActionDef {
  name: string;
  displayName: string;
  description?: string;
  scope?: string;
  riskLevel: RiskLevel;
  requiresApproval: boolean;
  inputSchema: JSONSchema;
  outputSchema: JSONSchema;
}

export interface ConnectorManifest {
  key: string;
  name: string;
  provider: string;
  category: string;
  description?: string;
  authType: AuthType;
  oauthConfig?: OAuthConfig;
  actions: Record<string, ConnectorActionDef>;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  tokenType?: string;
}

export interface ConnectorConnectionData {
  id: string;
  connectorId: string;
  userId: string;
  displayName?: string;
  accountId: string;
  email?: string;
  status: ConnectionStatus;
  lastUsedAt?: Date;
  metadata?: Record<string, any>;
}

export interface ConnectorExecutionData {
  id: string;
  connectionId: string;
  actionName: string;
  actionParams: Record<string, any>;
  status: ExecutionStatus;
  preview?: Record<string, any>;
  result?: Record<string, any>;
  error?: string;
  approvalStatus: ApprovalStatus;
  approvedBy?: string;
  approvalNote?: string;
}

export interface ConnectorAuditData {
  id: string;
  connectorId: string;
  connectionId: string;
  executionId: string;
  operator: string;
  action: string;
  riskLevel: RiskLevel;
  input?: Record<string, any>;
  output?: Record<string, any>;
  status: 'success' | 'failed';
  errorMessage?: string;
  timestamp: Date;
}

export interface PreviewResult {
  action: string;
  what_will_happen: string;
  recipients?: string[];
  content?: string;
  risk_level: RiskLevel;
  safety_checks: {
    name: string;
    passed: boolean;
    message?: string;
  }[];
}

export interface ExecutionResult {
  success: boolean;
  result?: Record<string, any>;
  error?: string;
  errorCode?: string;
  retryable?: boolean;
}
