export type ApprovalDecision = 'APPROVED' | 'DENIED' | 'PENDING';

export type ApprovalLevel = 'NONE' | 'STANDARD' | 'HEIGHTENED' | 'CRITICAL';

export interface ApprovalRequest {
  approvalId: string;
  executionId: string;
  connectorId: string;
  operation: string;
  riskLevel: string;
  requiredLevel: ApprovalLevel;
  requestedAt: string;
  context: {
    queueId: string;
    decisionId: string;
    planHash: string;
  };
}

export interface ApprovalVerdict {
  decision: ApprovalDecision;
  approvedAt: string | null;
  approvedBy: string | null;
  approvalLevel: ApprovalLevel;
  conditions: string[];
  reason: string;
}

export interface ApprovalGate {
  evaluate(request: ApprovalRequest): Promise<ApprovalVerdict>;
}
