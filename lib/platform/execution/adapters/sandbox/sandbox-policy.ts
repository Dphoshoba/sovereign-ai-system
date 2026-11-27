export interface SandboxPolicyConfig {
  sandboxCalendarId: string;
  allowedOperations: string[];
  maxEventsPerExecution: number;
  requireApproval: boolean;
  requireIdempotency: boolean;
  requireRollbackPlan: boolean;
  requireVerification: boolean;
  credentialScope: string;
}

export const DEFAULT_SANDBOX_POLICY: SandboxPolicyConfig = {
  sandboxCalendarId: 'sandbox-test-calendar@group.calendar.google.com',
  allowedOperations: ['events.insert', 'events.update', 'events.delete'],
  maxEventsPerExecution: 1,
  requireApproval: true,
  requireIdempotency: true,
  requireRollbackPlan: true,
  requireVerification: true,
  credentialScope: 'sandbox-only',
};

export interface SandboxPolicyCheckResult {
  passed: boolean;
  violations: SandboxPolicyViolation[];
}

export interface SandboxPolicyViolation {
  code: string;
  message: string;
  field: string;
}

export class SandboxPolicy {
  constructor(private config: SandboxPolicyConfig = DEFAULT_SANDBOX_POLICY) {}

  getConfig(): SandboxPolicyConfig {
    return this.config;
  }

  verifyIsolation(operation: string, targetCalendarId: string): SandboxPolicyCheckResult {
    const violations: SandboxPolicyViolation[] = [];

    if (!this.config.allowedOperations.includes(operation)) {
      violations.push({
        code: 'OPERATION_NOT_ALLOWED',
        message: `Operation '${operation}' is not in the allowed sandbox operations list`,
        field: 'operation',
      });
    }

    if (targetCalendarId !== this.config.sandboxCalendarId) {
      violations.push({
        code: 'INVALID_TARGET',
        message: `Target calendar '${targetCalendarId}' does not match sandbox calendar '${this.config.sandboxCalendarId}'`,
        field: 'calendarId',
      });
    }

    return { passed: violations.length === 0, violations };
  }
}
